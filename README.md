# Calendly Clone

A lightweight Calendly-style booking app deployed entirely on Cloudflare's free tier. This project is inspired by [CloudMeet](https://github.com/dennisklappe/CloudMeet) but adapted to use Solid.js, Resend for emails, and Google Calendar only.

## Features

- **Google OAuth Authentication** - Secure login for hosts
- **Public Booking Page** - Guests can book meetings without creating accounts
- **Google Calendar Integration** - Automatic calendar sync and Google Meet link generation
- **Email Notifications** - Booking confirmations via Resend
- **Event Management** - Create, update, and delete available time slots
- **Booking Management** - View and manage all bookings from the dashboard

## Tech Stack

- **Frontend**: Solid.js with Vite
- **Backend**: Cloudflare Workers / Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: Google OAuth 2.0
- **Email**: Resend API
- **Deployment**: GitHub Actions

## Setup

### Prerequisites

- Node.js 20+
- Cloudflare account
- Google Cloud Console project with OAuth credentials
- Resend account (for email notifications)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Calendly-Clone
npm install
```

### 2. Create Cloudflare D1 Database

```bash
npx wrangler d1 create calendly-db
```

Copy the database ID and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "calendly-db"
database_id = "your-database-id-here"
```

### 3. Initialize Database Schema

```bash
npm run db:init
```

### 4. Configure Environment Variables

Create a `.dev.vars` file for local development:

```env
APP_URL=http://localhost:8788
JWT_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8788/api/auth/google/callback` (for local) and your production URL

### 6. Local Development

```bash
npm run dev
```

Visit `http://localhost:8788`

## Deployment

### GitHub Actions Setup

1. Add the following secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
   - `GOOGLE_CLIENT_ID` - Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
   - `JWT_SECRET` - Random secret for session tokens
   - `RESEND_API_KEY` - Resend API key
   - `EMAIL_FROM` - Email address for sending notifications
   - `APP_URL` - Your production URL (e.g., `https://your-project.pages.dev`)

2. Push to `main` branch or manually trigger the workflow

### Manual Deployment

```bash
npm run build
npm run deploy
```

## Project Structure

```
.
├── functions/          # Cloudflare Pages Functions (API routes)
│   └── api/
│       ├── auth/      # Authentication endpoints
│       ├── events/    # Event management
│       ├── bookings/ # Booking management
│       └── calendar/ # Calendar integration
├── src/               # Solid.js frontend
│   ├── pages/        # Page components
│   ├── lib/          # Utilities and API client
│   └── App.tsx       # Main app component
├── migrations/        # Database migrations
├── schema.sql        # Database schema
├── wrangler.toml    # Cloudflare configuration
└── package.json      # Dependencies
```

## API Endpoints

- `GET /api/events/available` - List available events (public)
- `GET /api/events` - List all events (host only)
- `POST /api/events` - Create event (host only)
- `PUT /api/events/:id` - Update event (host only)
- `DELETE /api/events/:id` - Delete event (host only)
- `POST /api/bookings` - Create booking (public)
- `GET /api/bookings` - List bookings (host only)
- `DELETE /api/bookings/:id` - Cancel booking (host only)
- `GET /api/auth/google/login` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/calendar/availability` - Check calendar availability
- `POST /api/calendar/sync` - Sync with Google Calendar

## License

MIT

## Acknowledgments

Inspired by [CloudMeet](https://github.com/dennisklappe/CloudMeet) - an open-source Calendly alternative.

