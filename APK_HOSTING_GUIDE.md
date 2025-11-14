# APK Hosting Solutions for WinWai Raffle

Since Cloudflare Pages has a 25MB file limit, here are better alternatives:

---

## ✅ SOLUTION 1: Host on Railway Backend (RECOMMENDED - Easiest)

Your backend is already on Railway with unlimited bandwidth. Just host the APK there!

### Steps:

1. **Create APK directory in backend:**
```bash
mkdir -p /app/backend/static/apk
```

2. **Place your APK:**
```bash
# After building with EAS, download and rename
mv ~/Downloads/build-xxx.apk /app/backend/static/apk/WinWaiRaffle.apk
```

3. **Access URLs:**
   - **Production Backend**: `https://your-railway-app.railway.app/download-apk`
   - **Direct APK**: `https://your-railway-app.railway.app/download-apk`

4. **Update Cloudflare Page:**
   - Keep your beautiful download page on Cloudflare
   - Update the download button URL to point to Railway backend
   - Update QR code URL to Railway backend

### Cloudflare Page Update:

Edit `/app/cloudflare-pages/index.html`:

```html
<!-- Line 86: Update download link -->
<a href="https://YOUR-RAILWAY-APP.railway.app/download-apk" class="download-btn" download>
    📱 Download APK
</a>

<!-- Line 131: Update QR code URL -->
<script>
const downloadUrl = 'https://YOUR-RAILWAY-APP.railway.app/download-apk';
</script>
```

**Pros:**
- ✅ Free unlimited bandwidth
- ✅ Fast CDN
- ✅ Already deployed
- ✅ No extra setup needed

**Cons:**
- ⚠️ APK not version controlled (add to .gitignore)

---

## ✅ SOLUTION 2: GitHub Releases (RECOMMENDED - Most Professional)

Use GitHub Releases to host your APK files. This is what most professional apps do!

### Steps:

1. **Create a Release on GitHub:**
   ```bash
   # If you haven't pushed to GitHub yet
   cd /app
   git remote add origin https://github.com/YOUR_USERNAME/winwai-raffle.git
   git push -u origin main
   ```

2. **Go to GitHub → Your Repo → Releases → "Create a new release"**

3. **Fill in Release Details:**
   - Tag: `v1.0.0`
   - Title: `WinWai Raffle v1.0.0`
   - Description: Release notes
   - Upload APK as release asset

4. **Get Direct Download URL:**
   ```
   https://github.com/YOUR_USERNAME/winwai-raffle/releases/download/v1.0.0/WinWaiRaffle.apk
   ```

5. **Update Cloudflare Page with this URL**

**Pros:**
- ✅ Unlimited bandwidth (served by GitHub CDN)
- ✅ Version control for APKs
- ✅ Professional approach
- ✅ Easy to update (create new releases)
- ✅ Download statistics

**Cons:**
- ⚠️ Manual upload process for each version

---

## ✅ SOLUTION 3: Google Drive (Quick & Easy)

### Steps:

1. **Upload APK to Google Drive**
2. **Right-click → Share → Get link**
3. **Change to "Anyone with the link"**
4. **Copy link** (format: `https://drive.google.com/file/d/FILE_ID/view`)

5. **Convert to direct download link:**
   ```
   https://drive.google.com/uc?export=download&id=FILE_ID
   ```

6. **Use this URL in Cloudflare page**

**Pros:**
- ✅ Very easy setup
- ✅ Free 15GB storage
- ✅ Good for testing

**Cons:**
- ⚠️ Google may throttle high traffic
- ⚠️ Not ideal for production

---

## ✅ SOLUTION 4: Amazon S3 / Cloudflare R2

### Amazon S3:
```bash
aws s3 cp WinWaiRaffle.apk s3://your-bucket/WinWaiRaffle.apk --acl public-read
# URL: https://your-bucket.s3.amazonaws.com/WinWaiRaffle.apk
```

### Cloudflare R2 (Better - No Egress Fees):
```bash
wrangler r2 object put winwai-bucket/WinWaiRaffle.apk --file WinWaiRaffle.apk
# Configure public URL in Cloudflare dashboard
```

**Pros:**
- ✅ Unlimited bandwidth
- ✅ Very fast CDN
- ✅ Professional solution

**Cons:**
- ⚠️ S3: Costs money for bandwidth
- ⚠️ R2: Free but requires Cloudflare setup

---

## 🎯 RECOMMENDED APPROACH

**For Production:**
1. Use **Railway Backend** (easiest, already deployed)
2. Keep Cloudflare Pages for the landing page
3. Point download button to Railway

**For Future Versions:**
1. Set up **GitHub Releases**
2. Automate APK uploads with GitHub Actions
3. Professional version management

---

## 📝 Quick Setup Script

I'll create a script to help you choose and set up the best option.

Choose your preferred solution:
1. Railway Backend (Immediate)
2. GitHub Releases (Professional)
3. Google Drive (Quick Test)

