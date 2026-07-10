# TRACKORA-F

A consent-based location-sharing app. Nobody appears on your map until they accept your invite, and access can be revoked — or paused instantly — at any time.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, and Supabase (Postgres + Auth + Realtime).

## What's new in this version

- **Link-based invites**: no phone number needed upfront. Generate a link on the People page, copy it, send it through WhatsApp/SMS/email/whatever — the recipient signs in and accepts from that link.
- **Directions**: click "Directions" next to anyone in your circle to draw a live driving route from your current position to their last known location, with distance and ETA (Google Directions API).
- **Ghost mode**: a one-click toggle in the top bar that instantly hides your location from everyone, without revoking any connections.
- **Avatar builder**: a Bitmoji/Snapchat-style avatar creator (skin tone, hair, eyes, mouth, accessories, background) rendered as SVG — no photo required.
- **Custom logo support**: drop a `logo.png` into `/public` and it automatically appears in the sidebar, top bar, landing page, and browser tab.
- **Brute-force protection**: failed login attempts are rate-limited per email (8 attempts / 15 minutes) via a service-role-only table.

## How tracking works here

- You can only ever see the **location of your own devices**, plus anyone who has **explicitly accepted** your invite link.
- Every read of location data is enforced server-side by Postgres Row Level Security (see `supabase/schema.sql`) and, for ghost mode, an explicit `ghost_mode` check — not just hidden in the UI.
- Invite acceptance runs through a `SECURITY DEFINER` Postgres function (`accept_invite_by_token`) rather than a broad RLS update policy, so nobody can claim an invite without holding the exact link.
- Anyone can revoke a connection, flip on ghost mode, or change sharing precision (exact / approximate / city-only) at any time in Settings.


## 1. Prerequisites

- Node.js 18.18+ and npm
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) project with the **Maps JavaScript API** enabled and an API key restricted to your domain
- (Optional) An [Anthropic API key](https://console.anthropic.com) to power the ORI assistant

## 2. Set up Supabase

1. Create a new Supabase project.
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`. This creates all tables, Row Level Security policies, and triggers (including auto-creating a profile on sign-up).
3. Go to **Authentication → Providers** and enable **Google** (add your OAuth client ID/secret from Google Cloud Console).
4. Go to **Authentication → URL Configuration** and set your site URL (e.g. `https://your-app.vercel.app`) plus the redirect URL `https://your-app.vercel.app/api/auth/callback`.
5. (Optional but recommended) Under **Database → Cron**, schedule `select purge_expired_location_history();` to run hourly — this enforces each user's chosen history retention window.
6. Copy your **Project URL**, **anon public key**, and **service_role key** from **Settings → API**.

## 2a. Add your logo (optional)

Drop your logo file at `public/logo.png` in the project (any square image works well). It's picked up automatically — no code changes — for the sidebar, top bar, landing page header, and browser tab icon.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_APP_URL=
NEXTAUTH_SECRET=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_2FA_ISSUER=TRACKORA
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

**Never commit `.env.local`.** `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` must stay server-only — they are never referenced from any Client Component.

## 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: TRACKORA"
git branch -M main
git remote add origin https://github.com/<your-username>/trackora.git
git push -u origin main
```

## 6. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Add all the environment variables from step 3 under **Settings → Environment Variables** (for Production, Preview, and Development).
4. Deploy. Vercel will run `next build` automatically.
5. Update your Supabase **Site URL** and Google OAuth **redirect URI** to match your final `*.vercel.app` domain (or custom domain).
6. Visit `/api/health` on your deployed URL to confirm the database connection is healthy.

## Project structure

```
app/
  (auth)/         # login, signup, verify, forgot/reset password
  (dashboard)/    # map, invites (circle), devices, notifications, analytics, settings, assistant
  api/            # route handlers: auth callback, geolocation ingest, assistant, health
components/
  ui/             # shared primitives (button, card, input, switch, toaster)
  layout/         # sidebar, topbar, theme provider
  map/            # live map + this device's location reporter
  invites/        # invite form + connections list
  settings/       # profile, privacy, two-factor setup
  assistant/       # ORI chat
lib/
  supabase/       # browser + server Supabase clients
  validation/     # Zod schemas — the single source of truth for input validation
  utils.ts        # cn(), retry-with-backoff helper
  logger.ts       # structured JSON logging
supabase/
  schema.sql      # tables, RLS policies, triggers
types/
  database.ts     # TypeScript types mirroring schema.sql
```

## Security notes

- All mutations go through Zod-validated Server Actions or Route Handlers — never trust client input.
- Row Level Security is the real enforcement layer; the app-layer checks are a second line of defense, not the only one.
- Security headers (CSP, X-Frame-Options, etc.) are set in `next.config.mjs`.
- Passwords require 10+ characters with mixed case, a number, and a symbol.
- Two-factor authentication uses TOTP (`otplib`), compatible with any standard authenticator app.
- `/api/geolocation` resolves the device ID server-side from the authenticated session — a client can never write a ping under someone else's device.
