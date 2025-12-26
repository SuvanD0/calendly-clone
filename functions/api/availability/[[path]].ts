import type { RequestHandler, PagesFunctionContext, D1Database } from '../../../src/types/cloudflare';

export const onRequest: RequestHandler = async (context: PagesFunctionContext) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/availability/', '');

  const userId = await getUserIdFromRequest(request, env);

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // GET /api/availability - List availability settings
  if (method === 'GET' && path === '') {
    const result = await (env.DB as D1Database).prepare(
      'SELECT * FROM availability WHERE host_user_id = ? ORDER BY day_of_week ASC'
    ).bind(userId).all();

    return Response.json({ availability: result.results || [] });
  }

  // POST /api/availability - Create or update availability
  if (method === 'POST' && path === '') {
    const body = await request.json();
    const { day_of_week, start_time, end_time, enabled } = body;

    if (day_of_week === undefined || !start_time || !end_time) {
      return Response.json(
        { error: 'day_of_week, start_time, and end_time are required' },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await (env.DB as D1Database).prepare(
      'SELECT id FROM availability WHERE host_user_id = ? AND day_of_week = ?'
    ).bind(userId, day_of_week).first();

    if (existing) {
      // Update
      const result = await (env.DB as D1Database).prepare(
        `UPDATE availability 
         SET start_time = ?, end_time = ?, enabled = ?, updated_at = unixepoch()
         WHERE host_user_id = ? AND day_of_week = ?
         RETURNING *`
      ).bind(start_time, end_time, enabled !== undefined ? enabled : 1, userId, day_of_week).first();

      return Response.json({ availability: result });
    } else {
      // Create
      const result = await (env.DB as D1Database).prepare(
        `INSERT INTO availability (host_user_id, day_of_week, start_time, end_time, enabled)
         VALUES (?, ?, ?, ?, ?)
         RETURNING *`
      ).bind(userId, day_of_week, start_time, end_time, enabled !== undefined ? enabled : 1).first();

      return Response.json({ availability: result }, { status: 201 });
    }
  }

  // DELETE /api/availability/:day - Delete availability for a day
  if (method === 'DELETE' && path) {
    const dayOfWeek = parseInt(path);
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return Response.json({ error: 'Invalid day_of_week' }, { status: 400 });
    }

    await (env.DB as D1Database).prepare(
      'DELETE FROM availability WHERE host_user_id = ? AND day_of_week = ?'
    ).bind(userId, dayOfWeek).run();

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

