# Railway Production Fix Guide

## Issues Identified

### 1. **Root Cause: APK Environment Variables**
Your APK was built with **development URLs** baked in:
- `EXPO_PUBLIC_BACKEND_URL=https://winwai-raffle-1.preview.emergentagent.com`
- `EXPO_PUBLIC_REDIRECT_URL=https://winwai-raffle-1.preview.emergentagent.com`

This means your APK is calling the **local development backend**, NOT the Railway backend!

### 2. **Secondary Issue: Empty Railway Database**
The Railway MongoDB has **0 users** because:
- All sign-ins are going to the wrong backend
- No user has successfully authenticated against Railway
- Therefore, no admin role can be assigned

### 3. **UI Issues (FIXED ✅)**
- ✅ Removed "Make me Admin" debug button
- ✅ Removed "Update Raffle Images" debug button
- ✅ Added proper Admin Mode Switch (only visible to admins)

---

## Solution: Build Production APK with Railway URLs

### Step 1: Verify Production Environment Variables

**Good news!** The production environment file already exists at `/app/frontend/.env.production` with correct Railway URLs:

```bash
EXPO_PUBLIC_BACKEND_URL=https://winwai.up.railway.app
EXPO_PUBLIC_REDIRECT_URL=winwai://
```

✅ **No changes needed** - just use the production profile when building!

### Step 2: Fix Expo SDK Version (CRITICAL!)

**Before building, make sure Expo is locked at version 51.0.x:**

```bash
cd /app/frontend

# Verify Expo version
yarn list expo

# Should show: expo@51.0.39
# If it shows 54.x.x, run this fix:
npm pkg set "dependencies.expo=~51.0.0"
yarn install --force
```

✅ **Already fixed** - Expo is now locked at 51.0.39

### Step 3: Rebuild the APK with Production Profile

```bash
cd /app/frontend

# Build new production APK with Railway URLs (.env.production will be used)
eas build --platform android --profile production
```

**The `production` profile will automatically use `.env.production` which has the correct Railway URLs!**

### Step 4: Install and Test New APK

1. Download and install the newly built APK
2. Try Google Sign-in
3. The backend logs on Railway should show successful authentication
4. Check Railway MongoDB - your user should now exist with role "admin"

---

## Verification Steps

### Check if Backend is Receiving Requests

Monitor your Railway backend logs during sign-in. You should see:
```
INFO:     POST /api/auth/session
```

### Check Railway MongoDB

After successful sign-in, connect to Railway MongoDB:

```bash
mongosh "mongodb://mongo:FnXTYnmOeaJpJESGCRjHlghqESFMENwo@yamanote.proxy.rlwy.net:29774/test_database?authSource=admin"

# Check if user was created
db.users.findOne({email: 'netcorez13@gmail.com'})
```

You should see your user with `role: "admin"` because the backend code already has this logic:

```python
admin_emails = ["artteabnc@gmail.com", "netcorez13@gmail.com", "arkadyaproperties@gmail.com"]
user_role = "admin" if session_data["email"].lower() in admin_emails else "user"
```

---

## Why This Will Fix Everything

1. **Google Sign-in 500 Error**: Fixed because APK will now call Railway backend
2. **Admin Role**: Automatic - backend code already grants admin to netcorez13@gmail.com
3. **Redirect to Homepage**: Will work because authentication flow will complete successfully
4. **UI**: Already fixed - clean Admin Mode switch

---

## Alternative: Quick Test Without Rebuilding

If you want to test the Railway backend before building APK:

### Option A: Use Email/Password Sign-up

Create an account directly on Railway:

```bash
curl -X POST "https://winwai.up.railway.app/api/auth/email/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "netcorez13@gmail.com",
    "password": "TestPassword123",
    "name": "Gregory Levakis"
  }'
```

Then sign in with email/password in the app (the APK already supports this).

### Option B: Manually Grant Admin in Database

After any successful sign-in, run:

```bash
mongosh "mongodb://mongo:FnXTYnmOeaJpJESGCRjHlghqESFMENwo@yamanote.proxy.rlwy.net:29774/test_database?authSource=admin" \
  --eval "db.users.updateOne({email: 'netcorez13@gmail.com'}, {\$set: {role: 'admin'}})"
```

---

## Railway Backend Status

✅ **Backend Code**: Correctly deployed
✅ **AUTH_API_URL**: Correctly configured
✅ **MongoDB Connection**: Working
✅ **Admin Logic**: Already in place

The ONLY issue is the APK pointing to the wrong backend URL.

---

## Next Steps

1. Rebuild APK with Railway URLs (see Step 3 above)
2. Test Google Sign-in on new APK
3. Verify admin role is automatically granted
4. Verify redirect to home screen works

Let me know once you've rebuilt the APK and I can help verify everything is working!
