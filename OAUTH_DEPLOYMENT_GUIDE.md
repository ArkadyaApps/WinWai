# Google OAuth Deployment Guide 🚀

## Configuration Overview

Your Google OAuth is configured with a new Client ID. The client secret is stored securely in environment variables only.

---

## Google Cloud Console Setup ✅

### Authorized Redirect URIs

Add this ONE URI:
```
https://winwai.up.railway.app/auth/google/callback
```

### Authorized JavaScript Origins

Add these TWO origins:
```
https://winwai.up.railway.app
http://localhost:3000
```

---

## Railway Environment Variables

⚠️ **IMPORTANT:** Add these to your Railway backend service:

1. Go to Railway Dashboard → Your Backend Service → **Variables**
2. Add:
   - **Name:** `GOOGLE_CLIENT_SECRET`
   - **Value:** (Get from Google Cloud Console - OAuth Client Secret)

**Note:** The secret should NEVER be committed to Git. Only store in Railway environment variables.

---

## Code Updates ✅ (Already Done)

✅ **Frontend:** Client ID updated in AuthContext.tsx
✅ **Backend:** OAuth flow implemented with environment variable for secret
✅ **Backend .env:** Local secret configured (not committed to Git)

---

## Deployment Steps

### 1. Add Secret to Railway

In Railway dashboard:
- Backend service → Variables
- Add `GOOGLE_CLIENT_SECRET` with your OAuth client secret from Google Cloud Console

### 2. Deploy Backend

```bash
# Option A: Push to GitHub (recommended)
git add .
git commit -m "Update OAuth configuration"
git push origin main

# Option B: Railway CLI
cd /app/backend
railway up
```

### 3. Build Production APK

```bash
cd /app/frontend

# Verify Expo version
yarn list expo

# Should show: expo@51.0.39

# Build APK
eas build --platform android --profile production
```

---

## OAuth Flow

1. ✅ User clicks "Sign in with Google"
2. ✅ Opens Google OAuth page (Chrome Custom Tab)
3. ✅ User authenticates with Google
4. ✅ Redirects to: `https://winwai.up.railway.app/auth/google/callback?code=XXXXX`
5. ✅ Frontend extracts authorization code
6. ✅ Frontend calls: `POST /api/auth/google/exchange` with code
7. ✅ Backend exchanges code with Google for tokens
8. ✅ Backend verifies token and gets user info
9. ✅ Backend creates/updates user in Railway MongoDB
10. ✅ Backend grants admin role (for netcorez13@gmail.com)
11. ✅ Backend returns session token
12. ✅ App navigates to home screen

---

## Testing Checklist

### After Deployment:

1. ✅ Install new APK on Android device
2. ✅ Open WinWai app
3. ✅ Click "Sign in with Google"
4. ✅ Verify OAuth opens in Chrome Custom Tab
5. ✅ Sign in with Google account
6. ✅ Verify redirect back to app
7. ✅ Verify navigation to home screen
8. ✅ Check profile page - admin badge should show
9. ✅ Verify Admin Mode switch is visible

### Verify in Database:

```bash
# Connect to Railway MongoDB
mongosh "mongodb://mongo:FnXTYnmOeaJpJESGCRjHlghqESFMENwo@yamanote.proxy.rlwy.net:29774/test_database?authSource=admin"

# Check user role
db.users.findOne({email: 'netcorez13@gmail.com'})
```

Should show `role: "admin"`

---

## Troubleshooting

### Issue: "GOOGLE_CLIENT_SECRET not configured"

**Fix:** Add the secret to Railway environment variables (see step 1 above)

### Issue: "Invalid redirect_uri"

**Fix:** Verify the exact URI in Google Cloud Console matches:
```
https://winwai.up.railway.app/auth/google/callback
```

### Issue: "Failed to exchange code"

**Check:**
1. Client secret is correct in Railway
2. Backend has latest code deployed
3. Redirect URI matches in Google Cloud Console

---

## Security Best Practices ✅

✅ **Client Secret:** Only in environment variables (never in code)
✅ **Backend .env:** Added to `.gitignore` (not committed)
✅ **Railway Variables:** Secure storage for production secrets
✅ **Authorization Code Flow:** Industry-standard OAuth 2.0

---

## Summary

All OAuth code is ready and secure:

- ✅ Client ID updated in frontend
- ✅ Backend uses environment variables for secrets
- ✅ No secrets committed to Git
- ✅ Standard OAuth 2.0 authorization code flow
- ✅ Admin auto-grant configured
- ✅ Railway deployment ready

**Next Step:** Add `GOOGLE_CLIENT_SECRET` to Railway and deploy! 🚀
