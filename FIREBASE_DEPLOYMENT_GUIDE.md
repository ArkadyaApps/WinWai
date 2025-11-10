# 🚀 WinWai Raffle Backend - Firebase Deployment Guide

Complete guide for deploying the AdMob-monetized raffle system to Firebase.

---

## 📋 Prerequisites

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project** created:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project (or use existing)
   - Enable Firestore Database
   - Enable Cloud Functions
   - Set up Blaze (pay-as-you-go) plan (required for Cloud Functions)

3. **Node.js** version 18 or higher

---

## 🗂️ Project Structure

```
functions/
├── src/
│   └── index.ts              # Main functions file (copy raffle-backend-functions.ts here)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── .env                      # Environment variables (optional)

firebase.json                 # Firebase configuration
.firebaserc                   # Firebase project aliases
```

---

## ⚙️ Step-by-Step Deployment

### 1️⃣ Initialize Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project directory
firebase init

# Select:
# - Functions (use arrow keys and space to select)
# - Use an existing project (select your WinWai project)
# - TypeScript (recommended)
# - ESLint: Yes
# - Install dependencies: Yes
```

### 2️⃣ Set Up Functions Directory

```bash
cd functions

# Copy the main functions file
cp ../raffle-backend-functions.ts src/index.ts

# Install dependencies (if not already done)
npm install

# Install additional type definitions
npm install --save-dev @types/node
```

### 3️⃣ Configure TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "esModuleInterop": true
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
```

### 4️⃣ Update package.json

Ensure your package.json has the correct dependencies:

