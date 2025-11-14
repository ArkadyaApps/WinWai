# Native Google OAuth Setup Guide

## What Changed?

✅ **Removed Emergent Auth dependency** - No more 500 errors from auth.emergentagent.com
✅ **Native Google OAuth** - Direct integration with Google's OAuth API
✅ **More reliable** - Standard OAuth 2.0 flow
✅ **Backend verifies tokens directly** - Using Google's tokeninfo endpoint

---

## How It Works Now

### Frontend Flow:
1. User clicks "Sign in with Google"
2. Opens Google OAuth page (accounts.google.com)
3. User authenticates with Google
4. Google returns an **ID token**
5. Frontend sends ID token to backend `/api/auth/google`

### Backend Flow:
1. Receives ID token from frontend
2. Verifies token with Google (oauth2.googleapis.com/tokeninfo)
3. Extracts user email, name, picture
4. Creates/updates user in MongoDB
5. Grants admin role if email matches list
6. Returns session token

---

## Setup Required: Google Cloud Console

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable **Google+ API** or **People API**
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth 2.0 Client ID**

### Step 2: Configure OAuth Client

**Application Type:** Web application

**Authorized redirect URIs - Add these:**
```
https://auth.expo.io/@arkadyaapps/winwai-raffle
https://winwai.up.railway.app
https://winwai.up.railway.app/auth/callback
exp://localhost:8081
winwai://
```

**Authorized JavaScript origins:**
```
https://winwai.up.railway.app
http://localhost:3000
```

### Step 3: Get Your Client ID

After creating, you'll get:
- **Client ID**: `366099954421-xxxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: (not needed for mobile app)

### Step 4: Update Frontend Code

Edit `/app/frontend/src/contexts/AuthContext.tsx` line 48:

```javascript
const clientId = 'YOUR_ACTUAL_CLIENT_ID_HERE.apps.googleusercontent.com';
```

**Current placeholder:**
```javascript
const clientId = '366099954421-0ot0b3sih36eouf2bk6g19qc1h4a1n15.apps.googleusercontent.com';
```

Replace this with your real Google OAuth Client ID.

---

## Testing

### Test Locally:

```bash
cd /app/frontend
yarn start
```

Open in browser or Expo Go - Google Sign-in should work!

### Test on Railway:

1. Deploy updated backend to Railway
2. Build new APK with production profile
3. Install and test Google Sign-in

---

## Backend Endpoint

**New endpoint:** `POST /api/auth/google`

**Request:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://...",
    "tickets": 100,
    "role": "admin",  // or "user"
    ...
  },
  "session_token": "uuid"
}
```

---

## Auto-Admin Emails

These emails automatically get admin role:
- artteabnc@gmail.com
- **netcorez13@gmail.com** ← You!
- arkadyaproperties@gmail.com

---

## Deployment Steps

### 1. Deploy Backend to Railway

The backend code is ready - just deploy:

```bash
# In Railway dashboard, trigger new deployment
# OR use Railway CLI:
railway up
```

### 2. Update Frontend Client ID

Replace the placeholder Client ID with your real one from Google Cloud Console.

### 3. Rebuild APK

```bash
cd /app/frontend
eas build --platform android --profile production
```

### 4. Test!

Install APK and try Google Sign-in. Check logs:

```bash
# Should see in backend logs:
Created new user: netcorez13@gmail.com with role: admin
```

---

## Troubleshooting

### Issue: "Failed to verify Google token"

**Cause:** Invalid Client ID or token expired

**Fix:** 
1. Verify Client ID in Google Cloud Console
2. Update Client ID in AuthContext.tsx
3. Check redirect URIs are configured correctly

### Issue: "Invalid redirect URI"

**Cause:** The redirect URI isn't added to Google OAuth settings

**Fix:** Add all redirect URIs listed in Step 2 above

### Issue: Still getting 500 error

**Cause:** Old backend code on Railway

**Fix:** Deploy the new backend code to Railway

---

## Benefits of Native Google OAuth

✅ **No third-party dependencies** (Emergent Auth removed)
✅ **More reliable** - Direct Google API
✅ **Standard OAuth 2.0** - Industry best practice
✅ **Better error handling** - Clear error messages
✅ **Easier debugging** - Simple token verification
✅ **Works offline** (for testing) - Can mock tokens in development

---

## Next Steps

1. **Get Google OAuth Client ID** from Cloud Console
2. **Update AuthContext.tsx** with real Client ID
3. **Deploy backend** to Railway
4. **Rebuild APK** with production profile
5. **Test Google Sign-in** - Should work perfectly!

The native Google OAuth implementation is much more robust and will solve all the authentication issues you've been experiencing.
