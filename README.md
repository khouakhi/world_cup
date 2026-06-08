# World Cup Predictions

A private prediction league for family and football friends — built for **FIFA World Cup 2026**.

Predict match scores, pick your daily captain, challenge the pre-tournament bracket, and compete for the top 3 podium. Fixtures, results, and scoring run automatically via API-Football; match previews optionally use Grok AI.

## Features

| Feature | Details |
|---------|---------|
| **Score predictions** | 1 pt result · 2 pts goal difference · 5 pts exact score |
| **Captain's pick** | One match per matchday worth **2× points** |
| **Bracket challenge** | Champion 20 pts · runner-up 10 pts · semi-finalists 5 pts each |
| **Matchday winner** | Highlighted on the league home page each day |
| **Overall top 3** | Podium view on leaderboard |
| **Badges** | Oracle, Chaos Agent, Captain Clutch, Group Guru, Knockout King, Scoreline Sniper |
| **Auto sync** | Fixtures daily · live scores every 15 min · AI previews daily |
| **Mobile PWA** | Add to home screen on phones |

## Tech stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** (auth, PostgreSQL, row-level security)
- **API-Football** (fixtures, results, teams, standings, head-to-head)
- **Grok / xAI** (optional match previews — falls back to static text)
- **Vercel** (hosting + cron jobs)

## Quick start

### 1. Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) project (free tier)
- [API-Football](https://www.api-football.com/) key (free tier: 100 requests/day)
- Optional: [xAI](https://console.x.ai) API key for match previews

### 2. Clone and install

```bash
cd world_cup
npm install
cp .env.example .env.local
```

### 3. Configure environment

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

API_FOOTBALL_KEY=your-key

# Optional — match previews
XAI_API_KEY=xai-...

CRON_SECRET=generate-a-long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up the database

In the Supabase SQL editor, run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

Enable **Email auth** in Supabase → Authentication → Providers.

Add your site URL to **Redirect URLs**: `http://localhost:3000/auth/callback`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Initial fixture sync

Trigger a manual sync (uses your API-Football quota):

```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Deploy to Vercel

1. Push to GitHub and import in [Vercel](https://vercel.com)
2. Add all environment variables from `.env.example`
3. Cron jobs in `vercel.json` run automatically:
   - **06:00 UTC** — sync all fixtures
   - **Every 15 min** — sync live scores
   - **08:00 UTC** — generate Grok previews for upcoming matches

Set `CRON_SECRET` in Vercel; Vercel Cron sends it as `Authorization: Bearer …` when configured.

## How to play

1. **Sign up** with email (magic link — no password)
2. **Create a league** or **join** with a 6-character invite code
3. Share the invite code via WhatsApp / family group
4. Before each matchday:
   - Enter score predictions (locks 15 min before kick-off)
   - Pick your **captain's match** (star button) for double points
5. Before the tournament starts: fill in your **bracket challenge**
6. Watch the **matchday winner** and **leaderboard** update automatically

## API rate limits (free tier)

API-Football free plan: **100 requests/day**, 10/minute.

The app is designed to stay within limits:

- One bulk fixture sync per day
- Live sync only hits the API when matches are in progress
- Head-to-head fetched once per preview (cached in DB)
- Grok previews generated once per match and cached

## Project structure

```
src/
├── app/                  # Pages and API routes
│   ├── api/
│   │   ├── cron/         # Automated sync (Vercel cron)
│   │   ├── predictions/  # Submit score predictions
│   │   ├── captain/      # Captain's pick
│   │   ├── bracket/      # Bracket challenge
│   │   └── leaderboard/  # Rankings
│   ├── league/[id]/      # League pages
│   └── dashboard/        # League list
├── components/           # UI components
├── lib/
│   ├── api-football/     # Football data client
│   ├── grok/             # AI preview client
│   ├── supabase/         # Database clients
│   ├── sync/             # Sync & scoring jobs
│   ├── scoring.ts        # Points calculation
│   └── badges.ts         # Badge evaluation
└── types/                # TypeScript types
```

## Scoring reference

### Match predictions

| Outcome | Points |
|---------|--------|
| Correct result (W/D/L) | 1 |
| Correct goal difference | 2 |
| Exact score | 5 |
| Captain's pick multiplier | ×2 |

### Bracket challenge

| Pick | Points |
|------|--------|
| Champion | 20 |
| Runner-up | 10 |
| Each semi-finalist | 5 |

Bracket locks when the first match kicks off; points awarded after the final.

## Licence

Private project — use freely within your family and friends group.
