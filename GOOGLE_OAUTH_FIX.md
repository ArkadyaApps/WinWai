# Google OAuth Configuration - Updated

## Issue: OAuth Opening in Browser

The OAuth flow was opening in the browser and not redirecting back to the app properly.

## Solution: Use Custom App Scheme

Changed redirect URI to use the app's package name in reverse:
- **Old:** `https://auth.expo.io/@arkadyaapps/winwai-raffle`
- **New:** `com.winwai.raffle:/oauth2redirect`

This keeps the OAuth flow in-app and redirects back correctly.

---

## Google Cloud Console Setup

### 1. Go to Your OAuth Client

[Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

Click on: `581979281149-bg4qaibj9rtgkfbffv6ogc2r83i8a13m`

### 2. Update Redirect URIs

**Remove old redirect URIs and add this ONE:**

```
com.winwai.raffle:/oauth2redirect
```

That's it! Just this single redirect URI.

### 3. Authorized JavaScript Origins

Add these:

```
https://winwai.up.railway.app
http://localhost:3000
```

### 4. Save Changes

Click **"SAVE"** at the bottom.

---

## What Changed in Code

### Frontend (AuthContext.tsx)
```javascript
const redirectUri = 'com.winwai.raffle:/oauth2redirect';
```

### App Config (app.config.js)
Added intent filter to handle the custom scheme:
```javascript
intentFilters: [
  {
    action: "VIEW",
    data: [{ scheme: "com.winwai.raffle", host: "oauth2redirect" }],
    category: ["BROWSABLE", "DEFAULT"]
  }
]
```

---

## Testing

### Build & Test:

```bash
cd /app/frontend

# Build new APK with updated config
eas build --platform android --profile production
```

### Expected Behavior:

1. ✅ User clicks "Sign in with Google"
2. ✅ Google OAuth page opens **in-app** (not external browser)
3. ✅ User signs in
4. ✅ Redirects back to WinWai app automatically
5. ✅ Backend verifies token
6. ✅ User logged in and navigated to home screen

---

## Summary of Changes

**Google Cloud Console:**
- ✅ Redirect URI: `com.winwai.raffle:/oauth2redirect`
- ✅ JavaScript Origins: Railway URL + localhost

**Code:**
- ✅ Custom app scheme in AuthContext
- ✅ Intent filter in app.config.js
- ✅ Backend endpoint ready (`/api/auth/google`)

**Next Step:**
- Deploy backend to Railway
- Build new APK
- Test Google Sign-in!

The OAuth flow will now stay in-app and work smoothly! 🚀
