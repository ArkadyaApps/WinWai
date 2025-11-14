# AdMob Debugging Guide for WinWai Raffle

## 🐛 Current Issue
Button shows "ad loading" → turns grey → nothing happens → turns back pink

## 📊 Enhanced Logging Added

I've added comprehensive logging to help debug. When you rebuild and test, you'll see detailed console logs.

---

## 🔍 How to Debug

### Step 1: View Logs in Real-Time

**On Android Device (via ADB):**
```bash
# Connect your Android device via USB
# Enable USB Debugging in Developer Options

# View all logs
adb logcat

# Filter for app logs only
adb logcat | grep -i "winwai\|admob\|reward"

# Filter for React Native logs
adb logcat | grep -i "ReactNativeJS"

# Save logs to file
adb logcat > admob_debug.log
```

**On Expo Go App:**
```bash
# In your development environment
# Logs will show in the terminal where you ran `expo start`

# Or use Expo Developer Tools
expo start
# Then open: http://localhost:19002
# Click on "Logs" tab
```

### Step 2: What to Look For

**Successful Ad Load:**
```
==================== LOAD AD START ====================
🎯 Platform: android
🎯 User ID: xxx-xxx-xxx
🎯 __DEV__: true
📦 Importing AdMob module...
✅ AdMob module imported successfully
🎯 Ad Unit ID: ca-app-pub-3940256099942544~1033173712 (test)
🎯 Using test ads: YES
📝 Creating rewarded ad instance...
✅ Rewarded ad instance created
📝 Setting up event listeners...
📡 Starting ad load request...
📡 Ad load request sent (waiting for LOADED event)...
==================== LOAD AD END ====================
✅✅✅ AdMob: Rewarded ad LOADED successfully! ✅✅✅
```

**Failed Ad Load:**
```
❌❌❌ AdMob: Ad FAILED to load: [error details]
```

---

## 🔧 Common Issues & Fixes

### Issue 1: "AdMob module not installed"

**Symptom:** Error importing `react-native-google-mobile-ads`

**Fix:**
```bash
cd /app/frontend
yarn add react-native-google-mobile-ads
npx expo prebuild --clean
eas build --platform android --profile preview
```

---

### Issue 2: "Ad Unit ID not configured"

**Symptom:** Error says "Invalid Ad Unit ID"

**Fix:** Check `/app/frontend/app.config.js`:
```javascript
"react-native-google-mobile-ads": {
  "android_app_id": "ca-app-pub-3486145054830108~1319311942",
  "ios_app_id": "ca-app-pub-3486145054830108~3969526019"
}
```

**Test with Test Ads:** Set `__DEV__ = true` to use Google's test ad units

---

### Issue 3: "Ad failed to load - No fill"

**Symptom:** AdMob returns "NO_FILL" error

**Reasons:**
- Not enough ad inventory available
- Ad settings/filters are too restrictive  
- Geographic location has low ad inventory
- App is new (AdMob needs time to gather data)

**Fix:**
1. **Use Test Ads First:** Make sure `__DEV__ = true`
2. **Wait 24-48 hours** after app approval for real ads
3. **Check AdMob Dashboard:** Verify app status
4. **Enable more ad categories** in AdMob settings

---

### Issue 4: "AdMob not initialized"

**Symptom:** Error: "Google Mobile Ads SDK was not initialized"

**Fix:** Check if AdMob is initialized on app start.

**Verify in app entry:**
```typescript
// app/_layout.tsx or similar
import MobileAds from 'react-native-google-mobile-ads';

// Initialize AdMob
MobileAds.initialize()
  .then(() => console.log('✅ AdMob initialized'))
  .catch(err => console.error('❌ AdMob init failed:', err));
```

---

### Issue 5: "App ID mismatch"

**Symptom:** Console shows "App ID mismatch" warning

**Fix:** Ensure App IDs in `app.config.js` match your AdMob console:
1. Go to https://apps.admob.google.com/
2. Select your app
3. Copy App ID (format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)
4. Update `app.config.js`
5. Rebuild app

---

### Issue 6: "Ad not ready when clicked"

**Symptom:** Button is clickable but ad doesn't show

**Current Fix Applied:** 
- Ad auto-loads on screen mount
- Button waits for ad to load before enabling
- Shows "Loading ad..." subtitle

**If still happening:**
- Check logs for ad load errors
- Increase timeout in `handleWatchAd` (currently 3 seconds)

---

## 🧪 Testing Checklist

### Before Building APK:

- [ ] `app.config.js` has correct AdMob App IDs
- [ ] `react-native-google-mobile-ads` is installed
- [ ] Test ad units work (set `__DEV__ = true`)

### After Building APK:

- [ ] Install APK on Android device
- [ ] Enable USB debugging
- [ ] Connect via ADB: `adb devices`
- [ ] Open app and navigate to Tickets page
- [ ] Monitor logs: `adb logcat | grep ReactNativeJS`
- [ ] Click "Watch Ad" button
- [ ] Check console for detailed logs

### What to Check in Logs:

1. ✅ "AdMob module imported successfully"
2. ✅ "Rewarded ad instance created"
3. ✅ "Ad load request sent"
4. ⏳ Wait for "Rewarded ad LOADED successfully"
5. ❌ Or check for error message

---

## 📱 Testing with Expo Go vs Production APK

### Expo Go (Development):
- ✅ Uses test ads automatically
- ✅ Faster to test
- ⚠️ May have limitations with native modules

### Production APK (via EAS):
- ✅ Full native support
- ✅ Real ad serving
- ⚠️ Takes longer to build
- ⚠️ Need real AdMob account approved

**Recommendation:** Test with production APK for accurate results

---

## 🎯 Next Steps to Debug

1. **Rebuild APK with enhanced logging:**
   ```bash
   cd /app/frontend
   eas build --platform android --profile preview
   ```

2. **Install on Android device**

3. **Connect via ADB and monitor logs:**
   ```bash
   adb logcat | grep -i "ReactNativeJS\|AdMob"
   ```

4. **Open app → Tickets page → Click button**

5. **Share the console output with me**
   - Copy the logs between "LOAD AD START" and "LOAD AD END"
   - Include any error messages

---

## 🔗 Useful Resources

- **AdMob Help:** https://support.google.com/admob
- **Test Ads:** https://developers.google.com/admob/android/test-ads
- **React Native Google Mobile Ads:** https://docs.page/invertase/react-native-google-mobile-ads

---

## 📋 Quick Commands Reference

```bash
# View logs
adb logcat | grep ReactNativeJS

# Clear logs before test
adb logcat -c

# Save logs to file
adb logcat > logs.txt

# Check devices
adb devices

# Restart ADB
adb kill-server && adb start-server
```

---

## 💡 Most Likely Issues (in order)

1. **AdMob account not fully approved** (48 hour wait)
2. **Test ads not being used** (ensure `__DEV__ = true`)
3. **Ad network issue** (no internet or VPN blocking)
4. **Ad Unit ID mismatch** (check AdMob console)
5. **Module not properly linked** (rebuild with prebuild)

Start with #1 and #2 - these cause 80% of ad loading issues.
