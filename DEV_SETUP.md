# Development Server Setup

## Current Status

✅ **Frontend Dev Server Running**: http://localhost:3000

This is running via Vite and will hot-reload your Solid.js frontend changes.

## Two Development Modes

### 1. Frontend Only (Current - Port 3000)
```bash
npm run dev
```
- ✅ Fast hot-reload for frontend
- ✅ Solid.js development
- ❌ API routes won't work (need Wrangler)

### 2. Full Stack (Recommended for Testing)
```bash
npm run build
npm run dev:pages
```
- ✅ Frontend + API routes
- ✅ Cloudflare Functions work
- ✅ D1 database access
- ⚠️ Requires rebuild on frontend changes

## Quick Start for Full Testing

1. **Build the frontend first**:
   ```bash
   npm run build
   ```

2. **Start Wrangler Pages dev server**:
   ```bash
   npm run dev:pages
   ```

3. **Access the app**: Usually at `http://localhost:8788` (Wrangler default)

## Environment Variables

Make sure `.dev.vars` is set up with:
- `RESEND_API_KEY` ✅ (already configured)
- `EMAIL_FROM` ✅ (already configured)
- `GOOGLE_CLIENT_ID` (for OAuth - add when ready)
- `GOOGLE_CLIENT_SECRET` (for OAuth - add when ready)
- `JWT_SECRET` (generate a random string)
- `APP_URL` (set to `http://localhost:8788` for Wrangler)

## Testing Email

1. Create a booking through the UI
2. Check your email inbox
3. View logs in Resend dashboard: https://resend.com/emails

## Troubleshooting

- **API routes return 404**: Use `npm run dev:pages` instead of `npm run dev`
- **Database errors**: Make sure D1 database is created and bound in `wrangler.toml`
- **Email not sending**: Check `RESEND_API_KEY` in `.dev.vars`

