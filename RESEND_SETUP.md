# Resend Email Setup

This project uses [Resend](https://resend.com/) for sending transactional emails. Resend provides a simple, developer-friendly API for sending emails.

## Configuration

### Environment Variables
Add to your `.dev.vars` (local) or Cloudflare Pages environment variables:

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### Getting Your API Key

1. Sign up at [resend.com](https://resend.com/)
2. Go to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)

### Domain Setup (Recommended)

For production, you should:

1. Add your domain in Resend dashboard
2. Verify DNS records (SPF, DKIM, DMARC)
3. Use your verified domain in `EMAIL_FROM`

## Implementation

### Current Usage

The project sends emails in the booking confirmation flow:

- **Guest Email**: Confirmation with meeting details and calendar invite
- **Host Email**: Notification of new booking with guest information

### Email Features

1. **HTML Templates**: Professional email templates with styling
2. **Calendar Invites**: ICS file attachments for calendar integration
3. **Separate Emails**: Different content for guests and hosts
4. **Error Handling**: Graceful fallback if email fails

### API Structure

We use Resend's REST API directly (no SDK needed for Cloudflare Workers):

```typescript
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'noreply@yourdomain.com',
    to: ['recipient@example.com'],
    subject: 'Your Subject',
    html: '<p>Your HTML content</p>',
    attachments: [
      {
        filename: 'file.ics',
        content: base64EncodedContent,
      },
    ],
  }),
});
```

## Email Templates

### Guest Confirmation Email
- Meeting title and host name
- Date and time
- Google Meet link (if available)
- Guest notes
- Calendar invite attachment

### Host Notification Email
- Guest information (name, email)
- Meeting details
- Guest notes
- Calendar invite attachment

## Testing

### Test Mode
Resend offers a test mode where emails are simulated. Use this for development.

### Local Testing
1. Set `RESEND_API_KEY` in `.dev.vars`
2. Use Resend's test API key or test mode
3. Check Resend dashboard for email logs

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/emails)
- [Resend Pricing](https://resend.com/pricing)

## Free Tier Limits

Resend's free tier includes:
- 3,000 emails/month
- 100 emails/day
- API access
- Email logs

Perfect for development and small-scale production use!

