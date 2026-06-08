# How to start and test the app

Follow these steps in order. Total time: about **15 minutes** for full testing, or **2 minutes** just to see the homepage.

---

## Part A — Just see how it looks (2 minutes)

### 1. Open Terminal

On Mac: press **Cmd + Space**, type **Terminal**, press Enter.

### 2. Go to the project folder

Copy and paste this line, then press Enter:

```bash
cd "/Users/a.khouakhi/Library/CloudStorage/OneDrive-CranfieldUniversity/Projects/11. personal/world_cup"
```

### 3. Install dependencies (first time only)

```bash
npm install
```

### 4. Start the app

```bash
npm run dev
```

You should see something like:

```
▲ Next.js 15.x
- Local: http://localhost:3000
✓ Ready
```

### 5. Open in your browser

Go to: **http://localhost:3000**

You will see the green **World Cup Predictions** landing page with feature cards.

> **Note:** Sign-in and leagues will **not** work yet — you need Part B for that.

To stop the server: press **Ctrl + C** in Terminal.

---

## Part B — Full test with sign-in and leagues (~15 minutes)

The app stores users and predictions in **Supabase** (free online database). You need a free account.

### Step 1 — Create a Supabase project

1. Go to **https://supabase.com** and sign up (free).
2. Click **New project**.
3. Pick a name (e.g. `world-cup-predictions`), set a database password, choose a region near you.
4. Wait ~2 minutes for the project to be created.

### Step 2 — Run the database setup

1. In Supabase, open **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open this file on your computer:
   `world_cup/supabase/migrations/001_initial_schema.sql`
4. Copy **all** the SQL and paste it into the Supabase SQL editor.
5. Click **Run**. You should see “Success”.

### Step 3 — Enable email sign-in

1. In Supabase, go to **Authentication** → **Providers**.
2. Make sure **Email** is enabled.
3. Go to **Authentication** → **URL Configuration**.
4. Add this to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   ```

### Step 4 — Copy your API keys

1. In Supabase, go to **Project Settings** (gear icon) → **API**.
2. Copy these three values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret)

### Step 5 — Get a football API key (optional for now)

1. Go to **https://www.api-football.com/** and register (free).
2. Copy your API key from the dashboard → `API_FOOTBALL_KEY`

### Step 6 — Update `.env.local`

Open the file `.env.local` in the project folder and replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

API_FOOTBALL_KEY=your-api-football-key
CRON_SECRET=any-random-string-you-like
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Save the file.

### Step 7 — Restart the app

In Terminal (in the project folder):

```bash
npm run dev
```

Open **http://localhost:3000**

### Step 8 — Test the flow

1. Click **Get started** → enter your email → check inbox for magic link.
2. Click the link in the email → you land on **Your leagues**.
3. Click **Create a league** → give it a name (e.g. “Family WC 2026”).
4. Copy the **invite code** and share it, or open the league.
5. Explore: **Matches**, **Leaderboard**, **Bracket**, **Badges**.

### Step 9 — Load match fixtures (when ready)

Once you have an API-Football key, sync fixtures:

```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

(Use the same `CRON_SECRET` value from `.env.local`.)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `command not found: npm` | Install Node from https://nodejs.org (LTS version), then restart Terminal |
| Page blank or error on sign-in | Check `.env.local` has real Supabase keys and redirect URL is set |
| No matches showing | Run the sync command in Step 9; World Cup 2026 fixtures appear closer to the tournament |
| Magic link email not arriving | Check spam; in Supabase try Authentication → Email templates |

---

## Quick reference

| Command | What it does |
|---------|--------------|
| `npm install` | Install dependencies (first time) |
| `npm run dev` | Start the app at http://localhost:3000 |
| Ctrl + C | Stop the server |
