# Deploy for free (20–30 users) — simplest & cheapest

**Recommended stack: Vercel (free) + Firebase Spark (free)**

Total cost for your group: **£0/month** if you stay on free tiers.

---

## Why this combo?

| Service | Role | Cost |
|---------|------|------|
| **Vercel Hobby** | Hosts the website (public URL) | **Free** — no card needed |
| **Firebase Spark** | Login + database (already set up) | **Free** for 20–30 users |
| **football-data.org** | Kickoff times and live scores | **Free** (World Cup included) |

Fixtures and the 48 World Cup 2026 teams come from **bundled static data**. [football-data.org](https://www.football-data.org/) supplies correct UTC kickoff times and live results (free tier includes the World Cup).

You do **not** need Firebase App Hosting (that needs a paid Blaze plan).

---

## What you get

- A link like `https://world-cup-predictions.vercel.app`
- Family opens it on any phone — no app store
- Sign-in, leagues, predictions all work
- Fixtures sync **once per day** automatically (enough for most of the tournament)

---

## 5 steps to go live (about 30 minutes)

### Step 1 — GitHub (free)

1. Sign up at **https://github.com**
2. Create a **private** repo called `world-cup-predictions`
3. In Terminal:

```bash
cd "/Users/a.khouakhi/Library/CloudStorage/OneDrive-CranfieldUniversity/Projects/11. personal/world_cup"
git init
git add .
git commit -m "World Cup predictions app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/world-cup-predictions.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub name.

---

### Step 2 — Vercel (free)

1. Go to **https://vercel.com** → **Sign up** → use **Continue with GitHub**
2. Click **Add New…** → **Project**
3. Import your `world-cup-predictions` repo
4. Click **Deploy** (leave all defaults)

Wait ~2 minutes. You get a URL like `https://world-cup-predictions-abc123.vercel.app`

---

### Step 3 — Add environment variables on Vercel

1. Vercel → your project → **Settings** → **Environment Variables**
2. Add each of these (copy values from your `.env.local` on your Mac):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | from `.env.local` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | from `.env.local` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | from `.env.local` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | from `.env.local` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | from `.env.local` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | from `.env.local` |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL (https://....vercel.app) |
| `CRON_SECRET` | same random string as local |
| `FOOTBALL_DATA_API_TOKEN` | from [football-data.org](https://www.football-data.org/) (free — sign in → API token) |

3. **Service account (important):**

| Name | Value |
|------|--------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Open `firebase-service-account.json` on your Mac → copy **entire file** → paste as one block |

> Do **not** add `FIREBASE_SERVICE_ACCOUNT_PATH` on Vercel — that only works locally.

4. Click **Save**, then **Deployments** → **⋯** on latest → **Redeploy**

---

### Step 4 — Allow sign-in on your live URL

1. [Firebase Console](https://console.firebase.google.com) → **Authentication**
2. **Settings** → **Authorized domains**
3. **Add domain** → paste your Vercel domain (e.g. `world-cup-predictions-abc123.vercel.app`)
4. Save

---

### Step 5 — Share the link

Send on WhatsApp:

> World Cup predictions — sign up here: https://your-app.vercel.app

Create a league, share the **6-letter invite code**, done.

---

## Optional — live scores during matches (still free)

Vercel free only allows **one cron job per day** (daily fixture sync).

For live score updates during matches, use **cron-job.org** (free):

1. Sign up at **https://cron-job.org**
2. Create a job:
   - **URL:** `https://YOUR-APP.vercel.app/api/cron/sync-live`
   - **Schedule:** every 15 minutes (during World Cup only)
   - **Request header:** `Authorization: Bearer YOUR_CRON_SECRET`
3. Save

Turn the job **off** when the tournament ends.

---

## Will 20–30 users exceed free limits?

**No** — you are well within limits:

| Service | Free allowance | Your usage (~30 users) |
|---------|----------------|------------------------|
| Firebase Auth | Unlimited email users | ~30 |
| Firestore | 50,000 reads/day | A few thousand/day |
| Vercel bandwidth | Generous on Hobby | Tiny |
| API-Football | 100 requests/day | Not used (optional legacy) |
| football-data.org | 10 requests/minute on free tier | ~2–5/day with daily sync |

---

## What NOT to use (for your case)

| Option | Why skip it |
|--------|-------------|
| Firebase App Hosting | Needs Blaze plan + card |
| Firebase Hosting alone | Cannot run Next.js server |
| Paid Vercel Pro | Not needed for 30 users |
| Dedicated server | Overkill and costs money |

---

## Checklist

- [ ] Code on GitHub
- [ ] Deployed on Vercel
- [ ] Environment variables added (including service account JSON)
- [ ] Vercel domain in Firebase Authorized domains
- [ ] Test sign-up on your phone using the **Vercel URL** (not localhost)

---

## Updating the app later

After you change code on your Mac:

```bash
git add .
git commit -m "Update app"
git push
```

Vercel redeploys automatically in ~2 minutes.

---

Need help on a specific step? Say which step you are on (GitHub, Vercel, or env variables).
