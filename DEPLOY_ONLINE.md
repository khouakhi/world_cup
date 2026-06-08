# How to put your app online (live on the internet)

Right now the app only runs on **your Mac** (`localhost`). To share it with family and friends on their phones, you need to **deploy** it — upload it so anyone can visit a web address like:

**https://world-cup-predictions-xxxxx.web.app**

---

## Yes — Firebase can do this

Use **Firebase App Hosting** (not the old static “Hosting” — that is for simple websites only).

Your app is a **Next.js** app (needs a server). Firebase App Hosting supports that and connects to the same Firebase project you already set up.

**Cost for a small family group:** Firebase App Hosting needs the **Blaze** plan (pay-as-you-go), but you add a card and you typically stay within the **free monthly limits** for a small app. Set a **budget alert** at £5 in Google Cloud so you get warned if anything unexpected happens.

---

## Overview (what you will do)

```
Your code  →  GitHub (online storage)  →  Firebase App Hosting  →  Live URL
```

You only do this **once**. After that, updates can deploy automatically when you push changes.

---

## Part 1 — Put your code on GitHub (about 15 minutes)

GitHub stores your code online so Firebase can read it.

### 1. Create a GitHub account

Go to **https://github.com** and sign up (free) if you do not have one.

### 2. Create a new repository

1. Click **+** (top right) → **New repository**
2. Name: `world-cup-predictions`
3. Choose **Private** (recommended — keeps your project private)
4. **Do not** tick “Add a README”
5. Click **Create repository**

GitHub shows a page with commands — keep it open.

### 3. Upload your project from Terminal

Open **Terminal** and run these lines **one at a time**:

```bash
cd "/Users/a.khouakhi/Library/CloudStorage/OneDrive-CranfieldUniversity/Projects/11. personal/world_cup"
```

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "World Cup predictions app"
```

```bash
git branch -M main
```

Replace `YOUR_GITHUB_USERNAME` with your real GitHub username:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/world-cup-predictions.git
```

```bash
git push -u origin main
```

GitHub may ask you to sign in in the browser. When it finishes, refresh your repo page — you should see your files.

> **Important:** `firebase-service-account.json` and `.env.local` are **not** uploaded (they stay secret on your Mac only). That is correct.

---

## Part 2 — Deploy with Firebase App Hosting (about 20 minutes)

### 1. Upgrade to Blaze (if asked)

1. [Firebase Console](https://console.firebase.google.com) → **world-cup-predictions-48f1d**
2. Bottom left: **Upgrade** → **Blaze plan**
3. Add a payment method
4. In [Google Cloud Billing](https://console.cloud.google.com/billing/budgets), create a **budget alert** (e.g. £5/month) — you get an email if costs rise

For a family app with ~10–30 users, you will almost certainly stay in the free tier.

### 2. Create an App Hosting backend

1. Firebase Console → left menu **Build** → **App Hosting**
   (If you see “Hosting” only, look for **App Hosting** — it is a separate item)
2. Click **Get started**
3. **Connect to GitHub** — install the Firebase GitHub app and select your `world-cup-predictions` repo
4. Settings:
   - **Branch:** `main`
   - **Root directory:** `/` (leave as project root)
   - **Live branch:** `main`
   - **Automatic rollouts:** ON
5. **Region:** pick **europe-west4** or closest to you
6. Name the backend e.g. `world-cup-web`
7. Click **Finish and deploy**

Wait 5–10 minutes for the first build. You get a URL like:

**https://world-cup-web--world-cup-predictions-48f1d.europe-west4.hosted.app**

(or similar)

---

## Part 3 — Add secret settings (required — app will not work without this)

On your Mac, the app reads `firebase-service-account.json` from a file. Online, there is no file — you must add **environment variables** in Firebase.

### 1. Open environment settings

Firebase Console → **App Hosting** → your backend → **Settings** → **Environment variables**

### 2. Add these variables (copy from your `.env.local`)

| Variable name | Value |
|---------------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (from `.env.local`) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | (from `.env.local`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | (from `.env.local`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | (from `.env.local`) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (from `.env.local`) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (from `.env.local`) |
| `NEXT_PUBLIC_APP_URL` | Your live URL from step 2 (https://...) |
| `CRON_SECRET` | Any long random string (same as local, or new) |
| `API_FOOTBALL_KEY` | Your API-Football key (when you have one) |

### 3. Add the service account as a **secret**

1. Still in App Hosting settings → **Secrets** (or use Google Secret Manager)
2. Create secret named: `FIREBASE_SERVICE_ACCOUNT_JSON`
3. Open `firebase-service-account.json` on your Mac in TextEdit
4. Copy **the entire file** (one JSON object)
5. Paste as the secret value

Then add an environment variable:

| Variable name | Value |
|---------------|--------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Reference the secret you just created |

> Remove `FIREBASE_SERVICE_ACCOUNT_PATH` online — it only works on your Mac.

### 4. Redeploy

After saving variables, trigger a new deploy:

- **App Hosting** → **Rollouts** → **Create rollout**,  
  **or** push any small change to GitHub (automatic rollout)

---

## Part 4 — Allow sign-in on your live URL

Firebase blocks sign-in from unknown websites until you allow them.

1. Firebase Console → **Build** → **Authentication**
2. **Settings** tab → **Authorized domains**
3. Click **Add domain**
4. Add your App Hosting domain (the part after `https://`, e.g. `world-cup-web--world-cup-predictions-48f1d.europe-west4.hosted.app`)
5. Save

---

## Part 5 — Share with family

Send them the **live URL** in WhatsApp:

> “World Cup predictions — sign up here: https://your-url-here…”

They open it on their phone, create an account, and join with your **invite code**. No app store needed — it works in the browser.

---

## Optional — custom web address

Later you can add a domain like `wcpredictions.yourfamily.com` in Firebase App Hosting → **Custom domains**.

---

## Alternative: Vercel (also free, very easy)

This project is also ready for **Vercel** (popular for Next.js):

1. Push code to GitHub (Part 1 above)
2. Go to **https://vercel.com** → sign up with GitHub
3. **Import** your `world-cup-predictions` repo
4. Add the same environment variables as Part 3
5. Deploy → you get a URL like `world-cup-predictions.vercel.app`
6. Add that domain to Firebase **Authorized domains**

Both Firebase App Hosting and Vercel work well. **Firebase App Hosting** keeps everything in one place; **Vercel** is often slightly simpler for first-time deploy.

---

## Checklist

| Step | Done? |
|------|-------|
| Code on GitHub | ☐ |
| Firebase App Hosting backend created | ☐ |
| Environment variables + service account secret added | ☐ |
| Live URL added to Authentication → Authorized domains | ☐ |
| Test sign-up on your phone (not localhost) | ☐ |

---

## If something breaks online

| Problem | Fix |
|---------|-----|
| Site loads but sign-in fails | Add live URL to **Authorized domains** |
| “Server setup incomplete” | Add `FIREBASE_SERVICE_ACCOUNT_JSON` secret and redeploy |
| Blank page after deploy | Check **Rollouts** → build logs for errors |
| Works on Mac but not phone | You are still on `localhost` — use the **live URL** |

---

When you reach Part 2 or Part 3, say which step you are on and I can walk you through it click by click.
