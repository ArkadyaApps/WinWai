# WinWai Raffle Rewards - Cloudflare Pages Deployment

This folder contains everything needed to deploy your APK download page to Cloudflare Pages.

## 📁 Folder Structure

```
cloudflare-pages/
├── index.html           # Download page with QR code
├── WinWaiRaffle.apk    # Your APK file (place here)
└── README.md           # This file
```

## 🚀 Deployment Instructions

### Method 1: Cloudflare Dashboard (Easiest)

1. **Build your APK first:**
   ```bash
   cd /app/frontend
   eas build --platform android --profile preview
   ```

2. **Download and place the APK:**
   - Download the APK from EAS build output
   - Rename it to `WinWaiRaffle.apk`
   - Place it in this folder (`/app/cloudflare-pages/`)

3. **Deploy to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Workers & Pages**
   - Click **Create Application** → **Pages** → **Upload Assets**
   - Drag and drop this entire `cloudflare-pages` folder (or select files)
   - Project name: `winwai-raffle`
   - Click **Deploy Site**

4. **Configure Custom Domain (if needed):**
   - After deployment, go to **Custom Domains**
   - Add: `winwai.arkadyaproperties.workers.dev`
   - Follow DNS configuration instructions

### Method 2: Wrangler CLI

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Deploy:**
   ```bash
   cd /app/cloudflare-pages
   wrangler pages deploy . --project-name=winwai-raffle
   ```

### Method 3: Git Integration

1. **Create a new repository:**
   ```bash
   cd /app/cloudflare-pages
   git init
   git add .
   git commit -m "Initial deployment"
   ```

2. **Push to GitHub/GitLab:**
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **Connect to Cloudflare Pages:**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Click **Create Application** → **Pages** → **Connect to Git**
   - Select your repository
   - Build settings:
     - Build command: (leave empty)
     - Build output directory: `/`
   - Click **Save and Deploy**

## 🎯 Access URLs

After deployment, your site will be available at:

**Primary URL:**
```
https://winwai.arkadyaproperties.workers.dev
```

**Direct APK Download:**
```
https://winwai.arkadyaproperties.workers.dev/WinWaiRaffle.apk
```

## 📱 Sharing with Friends

Once deployed, simply share the URL:
```
https://winwai.arkadyaproperties.workers.dev
```

Your friends can:
- ✅ Scan the QR code with their phone
- ✅ Click the "Download APK" button
- ✅ Follow the installation instructions

## 🔄 Updating the APK

When you have a new version:

1. Build new APK with EAS
2. Download and rename to `WinWaiRaffle.apk`
3. Replace the file in this folder
4. Redeploy:
   - **Dashboard**: Upload the new APK file
   - **Wrangler**: Run `wrangler pages deploy .`
   - **Git**: Commit and push changes

## 📝 Notes

- **File Size Limit**: Cloudflare Pages has a 25MB per file limit (APK should be fine)
- **Caching**: APK files are cached by Cloudflare CDN for fast downloads
- **Analytics**: Enable analytics in Cloudflare Dashboard to track downloads
- **Free Tier**: Cloudflare Pages is free with unlimited bandwidth

## ✅ Checklist

- [ ] APK built with EAS
- [ ] APK renamed to `WinWaiRaffle.apk`
- [ ] APK placed in `/app/cloudflare-pages/`
- [ ] Deployed to Cloudflare Pages
- [ ] Tested download page
- [ ] Tested APK download
- [ ] Shared URL with friends

## 🆘 Troubleshooting

**APK not downloading?**
- Ensure file is named exactly `WinWaiRaffle.apk`
- Check file was included in deployment
- Clear browser cache and try again

**QR code not showing?**
- Check browser console for errors
- Ensure JavaScript is enabled
- Try different browser

**Custom domain not working?**
- Wait for DNS propagation (up to 24 hours)
- Verify DNS records in Cloudflare
- Check SSL/TLS settings

## 📞 Support

For Cloudflare Pages issues:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Community Forum](https://community.cloudflare.com/)

For WinWai app issues:
- Contact: netcorez13@gmail.com
