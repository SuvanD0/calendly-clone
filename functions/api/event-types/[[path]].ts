import type { RequestHandler, PagesFunctionContext, D1Database } from '../../../src/types/cloudflare';

export const onRequest: RequestHandler = async (context: PagesFunctionContext) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/event-types/', '');

  const userId = await getUserIdFromRequest(request, env);

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // GET /api/event-types - List event types for host
  if (method === 'GET' && path === '') {
    const result = await (env.DB as D1Database).prepare(
      'SELECT * FROM event_types WHERE host_user_id = ? ORDER BY duration_minutes ASC'
    ).bind(userId).all();

    return Response.json({ event_types: result.results || [] });
  }

  // POST /api/event-types - Create event type
  if (method === 'POST' && path === '') {
    const body = await request.json();
    const { name, duration_minutes, description, color } = body;

    if (!name || !duration_minutes) {
      return Response.json({ error: 'name and duration_minutes are required' }, { status: 400 });
    }

    const result = await (env.DB as D1Database).prepare(
      `INSERT INTO event_types (host_user_id, name, duration_minutes, description, color)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`
    ).bind(userId, name, duration_minutes, description || null, color || null).first();

    return Response.json({ event_type: result }, { status: 201 });
  }

  // PUT /api/event-types/:id - Update event type
  if (method === 'PUT' && path) {
    const body = await request.json();
    const { name, duration_minutes, description, color } = body;

    // Verify event type belongs to user
    const existing = await (env.DB as D1Database).prepare(
      'SELECT id FROM event_types WHERE id = ? AND host_user_id = ?'
    ).bind(parseInt(path), userId).first();

    if (!existing) {
      return Response.json({ error: 'Event type not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (duration_minutes !== undefined) {
      updates.push('duration_minutes = ?');
      values.push(duration_minutes);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = unixepoch()');
    values.push(parseInt(path));

    const result = await (env.DB as D1Database).prepare(
      `UPDATE event_types SET ${updates.join(', ')} WHERE id = ? RETURNING *`
    ).bind(...values).first();

    return Response.json({ event_type: result });
  }

  // DELETE /api/event-types/:id - Delete event type
  if (method === 'DELETE' && path) {
    // Verify event type belongs to user
    const existing = await (env.DB as D1Database).prepare(
      'SELECT id FROM event_types WHERE id = ? AND host_user_id = ?'
    ).bind(parseInt(path), userId).first();

    if (!existing) {
      return Response.json({ error: 'Event type not found' }, { status: 404 });
    }

    await (env.DB as D1Database).prepare('DELETE FROM event_types WHERE id = ?').bind(parseInt(path)).run();

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

