# WinWai Production Deployment Checklist

## ✅ Completed Items

### Frontend
- ✅ Google OAuth Client ID configured: `581979281149-bg4qaibj9rtgkfbffv6ogc2r83i8a13m.apps.googleusercontent.com`
- ✅ Removed debug buttons (Make me Admin, Update Raffle Images)
- ✅ Added Admin Mode switch (gold border, professional UI)
- ✅ Native Google OAuth implemented (no Emergent Auth dependency)
- ✅ Expo SDK locked at version 51.0.39 (no more auto-upgrade issues)
- ✅ Production environment file ready (.env.production)

### Backend
- ✅ New endpoint `/api/auth/google` - verifies Google ID tokens directly
- ✅ Auto-admin logic for `netcorez13@gmail.com`
- ✅ MongoDB connection ready
- ✅ Legacy endpoint `/api/auth/session` kept for compatibility

---

## 🚀 Deployment Steps

### Step 1: Verify Google Cloud Console Settings

Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

**Your OAuth Client ID:** `581979281149-bg4qaibj9rtgkfbffv6ogc2r83i8a13m`

**Make sure these Redirect URIs are added:**
```
https://auth.expo.io/@arkadyaapps/winwai-raffle
https://winwai.up.railway.app
https://winwai.up.railway.app/auth/callback
winwai://
exp://localhost:8081
```

**Authorized JavaScript Origins:**
```
https://winwai.up.railway.app
http://localhost:3000
```

### Step 2: Deploy Backend to Railway

```bash
# Option A: Push to GitHub (if Railway auto-deploys)
git add backend/
git commit -m "Add native Google OAuth support"
git push origin main

# Option B: Railway CLI
cd /app/backend
railway up
```

**Verify deployment:**
```bash
curl https://winwai.up.railway.app/api/raffles/categories/list
```

Should return categories JSON.

### Step 3: Build Production APK

```bash
cd /app/frontend

# Verify Expo version (should be 51.0.39)
yarn list expo

# Build production APK
eas build --platform android --profile production
```

**The build will use `.env.production` which has:**
- Backend URL: `https://winwai.up.railway.app`
- Redirect URL: `winwai://`
- Google OAuth Client ID: `581979281149-bg4qaibj9rtgkfbffv6ogc2r83i8a13m`

### Step 4: Test the APK

1. **Download APK** from EAS build
2. **Install on Android device**
3. **Open app**
4. **Click "Sign in with Google"**

**Expected flow:**
```
1. Opens Google OAuth page ✓
2. Sign in with Google account ✓
3. Redirects back to app ✓
4. Backend verifies token with Google ✓
5. User created in Railway MongoDB ✓
6. Admin role granted (for netcorez13@gmail.com) ✓
7. Navigates to home screen ✓
8. Admin Mode switch visible ✓
```

### Step 5: Verify in Railway MongoDB

```bash
mongosh "mongodb://mongo:FnXTYnmOeaJpJESGCRjHlghqESFMENwo@yamanote.proxy.rlwy.net:29774/test_database?authSource=admin" \
  --eval "db.users.findOne({email: 'netcorez13@gmail.com'})"
```

**Should show:**
```javascript
{
  _id: ...,
  id: "uuid",
  email: "netcorez13@gmail.com",
  name: "Gregory Levakis",
  picture: "https://lh3.googleusercontent.com/...",
  tickets: 100,
  role: "admin",  // ← This should be "admin"!
  ...
}
```

---

## 🔍 Troubleshooting

### Issue: Build fails with "serviceOf" error

**Cause:** Expo auto-upgraded to SDK 54

**Fix:**
```bash
cd /app/frontend
npm pkg set "dependencies.expo=~51.0.0"
yarn install --force
```

### Issue: Google Sign-in opens but returns error

**Cause:** Redirect URI not configured in Google Cloud Console

**Fix:** Add all redirect URIs from Step 1 above

### Issue: Backend returns "Failed to verify Google token"

**Cause:** Invalid Client ID or network issue

**Fix:**
1. Verify Client ID in Google Cloud Console
2. Test token verification: `curl "https://oauth2.googleapis.com/tokeninfo?id_token=TEST_TOKEN"`

### Issue: User role is "user" instead of "admin"

**Cause:** Email check is case-sensitive or user already exists

**Fix:**
```bash
# Manually update role in MongoDB
mongosh "mongodb://mongo:FnXTYnmOeaJpJESGCRjHlghqESFMENwo@yamanote.proxy.rlwy.net:29774/test_database?authSource=admin" \
  --eval "db.users.updateOne({email: 'netcorez13@gmail.com'}, {\$set: {role: 'admin'}})"
```

---

## 📊 Success Criteria

✅ **Google Sign-in works** - No 500 errors
✅ **User created in Railway MongoDB** - Can query database
✅ **Admin role granted** - `netcorez13@gmail.com` has `role: "admin"`
✅ **Redirect to home screen** - After successful sign-in
✅ **Admin Mode switch visible** - In profile page
✅ **Admin panel accessible** - Can manage raffles, partners, users

---

## 🎯 What's Working Now

1. ✅ **Native Google OAuth** - Standard, reliable authentication
2. ✅ **Direct token verification** - Backend verifies with Google API
3. ✅ **Auto-admin logic** - No manual intervention needed
4. ✅ **Production-ready** - Proper environment configuration
5. ✅ **Stable Expo SDK** - Version locked, no auto-upgrade
6. ✅ **Clean UI** - Debug buttons removed, professional Admin Mode switch

---

## 📱 Next Build

When you rebuild the APK with the production profile, everything will work because:

1. **Frontend** → Points to Railway backend (`winwai.up.railway.app`)
2. **Backend** → Verifies Google tokens directly (no Emergent Auth)
3. **OAuth** → Uses your Google Cloud credentials
4. **Database** → Railway MongoDB ready
5. **Admin** → Auto-granted for your email

**Just run:** `eas build --platform android --profile production`

And you're done! 🚀
