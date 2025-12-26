import type { RequestHandler, PagesFunctionContext, D1Database } from '../../../../src/types/cloudflare';

export const onRequest: RequestHandler = async (context: PagesFunctionContext) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/events/', '');

  // Get authenticated user (simplified - should verify JWT from cookie)
  const userId = await getUserIdFromRequest(request, env);

  // GET /api/events - List available events (public) or all events (host)
  if (method === 'GET' && (path === '' || path === 'available')) {
    const isPublic = path === 'available' || !userId;
    
    if (isPublic) {
      // Public: return only events without bookings and in the future
      const now = Math.floor(Date.now() / 1000);
      const result = await (env.DB as D1Database).prepare(
        `SELECT e.*
         FROM events e
         LEFT JOIN bookings b ON e.id = b.event_id
         WHERE e.start_time > ? AND b.id IS NULL
         ORDER BY e.start_time ASC
         LIMIT 100`
      ).bind(now).all();

      return Response.json({ events: result.results || [] });
    } else {
      // Host: return all their events with booking info
      const result = await (env.DB as D1Database).prepare(
        `SELECT e.*, COUNT(b.id) as booking_count
         FROM events e
         LEFT JOIN bookings b ON e.id = b.event_id
         WHERE e.host_user_id = ?
         GROUP BY e.id
         ORDER BY e.start_time DESC
         LIMIT 100`
      ).bind(userId).all();

      return Response.json({ events: result.results || [] });
    }
  }

  // POST /api/events - Create event (host only)
  if (method === 'POST' && path === '') {
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { start_time, end_time, title, description } = body;

    if (!start_time || !end_time) {
      return Response.json({ error: 'start_time and end_time are required' }, { status: 400 });
    }

    const result = await (env.DB as D1Database).prepare(
      `INSERT INTO events (host_user_id, start_time, end_time, title, description)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`
    ).bind(userId, start_time, end_time, title || null, description || null).first();

    return Response.json({ event: result }, { status: 201 });
  }

  // PUT /api/events/:id - Update event (host only)
  if (method === 'PUT' && path) {
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { start_time, end_time, title, description } = body;

    // Verify event belongs to user
    const existing = await (env.DB as D1Database).prepare(
      'SELECT id FROM events WHERE id = ? AND host_user_id = ?'
    ).bind(parseInt(path), userId).first();

    if (!existing) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(end_time);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(parseInt(path));

    const result = await (env.DB as D1Database).prepare(
      `UPDATE events SET ${updates.join(', ')} WHERE id = ? RETURNING *`
    ).bind(...values).first();

    return Response.json({ event: result });
  }

  // DELETE /api/events/:id - Delete event (host only)
  if (method === 'DELETE' && path) {
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify event belongs to user
    const existing = await (env.DB as D1Database).prepare(
      'SELECT id FROM events WHERE id = ? AND host_user_id = ?'
    ).bind(parseInt(path), userId).first();

    if (!existing) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    await (env.DB as D1Database).prepare('DELETE FROM events WHERE id = ?').bind(parseInt(path)).run();

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

