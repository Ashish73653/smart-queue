# Deploying Smart Queue to Vercel

This guide walks you through deploying Smart Queue to Vercel with Firebase integration.

## Prerequisites

- GitHub account (to push code)
- Firebase project (already set up)
- Vercel account (free: https://vercel.com)

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Smart Queue Barber Booking System"

# Create a new repo on GitHub, then push:
git remote add origin https://github.com/YOUR_USERNAME/smart-queue.git
git branch -M main
git push -u origin main
```

⚠️ **IMPORTANT:** Ensure `.env.local` is in `.gitignore` and NOT committed (already configured).

## Step 2: Set Up Firebase Admin Keys

For Vercel to access Firebase Admin SDK, you need the private key as an environment variable.

1. Get your Firebase service account key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - A JSON file downloads

2. **Convert the private key to Vercel format:**

   ```bash
   # The private key in your .env.local already has \n escaped
   # Example:
   # FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
   ```

   Copy the exact value (with \n) from your `.env.local`

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo (smart-queue)
4. Leave build settings as default (Vercel auto-detects Next.js)
5. Under "Environment Variables", add all from `.env.local`:

   | Variable                                   | Value                                      |
   | ------------------------------------------ | ------------------------------------------ |
   | `NEXT_PUBLIC_FIREBASE_API_KEY`             | (from .env.local)                          |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | (from .env.local)                          |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | (from .env.local)                          |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | (from .env.local)                          |
   | `NEXT_PUBLIC_FIREBASE_APP_ID`              | (from .env.local)                          |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (from .env.local)                          |
   | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`      | (from .env.local)                          |
   | `FIREBASE_PROJECT_ID`                      | (from .env.local)                          |
   | `FIREBASE_CLIENT_EMAIL`                    | (from .env.local)                          |
   | `FIREBASE_PRIVATE_KEY`                     | (from .env.local - **include \n escapes**) |
   | `FIREBASE_STORAGE_BUCKET`                  | (from .env.local)                          |
   | `ADMIN_DEFAULT_EMAIL`                      | (your admin email)                         |

6. Click "Deploy"
7. Wait for build to complete (2-3 minutes)

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time)
vercel

# Follow prompts and set environment variables when asked

# Or set env vars in advance:
vercel env add FIREBASE_PRIVATE_KEY
# Paste your private key value when prompted
```

## Step 4: Update Firebase API Key Restrictions

Since Vercel hosts on `*.vercel.app`, you need to whitelist it in Firebase:

1. Go to Firebase Console → Project Settings → API Keys
2. Click your API key (NEXT_PUBLIC_FIREBASE_API_KEY)
3. Under "Application restrictions", select "HTTP referrer (web)"
4. Add your Vercel domain:

   ```
   https://smart-queue-RANDOM.vercel.app/*
   ```

   (Replace RANDOM with your actual Vercel subdomain)

5. **Also add these for flexibility:**

   ```
   https://*.vercel.app/*
   ```

6. Save and wait 1-2 minutes

## Step 5: Verify Deployment

1. Go to your Vercel deployment URL
2. Test customer booking: `/book`
3. Test admin login: `/admin/login`
   - Email: `ash1sh.1hakur10@gmail.com` (or your ADMIN_DEFAULT_EMAIL)
   - Password: Your Firebase password
4. Test public queue: `/queue`
5. Test booking tracking: `/track`

## Step 6: Set Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Domains"
3. Add your custom domain (e.g., trimq.com)
4. Update DNS records as shown

## Common Issues

### Firebase Auth Fails on Vercel

**Problem:** Login works locally but fails on Vercel
**Solution:** Check Firebase API key restrictions - whitelist your Vercel domain

### Private Key Not Being Read

**Problem:** "Firebase is not configured" error
**Solution:** Ensure `FIREBASE_PRIVATE_KEY` environment variable includes `\n` escapes:

```
# ❌ WRONG - multiline private key
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEv...
-----END PRIVATE KEY-----"

# ✅ CORRECT - with \n escapes
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

### Build Fails with TypeScript Errors

**Problem:** Deployment fails at build step
**Solution:** Run `npm run build` locally, fix any errors, and push again

### Proxy/Middleware Warning

**Problem:** Console warning about blocked cross-origin
**Solution:** This is expected and non-blocking. Next.js proxy properly sandboxes server-only logic

## Redeploy After Changes

Any push to `main` branch automatically triggers a new Vercel build:

```bash
git add .
git commit -m "Update: add new feature"
git push origin main
```

Check deployment status in Vercel dashboard → Deployments tab

## Monitoring & Logs

1. Vercel Dashboard → Your Project → Deployments
2. Click a deployment to see:
   - Build logs
   - Runtime errors
   - Function execution logs

## Production Checklist

- ✅ Build passes locally (`npm run build`)
- ✅ Lint passes (`npm run lint`)
- ✅ All Firebase env vars set in Vercel
- ✅ Firebase API key allows Vercel domain
- ✅ ADMIN_DEFAULT_EMAIL is set
- ✅ `.env.local` is in `.gitignore`
- ✅ Custom domain configured (if using one)
- ✅ Tested booking, login, and queue on production URL

## Support

- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
