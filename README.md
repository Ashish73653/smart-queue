# Smart Queue - Barber Booking & Live Queue (Next.js + Firebase)

Smart Queue is a barber booking and live queue system. Customers book without sign-up, get queue number and ETA instantly, and can track/edit/cancel using phone + booking reference. Admins control the queue from a mobile-friendly dashboard.

## Features

- Customer booking with multi-service selection, live totals, queue number, and ETA.
- Public live queue with now-serving, waiting list, and summary stats.
- Booking tracking by phone + reference with edit/cancel options.
- Admin dashboard for queue actions, walk-ins, services CRUD, and shop settings.
- Firebase Authentication for admin login and Firestore for app data.

## Quick start

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill all values in `.env.local`.

3. Firebase setup

- Enable Email/Password in Firebase Authentication.
- Create an admin user in Authentication with `ADMIN_DEFAULT_EMAIL`.
- In Firestore, create these collections:
  - `services`
  - `bookings`
  - `admin_users`
  - `shop_settings`

4. Seed minimum data in Firestore

- Services are auto-seeded on first load if the `services` collection is empty.
- Default seed includes:
  - Haircut - Rs100 - 20 min
  - Beard Trim - Rs50 - 10 min
  - Shave - Rs60 - 10 min
  - Hair Wash - Rs40 - 10 min
  - Facial - Rs200 - 30 min
  - Haircut + Beard Combo - Rs140 - 30 min
- Add one document in `shop_settings` with document id `primary`:
  - `shop_name` (string)
  - `contact_number` (string)
  - `opening_time` (string)
  - `closing_time` (string)
  - `is_open` (boolean)
  - `buffer_minutes` (number)
- Optional but recommended: add document in `admin_users`:
  - `email` (string, lowercase)
  - `role` (string, e.g. `owner`)

If `admin_users` is empty, login still works for `ADMIN_DEFAULT_EMAIL`.

5. Run locally

```bash
npm run dev
```

## Routes

- `/` Home
- `/book` Book now
- `/track` Track/edit/cancel booking
- `/queue` Public live queue
- `/admin/login` Admin login
- `/admin/dashboard` Admin dashboard
- `/admin/queue` Queue controls
- `/admin/services` Service management
- `/admin/settings` Shop settings

## Firestore query indexes

Depending on your data volume, Firestore may ask for composite indexes when queries run the first time (for example, queue and tracking queries). Create the suggested indexes from Firebase console prompts.

## Deployment

Deploy on Vercel with full production-ready configuration.

### Quick Vercel Deploy

1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import this repository
3. Add environment variables from `.env.local` in Vercel dashboard
4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Production Checklist

All items in [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) are complete:

- ✅ Security hardened (rate limiting, honeypot, validation)
- ✅ Mobile responsive (optimized inputs, touch targets)
- ✅ Build tested and passing
- ✅ Linting clean
- ✅ Firebase integration verified
- ✅ Anti-spam safeguards active

### Important: Firebase API Key Configuration

After deploying to Vercel, whitelist your domain in Firebase:

1. Firebase Console → Project Settings → API Keys
2. Click your API key
3. Add: `https://your-domain.vercel.app/*` (or `https://*.vercel.app/*` for all Vercel apps)
4. Save and wait 1-2 minutes

Without this, login and booking will fail.
