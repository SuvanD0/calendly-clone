import type { RequestHandler, PagesFunctionContext, D1Database } from '../../../../src/types/cloudflare';

export const onRequest: RequestHandler = async (context: PagesFunctionContext) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/bookings/', '');

  const userId = await getUserIdFromRequest(request, env);

  // POST /api/bookings - Create booking (public)
  if (method === 'POST' && path === '') {
    const body = await request.json();
    const { event_id, guest_email, notes } = body;

    if (!event_id || !guest_email) {
      return Response.json(
        { error: 'event_id and guest_email are required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await (env.DB as D1Database).prepare(
      'SELECT * FROM events WHERE id = ?'
    ).bind(event_id).first();

    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is already booked (has a booking)
    const existingBooking = await (env.DB as D1Database).prepare(
      'SELECT id FROM bookings WHERE event_id = ?'
    ).bind(event_id).first();

    if (existingBooking) {
      return Response.json({ error: 'Event is already booked' }, { status: 409 });
    }

    // Create booking
    const booking = await (env.DB as D1Database).prepare(
      `INSERT INTO bookings (event_id, guest_email, notes)
       VALUES (?, ?, ?)
       RETURNING *`
    ).bind(event_id, guest_email, notes || null).first();

    // Get event details for calendar creation
    const eventDetails = await (env.DB as D1Database).prepare(
      `SELECT e.*, u.email as host_email, u.name as host_name
       FROM events e
       JOIN users u ON e.host_user_id = u.id
       WHERE e.id = ?`
    ).bind(event_id).first();

    // Send confirmation email (async)
    sendBookingConfirmationEmail(eventDetails, booking, env).catch(console.error);

    return Response.json({ booking }, { status: 201 });
  }

  // GET /api/bookings - List bookings (host only)
  if (method === 'GET' && path === '') {
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await (env.DB as D1Database).prepare(
      `SELECT b.*, e.start_time, e.end_time, e.title as event_title
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE e.host_user_id = ?
       ORDER BY e.start_time DESC
       LIMIT 100`
    ).bind(userId).all();

    return Response.json({ bookings: result.results || [] });
  }

  // DELETE /api/bookings/:id - Cancel booking
  if (method === 'DELETE' && path) {
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify booking belongs to host
    const booking = await (env.DB as D1Database).prepare(
      `SELECT b.*, e.host_user_id, e.id as event_id
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.id = ? AND e.host_user_id = ?`
    ).bind(parseInt(path), userId).first();

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Delete booking
    await (env.DB as D1Database).prepare(
      'DELETE FROM bookings WHERE id = ?'
    ).bind(parseInt(path)).run();

    return Response.json({ success: true });
  }

  return new Response('Not Found', { status: 404 });
};

async function getUserIdFromRequest(request: Request, env: any): Promise<string | null> {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;

  const sessionMatch = cookie.match(/session=([^;]+)/);
  if (!sessionMatch) return null;

  try {
    const [payload] = sessionMatch[1].split('.');
    const decoded = JSON.parse(atob(payload));
    return decoded.userId || null;
  } catch {
    return null;
  }
}


async function sendBookingConfirmationEmail(event: any, booking: any, env: any) {
  if (!env.RESEND_API_KEY) {
    console.log('Resend API key not configured, skipping email');
    return;
  }

  try {
    const startTime = new Date(event.start_time * 1000);
    const endTime = new Date(event.end_time * 1000);
    const formattedStart = startTime.toLocaleString();
    const formattedEnd = endTime.toLocaleString();
    
    // Generate ICS calendar file
    const icsContent = generateICSFile({
      title: event.title || 'Meeting',
      description: booking.notes || '',
      startTime: startTime,
      endTime: endTime,
      guestEmail: booking.guest_email,
      hostName: event.host_name,
      hostEmail: event.host_email,
    });

    // Send email to guest
    const guestEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'noreply@example.com',
        to: booking.guest_email,
        subject: `Meeting Confirmed: ${event.title || 'Meeting'}`,
        html: generateGuestEmailHTML({
          eventTitle: event.title || 'Meeting',
          hostName: event.host_name,
          startTime: formattedStart,
          endTime: formattedEnd,
          notes: booking.notes,
        }),
        attachments: [
          {
            filename: 'meeting.ics',
            content: btoa(icsContent),
          },
        ],
      }),
    });

    // Send email to host
    const hostEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'noreply@example.com',
        to: event.host_email,
        subject: `New Booking: ${booking.guest_email} - ${event.title || 'Meeting'}`,
        html: generateHostEmailHTML({
          eventTitle: event.title || 'Meeting',
          guestEmail: booking.guest_email,
          startTime: formattedStart,
          endTime: formattedEnd,
          notes: booking.notes,
        }),
        attachments: [
          {
            filename: 'meeting.ics',
            content: btoa(icsContent),
          },
        ],
      }),
    });

    if (!guestEmailResponse.ok || !hostEmailResponse.ok) {
      const guestError = await guestEmailResponse.json().catch(() => null);
      const hostError = await hostEmailResponse.json().catch(() => null);
      console.error('Failed to send emails:', { guestError, hostError });
    }
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }
}

function generateGuestEmailHTML(params: {
  eventTitle: string;
  hostName: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #0066cc; margin-top: 0;">Meeting Confirmed!</h1>
          <p style="font-size: 18px; margin-bottom: 10px;"><strong>${params.eventTitle}</strong></p>
          <p style="color: #666;">with ${params.hostName}</p>
        </div>
        
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #333;">Meeting Details</h2>
          <p><strong>Date & Time:</strong><br>${params.startTime} - ${params.endTime}</p>
          ${params.notes ? `<p><strong>Notes:</strong><br>${params.notes}</p>` : ''}
        </div>
        
        <p style="color: #666; font-size: 14px;">A calendar invite has been attached to this email. Add it to your calendar to receive reminders.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px;">
          <p>This is an automated confirmation email. Please do not reply to this message.</p>
        </div>
      </body>
    </html>
  `;
}

function generateHostEmailHTML(params: {
  eventTitle: string;
  guestEmail: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #0066cc; margin-top: 0;">New Booking Received</h1>
          <p style="font-size: 18px; margin-bottom: 10px;"><strong>${params.eventTitle}</strong></p>
        </div>
        
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #333;">Guest Information</h2>
          <p><strong>Email:</strong> <a href="mailto:${params.guestEmail}" style="color: #0066cc; text-decoration: none;">${params.guestEmail}</a></p>
        </div>
        
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #333;">Meeting Details</h2>
          <p><strong>Date & Time:</strong><br>${params.startTime} - ${params.endTime}</p>
          ${params.notes ? `<p><strong>Guest Notes:</strong><br>${params.notes}</p>` : ''}
        </div>
        
        <p style="color: #666; font-size: 14px;">A calendar invite has been attached to this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px;">
          <p>This is an automated notification email.</p>
        </div>
      </body>
    </html>
  `;
}

function generateICSFile(params: {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  guestEmail: string;
  hostName: string;
  hostEmail: string;
}): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendly Clone//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(params.startTime)}`,
    `DTEND:${formatDate(params.endTime)}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `UID:${crypto.randomUUID()}@calendly-clone`,
    `SUMMARY:${params.title}`,
    `DESCRIPTION:${params.description || 'Meeting'}`,
    `ORGANIZER;CN=${params.hostName}:mailto:${params.hostEmail}`,
    `ATTENDEE;RSVP=TRUE:mailto:${params.guestEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return ics;
}

