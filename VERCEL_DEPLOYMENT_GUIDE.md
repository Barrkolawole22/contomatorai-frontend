# Vercel Deployment Guide for Login Components

## 🚀 Quick Fix for Login Issues

If your login components are failing after Vercel deployment, follow these steps:

### 1. Environment Variables Setup

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com/api
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

### 2. Redeploy

After setting environment variables:
1. Trigger a new deployment in Vercel
2. Or push a new commit to redeploy automatically

### 3. Verify Configuration

Check your browser's developer console for these logs:
- `🔑 Attempting login to: https://your-backend-api-url.com/api` (should show your production API URL)
- Network tab should show requests going to your backend, not localhost

## 🔧 Troubleshooting

### Common Issues:

1. **"Network Error" or "Failed to fetch"**
   - Check `NEXT_PUBLIC_API_URL` is set correctly
   - Ensure backend CORS allows your Vercel domain

2. **401 Unauthorized**
   - Backend authentication middleware might be blocking requests
   - Check token format and expiration

3. **Login succeeds but redirect fails**
   - Check `NEXT_PUBLIC_APP_URL` is correct
   - Verify route protection logic

### Debug Steps:

1. Open browser dev tools
2. Check Network tab during login attempt
3. Look for API calls to your backend
4. Check Console for error messages
5. Verify localStorage has token after successful login

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.example.com/api` |
| `NEXT_PUBLIC_APP_URL` | Frontend app URL | `https://app.vercel.app` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Payment public key | `pk_test_...` |

## 🔍 Testing Login After Deployment

1. Try logging in with valid credentials
2. Check if token is stored in localStorage
3. Verify redirect to dashboard works
4. Test logout functionality
5. Check if protected routes work

## 📞 Support

If issues persist:
1. Check Vercel deployment logs
2. Verify backend is running and accessible
3. Test API endpoints directly (e.g., POST /api/auth/login)
4. Ensure CORS is properly configured on backend