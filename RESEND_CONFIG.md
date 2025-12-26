# Resend Configuration Guide

## ✅ API Key Configured

Your Resend API key has been added to `.dev.vars` for local development:
- **API Key**: `re_QU4D5k6F_MZ2C4na8t3cBCj26Uh4XZhWc`
- **From Email**: `noreply@resend.dev` (default Resend domain for testing)

## 📧 Email Domain Setup

### For Testing (Current)
- Using `noreply@resend.dev` - works immediately, no setup needed
- Perfect for development and testing

### For Production (Recommended)
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain (e.g., `yourdomain.com`)
3. Verify DNS records (SPF, DKIM, DMARC)
4. Update `EMAIL_FROM` in production environment variables to: `noreply@yourdomain.com`

## 🔒 Security Notes

✅ **`.dev.vars` is in `.gitignore`** - Your API key won't be committed to git

⚠️ **For Production**: Add these as Cloudflare Pages environment variables:
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `APP_URL`

## 📝 Current Implementation

The code uses Resend's REST API directly (perfect for Cloudflare Workers):

```typescript
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: env.EMAIL_FROM,
    to: ['recipient@example.com'],
    subject: 'Your Subject',
    html: '<p>HTML content</p>',
    attachments: [...]
  }),
});
```

## 🧪 Testing

1. **Local Testing**: 
   - Run `npm run dev`
   - Create a booking
   - Check your email inbox

2. **Resend Dashboard**:
   - View sent emails at [resend.com/emails](https://resend.com/emails)
   - Check delivery status
   - View email logs

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/emails)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)

## 🎯 Next Steps

1. ✅ API key configured - **DONE**
2. Test email sending locally
3. Set up production domain (optional but recommended)
4. Add environment variables to Cloudflare Pages for production

