# Project Context: Calendly Clone

## Project Summary

This project is a lightweight Calendly-style booking app deployed entirely on Cloudflare's free tier. The goal is to support a single host user (me) who authenticates with Google, exposes public booking links, and lets guests schedule meetings without creating accounts. Guests only need a calendar invite via email.

## Platform & Architecture

**Runtime**: Cloudflare Workers for backend API (serverless, edge).

**Database**: Cloudflare D1 (serverless SQLite) for persistent data:
- `users` (only host accounts, storing Google identity)
- `events` (time slots the host offers)
- `bookings` (guest reservations of specific event slots)
- `event_types` (predefined event types like 30min, 1hr, etc.)
- `availability` (working hours configuration)

**Hosting**: Cloudflare Pages for the frontend (Solid.js SPA).

**State model**:
- Backend is the source of truth (D1)
- Frontend keeps minimal local state (currently loaded user, events, and booking forms) and fetches from Workers

**Security/auth**:
- Google OAuth for the host via standard authorization code flow
- Store tokens securely server-side (D1 or KV) and never expose refresh tokens to the client
- Guests are anonymous and identified only by email/name in bookings

## Core Concepts and Data Model

**User**: host account who signs in with Google; one row in users. Fields: internal id, google_id, email, name, timestamps.

**Event**: a bookable time slot created by the host. Fields: id, host_user_id, start_time, end_time, optional metadata (title, description), status.

**Booking**: a guest's reservation of one event. Fields: id, event_id, guest metadata (guest_email, guest_name, notes), timestamps, status.

**Event Type**: predefined event types with durations (e.g., 30min, 1hr). Fields: id, host_user_id, name, duration_minutes, description.

**Availability**: working hours configuration for the host. Fields: id, host_user_id, day_of_week, start_time, end_time, enabled.

**Relationships**:
- `users.id` → `events.host_user_id`
- `events.id` → `bookings.event_id`
- `users.id` → `event_types.host_user_id`
- `users.id` → `availability.host_user_id`

**Indexes**:
- Events by host_user_id + start_time to quickly fetch availability
- Bookings by event_id to check conflicts

## Main Features (Initial Scope)

1. **Host authentication** (Google OAuth)
2. **Host dashboard**:
   - View upcoming events
   - Create/update/delete available slots
   - Manage event types
   - Configure working hours and availability
3. **Public booking page**:
   - List available slots
   - Guest selects slot, submits name/email/notes
   - App creates booking, prevents double-booking
4. **Calendar integration**:
   - Sync host Google Calendar
   - Create events in host calendar on successful booking
   - Generate Google Meet links automatically
5. **Email/notification layer**:
   - Send confirmation with calendar invite to guest and host
   - (Reminders to be added later)

## Technology Stack

- **Frontend**: Solid.js with Vite
- **Backend**: Cloudflare Workers / Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: Google OAuth 2.0
- **Email**: Resend API
- **Deployment**: GitHub Actions
- **UI**: Minimal/functional design

## Cloudflare-Specific Setup

Use Wrangler CLI for all infra:
- Create Worker project
- Create D1 database
- Bind D1 DB to Worker via `wrangler.toml` (binding = "DB")
- Apply SQL schema from `schema.sql` (users, events, bookings, event_types, availability tables)

Frontend and backend are separate:
- Backend: Worker routes (`/api/events`, `/api/bookings`, `/api/auth/google/*`, `/api/calendar/*`)
- Frontend: Pages app calls those routes

## Development Philosophy

Keep everything as simple and lightweight as possible:
- Single-host assumption (no multi-tenant complexity)
- Minimal schema: just enough fields for core features
- No heavy frontend state libraries at first; fetch on demand

Build in layers:
1. Core D1 schema and simple CRUD Worker endpoints
2. Very basic frontend that hits those endpoints
3. Add OAuth once the local booking flow works
4. Add calendar sync and notifications

## Reference

This project is inspired by [CloudMeet](https://github.com/dennisklappe/CloudMeet), an open-source Calendly alternative running on Cloudflare's free tier. We've adapted it to use Solid.js instead of Svelte, Resend instead of Emailit, and Google Calendar only (not Outlook).

