# Cloudflare Pages Functions Routing: `[[path]].ts` Explained

## The Concept

The `[[path]].ts` filename is a **catch-all route** in Cloudflare Pages Functions. The double brackets `[[...]]` mean "capture any path segment(s) and make it available as a parameter."

## Routing Patterns

Cloudflare Pages Functions uses file-based routing with special naming conventions:

| Pattern | Example File | Matches | Captures |
|---------|-------------|---------|----------|
| `index.ts` | `/api/events/index.ts` | `/api/events` | - |
| `[param].ts` | `/api/events/[id].ts` | `/api/events/123` | `id = "123"` |
| `[[path]].ts` | `/api/events/[[path]].ts` | `/api/events/*` (any path) | `path = "..."` |

## How `[[path]].ts` Works

### File Structure
```
functions/
  api/
    events/
      [[path]].ts    ← Catches ALL routes under /api/events/*
```

### What It Matches

The `[[path]].ts` file will handle **ALL** requests to:
- `/api/events` (empty path)
- `/api/events/123` (single segment)
- `/api/events/123/bookings` (multiple segments)
- `/api/events/anything/you/want` (any depth)

### How to Access the Path

In your code, you extract the path from the URL:

```typescript
export const onRequest: RequestHandler = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  
  // Extract the path after /api/events/
  const path = url.pathname.replace('/api/events/', '');
  
  // Now you can handle different routes manually
  if (path === '' || path === 'available') {
    // Handle GET /api/events or GET /api/events/available
  }
  
  if (path === '123') {
    // Handle GET /api/events/123
  }
  
  // etc...
};
```

## Why Use `[[path]].ts` Instead of Separate Files?

### Option 1: Separate Files (More Explicit)
```
functions/
  api/
    events/
      index.ts          → /api/events
      [id].ts           → /api/events/:id
      [id]/bookings.ts  → /api/events/:id/bookings
```

**Pros:**
- Clear separation of concerns
- Each file handles one route
- Easier to understand at a glance

**Cons:**
- More files to manage
- Can't easily share logic between routes

### Option 2: Catch-All `[[path]].ts` (What You're Using)
```
functions/
  api/
    events/
      [[path]].ts       → /api/events/*
```

**Pros:**
- ✅ **Single file** handles all routes
- ✅ **Shared logic** (auth, DB connection, helpers)
- ✅ **Flexible routing** - handle any path structure
- ✅ **Less file clutter** - one file per API resource

**Cons:**
- Manual path parsing required
- All routing logic in one file (can get large)

## Real Example from Your Code

Looking at your `functions/api/events/[[path]].ts`:

```typescript
const path = url.pathname.replace('/api/events/', '');

// GET /api/events or /api/events/available
if (method === 'GET' && (path === '' || path === 'available')) {
  // List events
}

// POST /api/events
if (method === 'POST' && path === '') {
  // Create event
}

// PUT /api/events/:id
if (method === 'PUT' && path) {
  // Update event (path = "123")
}

// DELETE /api/events/:id
if (method === 'DELETE' && path) {
  // Delete event (path = "123")
}
```

This single file handles:
- `GET /api/events` → List all events
- `GET /api/events/available` → List available events
- `POST /api/events` → Create event
- `PUT /api/events/123` → Update event #123
- `DELETE /api/events/123` → Delete event #123

## Comparison: Your Project's Routes

### `/api/auth/google/[[path]].ts`
Handles:
- `/api/auth/google` → OAuth login initiation
- `/api/auth/google/login` → Same as above
- `/api/auth/google/callback` → OAuth callback

```typescript
const path = url.pathname.replace('/api/auth/google/', '');

if (path === '' || path === 'login') {
  // Initiate OAuth
}

if (path === 'callback') {
  // Handle OAuth callback
}
```

### `/api/events/[[path]].ts`
Handles:
- `/api/events` → List events
- `/api/events/available` → List available events
- `/api/events/123` → Get/Update/Delete event #123

### `/api/calendar/[[path]].ts`
Handles:
- `/api/calendar/availability` → Check calendar availability
- `/api/calendar/sync` → Sync calendar events

## Alternative: Using `[param].ts` for Specific Routes

If you wanted more explicit routing, you could do:

```
functions/
  api/
    events/
      index.ts        → GET/POST /api/events
      [id].ts         → GET/PUT/DELETE /api/events/:id
      available.ts    → GET /api/events/available
```

Then in `[id].ts`:
```typescript
export const onRequest: RequestHandler = async (context) => {
  const { params } = context;
  const eventId = params.id; // Automatically extracted!
  
  // Handle /api/events/:id
};
```

## When to Use Each Pattern

### Use `[[path]].ts` when:
- ✅ You want **one file per API resource**
- ✅ Routes share **common logic** (auth, validation, DB)
- ✅ You need **flexible routing** (variable path structures)
- ✅ You prefer **manual routing control**

### Use separate files when:
- ✅ Routes are **completely different** (no shared logic)
- ✅ You want **explicit, clear routing**
- ✅ Each route has **complex, independent logic**
- ✅ You prefer **file-based organization**

## Best Practices

1. **Extract path early**: Get the path at the start of your handler
2. **Handle method + path**: Check both HTTP method and path
3. **Return 404**: If no route matches, return 404
4. **Keep it organized**: Use clear if/else or switch statements
5. **Share helpers**: Extract common functions outside the handler

## Summary

`[[path]].ts` = **Catch-all route** that handles any path under that directory

- Single file handles all routes for that API resource
- You manually parse the path and route to different handlers
- Great for REST APIs where routes share common logic
- Flexible but requires manual path parsing

Think of it like Express.js routing, but file-based! 🚀

