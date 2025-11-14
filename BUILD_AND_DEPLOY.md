# WinWai Raffle Rewards - Build & Deploy Guide

## 📱 Building the Android APK

### Prerequisites
- EAS CLI installed (`npm install -g eas-cli`)
- Logged into your Expo account (`eas login`)
- EAS project configured (already done - projectId: 019dd289-3f32-4930-9048-725d49bcb28a)

### Build APK (Production)

```bash
# Navigate to frontend directory
cd /app/frontend

# Build APK using EAS
eas build --platform android --profile preview

# Or for a production build
eas build --platform android --profile production
```

### Download and Deploy APK

Once the build completes, EAS will provide a download URL. To make it available through your app:

```bash
# Download the APK from EAS
# Replace <BUILD_URL> with the URL from EAS build output
curl -L <BUILD_URL> -o /app/backend/static/app.apk

# Or manually download and copy to:
# /app/backend/static/app.apk
```

## 🌐 Sharing the App

Once the APK is in place, share one of these URLs with your friends:

### Download Page (with QR Code)
```
https://your-domain.com/download
```

### Direct APK Download
```
https://your-domain.com/download-apk
```

## 📋 Build Profiles

The app uses these build profiles (configure in `eas.json` if needed):

- **preview**: Development build with debugging enabled
- **production**: Optimized build for distribution

### Creating eas.json (if not exists)

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 🔧 Testing the Download Flow

1. Build the APK using EAS
2. Download and place it in `/app/backend/static/app.apk`
3. Navigate to `https://your-domain.com/download`
4. Test both QR code scanning and direct download button
5. Install on Android device and verify all features work

## 📝 Notes

- The download page is automatically generated with QR code
- APK file should be named `app.apk` and placed in `/app/backend/static/`
- Users need to enable "Install from Unknown Sources" on their devices
- The current version is 1.0.0 (update in `app.config.js` for new versions)

## 🚀 Quick Deploy Checklist

- [ ] Run EAS build command
- [ ] Wait for build to complete
- [ ] Download APK from EAS
- [ ] Copy APK to `/app/backend/static/app.apk`
- [ ] Test download page at `/download`
- [ ] Share link/QR code with friends
- [ ] Verify installation and app functionality

## 🔗 Useful Commands

```bash
# Check EAS build status
eas build:list

# View build details
eas build:view <BUILD_ID>

# Cancel a running build
eas build:cancel

# Configure build credentials
eas credentials
```
