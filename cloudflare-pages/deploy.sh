#!/bin/bash

# WinWai Raffle - Cloudflare Pages Deployment Script
# This script helps you deploy to Cloudflare Pages

set -e

echo "🎟️ WinWai Raffle - Cloudflare Pages Deployment"
echo "================================================"
echo ""

# Check if APK exists
if [ ! -f "WinWaiRaffle.apk" ]; then
    echo "❌ Error: WinWaiRaffle.apk not found!"
    echo ""
    echo "Please follow these steps first:"
    echo "1. Build APK: cd /app/frontend && eas build --platform android --profile preview"
    echo "2. Download the APK from EAS build output"
    echo "3. Rename it to 'WinWaiRaffle.apk'"
    echo "4. Place it in /app/cloudflare-pages/"
    echo ""
    exit 1
fi

# Check APK size
APK_SIZE=$(du -h WinWaiRaffle.apk | cut -f1)
echo "✅ APK found: $APK_SIZE"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler CLI not found. Installing..."
    npm install -g wrangler
    echo "✅ Wrangler installed"
    echo ""
fi

# Login check
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

echo ""
echo "📦 Deploying to Cloudflare Pages..."
echo "Project: winwai-raffle"
echo "URL: https://winwai.arkadyaproperties.workers.dev"
echo ""

# Deploy
wrangler pages deploy . --project-name=winwai-raffle

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your download page is now live at:"
echo "   https://winwai.arkadyaproperties.workers.dev"
echo ""
echo "📱 Share this URL with your friends!"
echo ""
