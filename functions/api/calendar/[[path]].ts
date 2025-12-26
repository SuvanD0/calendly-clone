import type { RequestHandler, PagesFunctionContext, D1Database } from '../../../../src/types/cloudflare';

export const onRequest: RequestHandler = async (context: PagesFunctionContext) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/calendar/', '');

  const userId = await getUserIdFromRequest(request, env);

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // GET /api/calendar/availability - Check availability from Google Calendar
  if (method === 'GET' && path === 'availability') {
    const user = await (env.DB as D1Database).prepare(
      'SELECT google_access_token FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user?.google_access_token) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    const startTime = url.searchParams.get('start') || new Date().toISOString();
    const endTime = url.searchParams.get('end') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/freeBusy?timeMin=${startTime}&timeMax=${endTime}`,
        {
          headers: {
            'Authorization': `Bearer ${user.google_access_token}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            timeMin: startTime,
            timeMax: endTime,
            items: [{ id: 'primary' }],
          }),
        }
      );

      if (!response.ok) {
        return Response.json({ error: 'Failed to fetch calendar availability' }, { status: 500 });
      }

      const data = await response.json();
      return Response.json({ availability: data });
    } catch (error) {
      return Response.json({ error: 'Calendar API error' }, { status: 500 });
    }
  }

  // POST /api/calendar/sync - Sync calendar events
  if (method === 'POST' && path === 'sync') {
    const user = await (env.DB as D1Database).prepare(
      'SELECT google_access_token FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user?.google_access_token) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Fetch upcoming events from Google Calendar
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${user.google_access_token}`,
          },
        }
      );

      if (!response.ok) {
        return Response.json({ error: 'Failed to sync calendar' }, { status: 500 });
      }

      const data = await response.json();
      return Response.json({ events: data.items || [] });
    } catch (error) {
      return Response.json({ error: 'Calendar sync error' }, { status: 500 });
    }
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

