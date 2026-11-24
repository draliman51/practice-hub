# Alilox 🧱 — kids' 3D block-world platform

Next.js 14 (App Router) · Supabase (Auth, Postgres, Storage, Realtime) · Three.js · PeerJS voice · PWA.

## Features
- Accounts: **child** (username + password; a linked email is required — the child chooses to link to a parent for approval, or create the account directly), **parent** (email) with approval/claim flow, **admin** (support & moderation).
- Avatar editor with real photo upload (private bucket, signed URLs, parent + admin approval), hats, back items, pets.
- Alilox City hub + worlds: Obby Run, Sky Tower, Coin Park, Falling Floor arena, Pet Race; user-built worlds (editor + review).
- Alicoins, XP/levels, daily gift & streaks, daily/weekly quests, badges, seasons/events (admin managed).
- Friends by code (parent approval for under-13), rooms up to 6 players (Supabase Realtime), quick-chat bubbles, emotes, WebRTC voice chat.
- Parent dashboard: daily limit, allowed hours, pause, photo & friend approvals, weekly report. Admin: stats, tickets, users, world/photo review, seasons, shop items.
- Bilingual Arabic/English (RTL), installable PWA, offline page.

## Setup (10 minutes)
1. **Supabase** → New project → SQL Editor → paste `supabase/schema.sql` → Run.
   - Authentication → Providers → Email: enable; **disable "Confirm email"** (kids have no email) or keep it for parents only.
   - Storage: the SQL creates the private `photos` bucket.
2. **Vercel** → Import this repo → Root Directory `alilox` → Framework Next.js → Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
   - `ADMIN_EMAILS=you@example.com` (optional)
3. Sign up as a **parent** with your email, then in Supabase SQL Editor run:
   `update public.profiles set role='admin', status='active' where id=(select id from auth.users where email='you@example.com');`
4. Create your kids from the Parent dashboard (or let them sign up and claim them by username).

Local dev: copy `.env.example` → `.env.local`, `npm i`, `npm run dev`. A database-free playground is at `/dev?world=city` when `NEXT_PUBLIC_DEV_DEMO=1`.
