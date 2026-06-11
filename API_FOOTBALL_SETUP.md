# How to get the games API (API-Football)

Your app uses **API-Football** to automatically fetch World Cup 2026 fixtures, teams, and results.

**Website:** [https://www.api-football.com](https://www.api-football.com)  
**Free tier:** 100 requests per day — enough for a family league (~30 users).

> **Important:** The free plan only includes API seasons **2022–2024**, not 2026.  
> Add `API_FOOTBALL_SEASON=2022` to `.env.local` so bracket teams and fixture sync work.  
> Switch to `2026` when you upgrade your API plan for the real tournament.

---

## Step 1 — Create a free account

1. Go to **[https://www.api-football.com](https://www.api-football.com)**
2. Click **Register** (top right)
3. Sign up with your email (**abdouu2005@gmail.com** or any email)
4. Confirm your email if asked

No credit card required for the free plan.

---

## Step 2 — Get your API key

1. Log in to **[https://dashboard.api-football.com](https://dashboard.api-football.com)**
2. You land on your **Dashboard**
3. Your **API key** is shown on the dashboard (a long string)
4. Click **Copy** or select and copy it

It looks something like: `a1b2c3d4e5f6...` (yours will be different)

---

## Step 3 — Add the key to your app

### On your Mac (local)

Open `.env.local` in your project folder and set:

```
API_FOOTBALL_KEY=paste-your-key-here
API_FOOTBALL_SEASON=2022
```

Save the file, then restart the app (`Ctrl+C`, then `npm run dev`).

**Why season 2022?** The free API plan cannot access 2026 yet. Season `2022` loads World Cup teams (with flags) and historical fixtures so you can test the app. Your app UI still targets World Cup 2026.

### On Vercel (when live)

1. Vercel → your project → **Settings** → **Environment Variables**
2. Add: `API_FOOTBALL_KEY` = your key
3. **Redeploy**

---

## Step 4 — Sync World Cup fixtures

Once the key is set, run this in Terminal (use your `CRON_SECRET` from `.env.local`):

```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Authorization: Bearer local-dev-secret-change-me"
```

When live on Vercel, replace the URL with your Vercel app URL.

This downloads all World Cup 2026 matches into your database. After that, they appear in the app automatically (daily sync on Vercel free tier).

---

## What the API provides

| Data | Used for |
|------|----------|
| **Fixtures** | Match list, dates, teams, venues |
| **Live scores** | Auto-update results and points |
| **Teams** | Top 3 & bracket team pickers |
| **Standings** | Group tables (future use) |
| **Head-to-head** | Match previews (optional) |

World Cup uses **league ID 1** in the API. The **season** comes from `API_FOOTBALL_SEASON` (default `2022` on free tier, use `2026` when your plan allows it).

---

## Free tier limits (100 requests/day)

The app is designed to stay within this:

| Action | Requests used |
|--------|---------------|
| Full fixture sync (once per day) | ~1 |
| Live score sync (if using cron-job.org every 15 min) | ~96/day max during matches |
| Fetch teams list | ~1 (when someone opens Top 3 / Bracket) |

**Tip:** On Vercel free, fixtures sync **once per day** automatically. That uses only ~1 request per day — well within limits.

For live updates during match days, use [cron-job.org](https://cron-job.org) (free) to call `/api/cron/sync-live` every 15 minutes — see `DEPLOY_FREE.md`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Free plans do not have access to this season` | Add `API_FOOTBALL_SEASON=2022` to `.env.local` and restart |
| No matches in app | Add `API_FOOTBALL_KEY` and run the sync command |
| `API_FOOTBALL_KEY is not configured` | Key missing from `.env.local` or Vercel env vars |
| `403` or `401` from API | Wrong key, or free tier expired — log in to dashboard |
| Rate limit error | Wait until tomorrow, or reduce sync frequency |

---

## Official links

- [API-Football dashboard](https://dashboard.api-football.com)
- [World Cup 2026 API guide](https://www.api-football.com/news/post/fifa-world-cup-2026-guide-to-using-data-with-api-sports)
- [Pricing (free tier details)](https://www.api-football.com/pricing)
