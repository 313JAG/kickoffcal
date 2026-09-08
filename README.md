# KickoffCal

Live NFL subscription calendars **for Apple Calendar and iCloud** — one calendar per team, with TV/streaming, scores, and watch links.

## Why Apple-first

Apple Calendar lets you control subscription refresh (as often as every 5 minutes on Mac, and frequently on iPhone). That makes score updates and flex-time changes actually usable — unlike Google’s slow ICS polling. Per-team calendars also match how people already toggle calendars in iCloud.

## Features (PoC)

- All 32 NFL teams with logos
- Per-team **live** `webcal://` feeds (not flat one-shot downloads)
- Broadcast data (national TV + streaming when ESPN provides it)
- ESPN Gamecast + Apple Sports links in every event
- Emoji + score toggles baked into subscribe URLs
- Optional Supabase auth (magic link) + SQL schema
- Stripe Payment Link stub for Pro pricing
- Vercel Cron sync every 30 minutes

## Quick start

```bash
npm install
cp .env.example .env.local
npm run sync:nfl
npm run dev
```

App runs at [http://127.0.0.1:43123](http://127.0.0.1:43123).

### Useful URLs

- `/nfl` — team directory
- `/nfl/[slug]` — team page + **Add to Apple Calendar**
- `/api/cal/<feedToken>.ics` — live calendar feed
- `/api/sync` — force ESPN resync (protect with `CRON_SECRET` in production)
- `/account` — preferences + auth stub
- `/pricing` — Free + Pro (Stripe link)

## Environment

| Variable | Required | Purpose |
|----------|----------|--------|
| `NEXT_PUBLIC_APP_URL` | Recommended | Canonical site URL for feed links |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Magic-link auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Magic-link auth |
| `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` | Optional | Pro checkout button |
| `CRON_SECRET` | Recommended in prod | Authorizes `/api/sync` |

Apply `supabase/migrations/001_init.sql` when you connect a Supabase project.

## Data

PoC provider: ESPN site API (free, no key), behind a `SportsProvider` interface so Sportradar / SportsDataIO can replace it later without rewriting feeds or UI.

Local cache: `data/nfl-cache.json` (auto-refreshed every ~15 minutes on read, plus Vercel Cron).

## Deploy

1. Push to GitHub
2. Import on Vercel
3. Set env vars
4. Cron in `vercel.json` hits `/api/sync` every 30 minutes

## Notes

Feeds are pull-based. For nearer-live scores: Mac → Get Info → Auto-refresh; iPhone → Settings → Calendar → Accounts → subscription → Refresh.