```json
{
  "name": "winwai-raffle-functions",
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 5️⃣ Configure Firestore Security Rules

Create/update `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Raffles - readable by all, writable only by admins
    match /raffles/{raffleId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Entries - users can read their own, write requires auth
    match /entries/{entryId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && 
                              (request.auth.uid == resource.data.userId || 
                               request.auth.token.admin == true);
    }
    
    // Raffle history - readable by all
    match /raffle_history/{historyId} {
      allow read: if true;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Rewards - users can read their own
    match /rewards/{rewardId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Users - users can read/update their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6️⃣ Test Locally (Optional)

```bash
# Start Firebase emulators
npm run serve

# This will start:
# - Functions emulator
# - Firestore emulator
# - View in browser at http://localhost:4000
```

### 7️⃣ Deploy to Firebase

```bash
# From functions directory
cd functions
npm run build

# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:checkRaffles
firebase deploy --only functions:runDrawManual
firebase deploy --only functions:simulateThreshold
```

### 8️⃣ Set Up Cloud Scheduler

The `checkRaffles` function uses Cloud Scheduler (cron job):

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Cloud Scheduler API**
3. The function will automatically create the schedule on first deploy
4. Verify in Cloud Console > Cloud Scheduler

Schedule: `0 12 * * *` (Daily at 12:00 PM Bangkok time)

---

## 🔐 Environment Variables & Secrets

### Set Firebase Config

```bash
# Set region (optional)
firebase functions:config:set app.region="asia-southeast1"

# Set admin emails (for admin role checks)
firebase functions:config:set admin.emails="admin@winwai.com,support@winwai.com"

# View current config
firebase functions:config:get
```

### Use Environment Variables in Code

```typescript
const functions = require('firebase-functions');
const adminEmails = functions.config().admin?.emails?.split(',') || [];
```

---

## 📊 Firestore Database Setup

### Create Initial Collections

Run this setup script once to initialize your database:

```javascript
// setup-firestore.js
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function setupDatabase() {
  // Create sample raffle
  await db.collection('raffles').doc('sample-raffle-1').set({
    prizeValue: 40,
    eCPM: 3,
    fillRate: 0.9,
    totalAdViews: 0,
    drawDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-15T12:00:00Z')),
    status: 'active',
    winnerId: null,
    title: 'Win Blue Elephant Restaurant Experience',
    category: 'food',
    description: '3-course meal for 2 at Blue Elephant',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('✅ Database setup complete');
}

setupDatabase();
```

Run with:
```bash
node setup-firestore.js
```

### Required Indexes

Firestore will prompt you to create indexes when needed. Common indexes:

```
Collection: entries
Fields: raffleId (Ascending), userId (Ascending)

Collection: raffles
Fields: status (Ascending), drawDate (Ascending)
```

---

## 🧪 Testing Your Functions

### 1. Test simulateThreshold

```bash
# Using Firebase CLI
firebase functions:shell

# In the shell:
simulateThreshold({prizeValue: 40, eCPM: 3, fillRate: 0.9})
```

### 2. Test Manual Draw (Admin Only)

```javascript
// From your app with admin token
const functions = firebase.functions();
const runDrawManual = functions.httpsCallable('runDrawManual');

runDrawManual({ raffleId: 'sample-raffle-1' })
  .then(result => console.log('Draw result:', result))
  .catch(error => console.error('Error:', error));
```

### 3. Test Ad View Increment

```javascript
const incrementAdViews = functions.httpsCallable('incrementAdViews');

incrementAdViews({ raffleId: 'sample-raffle-1', adCount: 1 })
  .then(() => console.log('Ad view incremented'))
  .catch(error => console.error('Error:', error));
```

### 4. Get Raffle Stats

```javascript
const getRaffleStats = functions.httpsCallable('getRaffleStats');

getRaffleStats({ raffleId: 'sample-raffle-1' })
  .then(result => console.log('Stats:', result.data))
  .catch(error => console.error('Error:', error));
```

---

## 📈 Monitoring & Logs

### View Function Logs

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only checkRaffles

# Follow logs in real-time
firebase functions:log --follow
```

### Cloud Console Monitoring

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Functions** tab
4. View metrics, logs, and errors

### Set Up Alerts

1. Go to Cloud Console > Monitoring > Alerting
2. Create alerts for:
   - Function errors
   - Function execution time
   - High costs

---

## 💰 Cost Estimation

### Cloud Functions Pricing (Pay-as-you-go)

- **Invocations:** $0.40 per million (first 2M free/month)
- **Compute time:** $0.0000025/GB-second
- **Networking:** $0.12/GB

### Example Monthly Cost for 1000 Raffles:

- Daily checks: 30 invocations × $0.40/1M = negligible
- Draw executions: 30 × ~5 seconds = ~150 seconds
- Total: < $1/month for Cloud Functions

### Firestore Pricing:

- Reads: $0.06 per 100K (50K free/day)
- Writes: $0.18 per 100K (20K free/day)
- Storage: $0.18/GB/month (1GB free)

**Total estimated cost for small-medium app: $5-20/month**

---

## 🔧 Troubleshooting

### Function Not Deploying

```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Build manually
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### Permission Errors

```bash
# Set Firebase project
firebase use <project-id>

# Check logged-in account
firebase login:list

# Ensure Blaze plan is active
# Go to Firebase Console > Usage and billing
```

### Function Times Out

Increase timeout in function declaration:

```typescript
export const checkRaffles = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })  // 9 minutes max
  .pubsub
  .schedule('0 12 * * *')
  // ...
```

### Firestore Permission Denied

Ensure your security rules allow Cloud Functions to write:

```
// Add service account check
allow write: if request.auth != null && 
             (request.auth.token.admin == true || 
              request.auth.uid == null);  // null auth = Cloud Function
```

---

## 🎯 Production Checklist

Before going live:

- [ ] All functions deployed successfully
- [ ] Cloud Scheduler running (check console)
- [ ] Firestore security rules configured
- [ ] Admin users have `admin: true` custom claim
- [ ] Test manual draw with sample raffle
- [ ] Monitoring & alerts set up
- [ ] Cost alerts configured
- [ ] Backup strategy in place
- [ ] Error logging to external service (Sentry, etc.)

---

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Firebase Pricing Calculator](https://firebase.google.com/pricing)

---

## 🆘 Support

For issues or questions:
1. Check Firebase logs: `firebase functions:log`
2. Review Firestore security rules
3. Test with emulators first
4. Check Cloud Console for detailed errors

---

**🎉 You're ready to deploy! Good luck with WinWai Raffle!**
