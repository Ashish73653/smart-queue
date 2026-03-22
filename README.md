# Smart Queue — Barber Booking & Live Queue (Next.js + Supabase)

Free-to-host barber booking and live queue management. Customers book without sign-up, see their queue number and ETA instantly. Barbers control the queue, delays, services, and shop status from a phone-friendly admin dashboard.

## Features
- Customer: book in under a minute, multi-select services, live price/duration preview, queue number + ETA, edit/cancel with phone + reference.
- Live queue: in-progress card, waiting list, average wait, earnings summary, shop open/closed.
- Barber admin: Supabase Auth login, dashboard cards, start/done/cancel/no-show, add +5/+10 delay, manual walk-in add, service CRUD, shop settings (hours, buffer, contact).
- Supabase schema + seed for services, bookings, booking services, admin users, shop settings.

## Quick start
1) Install deps
```bash
npm install
```

2) Environment  
Create `.env.local` from the example:
```
cp .env.local.example .env.local
```
Fill values from your Supabase project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to clients)
- `SUPABASE_JWT_SECRET` (from Supabase Settings → API)
- `ADMIN_DEFAULT_EMAIL` (seeded admin email)

3) Database  
Run the schema and seed inside Supabase SQL editor or CLI:
```
-- schema
supabase db push supabase/schema.sql

-- seed
supabase db push supabase/seed.sql
```
Tables: `services`, `bookings`, `booking_services`, `admin_users`, `shop_settings`.

4) Create an admin auth user  
- In Supabase Auth → Users, create the email from `ADMIN_DEFAULT_EMAIL` with a password.  
- The seed adds that email to `admin_users`; login uses Supabase Auth at `/admin/login`.

5) Run locally
```bash
npm run dev
```
Visit:
- `/` Home (CTA + services preview)
- `/book` Book & live totals
- `/track` Track/edit/cancel by phone + reference
- `/queue` Public live queue
- `/admin/login` Barber login
- `/admin/dashboard`, `/admin/queue`, `/admin/services`, `/admin/settings`

## Queue & ETA logic
- Each booking gets the next `queue_number` per date.
- ETA = remaining in-progress minutes (duration + extra delay – elapsed) + sum of waiting bookings before you.
- Delay buttons add minutes to the current booking and push ETA for everyone after.

## Deployment
- Designed for Vercel + Supabase free tier. Keep the service role key server-side only.
- Configure environment variables in Vercel dashboard and Supabase.
