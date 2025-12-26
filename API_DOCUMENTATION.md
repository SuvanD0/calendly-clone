# API Documentation

Complete API reference for the Calendly Clone application.

## Base URL

- **Local Development**: `http://localhost:8788`
- **Production**: Your Cloudflare Pages URL

## Authentication

Most endpoints require authentication via Google OAuth. After successful OAuth, a session cookie is set.

### Public Endpoints
- `GET /api/events/available` - List available events
- `POST /api/bookings` - Create a booking

### Protected Endpoints
All other endpoints require authentication (session cookie).

## Endpoints

### Events

#### List Available Events (Public)
```http
GET /api/events/available
```

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "host_user_id": "uuid",
      "start_time": 1704067200,
      "end_time": 1704070800,
      "title": "30 Minute Meeting",
      "description": "Quick catch-up",
      "status": "available"
    }
  ]
}
```

#### List All Events (Host)
```http
GET /api/events
```

**Headers:**
- `Cookie: session=<token>`

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "host_user_id": "uuid",
      "start_time": 1704067200,
      "end_time": 1704070800,
      "title": "30 Minute Meeting",
      "booking_count": 0
    }
  ]
}
```

#### Create Event
```http
POST /api/events
Content-Type: application/json

{
  "event_type_id": 1,
  "start_time": 1704067200,
  "end_time": 1704070800,
  "title": "Meeting Title",
  "description": "Optional description"
}
```

#### Update Event
```http
PUT /api/events/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "cancelled"
}
```

#### Delete Event
```http
DELETE /api/events/:id
```

### Bookings

#### Create Booking (Public)
```http
POST /api/bookings
Content-Type: application/json

{
  "event_id": 1,
  "guest_email": "guest@example.com",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "booking": {
    "id": 1,
    "event_id": 1,
    "guest_email": "guest@example.com",
    "notes": "Optional notes",
    "status": "confirmed",
    "created_at": 1704067200
  }
}
```

#### List Bookings (Host)
```http
GET /api/bookings
```

**Response:**
```json
{
  "bookings": [
    {
      "id": 1,
      "event_id": 1,
      "guest_email": "guest@example.com",
      "notes": "Notes",
      "start_time": 1704067200,
      "end_time": 1704070800,
      "event_title": "Meeting Title"
    }
  ]
}
```

#### Cancel Booking
```http
DELETE /api/bookings/:id
```

### Event Types

#### List Event Types
```http
GET /api/event-types
```

#### Create Event Type
```http
POST /api/event-types
Content-Type: application/json

{
  "name": "30 Minute Meeting",
  "duration_minutes": 30,
  "description": "Quick catch-up",
  "color": "#0066cc"
}
```

#### Update Event Type
```http
PUT /api/event-types/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "duration_minutes": 45
}
```

#### Delete Event Type
```http
DELETE /api/event-types/:id
```

### Availability

#### List Availability
```http
GET /api/availability
```

**Response:**
```json
{
  "availability": [
    {
      "id": 1,
      "day_of_week": 1,
      "start_time": "09:00",
      "end_time": "17:00",
      "enabled": 1
    }
  ]
}
```

**Note:** `day_of_week` is 0-6 (Sunday-Saturday)

#### Create/Update Availability
```http
POST /api/availability
Content-Type: application/json

{
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00",
  "enabled": 1
}
```

#### Delete Availability
```http
DELETE /api/availability/:day_of_week
```

### Calendar

#### Check Availability
```http
GET /api/calendar/availability?start=2024-01-01T00:00:00Z&end=2024-01-08T00:00:00Z
```

#### Sync Calendar
```http
POST /api/calendar/sync
```

### Authentication

#### Initiate Google OAuth
```http
GET /api/auth/google/login
```

Redirects to Google OAuth consent screen.

#### OAuth Callback
```http
GET /api/auth/google/callback?code=<code>&state=<state>
```

Handled automatically by OAuth flow. Sets session cookie on success.

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (e.g., event already booked)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.

