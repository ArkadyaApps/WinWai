# 🚀 Quick Start: Deploy to Cloudflare Pages

Your APK download page is ready to deploy to:
**https://winwai.arkadyaproperties.workers.dev**

## 📦 What's Included

The `/app/cloudflare-pages/` folder contains:
- ✅ `index.html` - Beautiful download page with QR code
- ✅ `README.md` - Detailed deployment instructions
- ✅ `deploy.sh` - Automated deployment script
- ✅ `.gitignore` - Prevents committing large APK files

## ⚡ Super Quick Deploy (3 Steps)

### Step 1: Build Your APK
```bash
cd /app/frontend
eas build --platform android --profile preview
```

Wait for EAS to finish building (usually 10-15 minutes).

### Step 2: Download & Place APK
1. When build completes, EAS will give you a download link
2. Download the APK
3. Rename it to `WinWaiRaffle.apk`
4. Place it in `/app/cloudflare-pages/`

```bash
# Example (replace URL with your build URL):
curl -L "https://expo.dev/artifacts/eas/YOUR_BUILD_ID.apk" -o /app/cloudflare-pages/WinWaiRaffle.apk
```

### Step 3: Deploy to Cloudflare

**Option A: Using the Deploy Script (Recommended)**
```bash
cd /app/cloudflare-pages
./deploy.sh
```

**Option B: Manual Deployment**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create Application** → **Pages**
3. Choose **Upload assets**
4. Drag and drop the entire `/app/cloudflare-pages/` folder
5. Project name: `winwai-raffle`
6. Click **Deploy**

**Option C: Using Wrangler CLI**
```bash
cd /app/cloudflare-pages
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=winwai-raffle
```

## 🎉 After Deployment

Your download page will be live at:
```
https://winwai.arkadyaproperties.workers.dev
```

Share this URL with your friends! They can:
- 📱 Scan the QR code to download
- 🔗 Click the download button
- 📋 Follow installation instructions

## 🔄 Updating the App

When you release a new version:
1. Build new APK with EAS
2. Download and rename to `WinWaiRaffle.apk`
3. Replace the file in `/app/cloudflare-pages/`
4. Run `./deploy.sh` or re-upload to Cloudflare

## 📊 Folder Structure

```
/app/cloudflare-pages/
├── index.html              # Download page
├── WinWaiRaffle.apk       # Your APK (place here)
├── README.md              # Full documentation
├── deploy.sh              # Deployment script
├── .gitignore             # Ignore APK in git
└── PLACE_APK_HERE.txt     # Reminder
```

## 💡 Tips

- **Free Hosting**: Cloudflare Pages is 100% free with unlimited bandwidth
- **Fast CDN**: Files are cached globally for fast downloads
- **Easy Updates**: Just re-upload the APK when you have a new version
- **Custom Domain**: You can add custom domains in Cloudflare dashboard

## 🆘 Need Help?

1. **Detailed Instructions**: Check `/app/cloudflare-pages/README.md`
2. **Cloudflare Docs**: https://developers.cloudflare.com/pages/
3. **EAS Build Docs**: https://docs.expo.dev/build/introduction/

## ✅ Checklist

- [ ] APK built with EAS
- [ ] APK downloaded and renamed to `WinWaiRaffle.apk`
- [ ] APK placed in `/app/cloudflare-pages/`
- [ ] Deployed to Cloudflare Pages
- [ ] Tested download page works
- [ ] Shared URL with friends

---

**Ready to deploy?** Just run:
```bash
cd /app/cloudflare-pages && ./deploy.sh
```
