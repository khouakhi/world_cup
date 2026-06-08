# Firebase setup — World Cup Predictions

Your project: **world-cup-predictions-48f1d**

Complete these steps once, then run the app.

---

## Step 1 — Enable sign-in (if not done)

1. Firebase Console → **Build** → **Authentication**
2. **Sign-in method** → **Email/Password** → **Enable** → Save

---

## Step 2 — Firestore database (if not done)

1. **Build** → **Firestore Database**
2. Should show an empty database (that is correct)

---

## Step 3 — Get your web app keys

1. Click the **gear icon** → **Project settings**
2. Scroll to **Your apps** → your web app
3. Copy the `firebaseConfig` values into `.env.local`:

| Firebase config field | .env.local variable |
|----------------------|---------------------|
| apiKey | NEXT_PUBLIC_FIREBASE_API_KEY |
| authDomain | NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN |
| projectId | NEXT_PUBLIC_FIREBASE_PROJECT_ID |
| storageBucket | NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET |
| messagingSenderId | NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID |
| appId | NEXT_PUBLIC_FIREBASE_APP_ID |

---

## Step 4 — Service account key (required — this fixes “Invalid token”)

This is a **file download**, not something you paste into `.env.local` line by line.

1. Open **[Firebase Console](https://console.firebase.google.com)** → your project
2. Click the **gear icon** → **Project settings**
3. Click the **Service accounts** tab (at the top)
4. Click **Generate new private key** → **Generate key**
5. A file downloads (name like `world-cup-predictions-48f1d-firebase-adminsdk-xxxxx.json`)

### Put the file in your project folder

6. Open **Finder**
7. Go to your project folder:
   `OneDrive → CranfieldUniversity → Projects → 11. personal → world_cup`
8. **Drag the downloaded JSON file** into that folder
9. **Rename it** to exactly: `firebase-service-account.json`

Your folder should contain files like `package.json`, `FIREBASE_SETUP.md`, and **`firebase-service-account.json`**.

### Check `.env.local` has this line (already set for you):

```
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

> **Do not** paste the JSON contents into `.env.local` — multiple lines break the config and cause **“Invalid token”**.

> Keep `firebase-service-account.json` private — never email it or upload to GitHub.

---

## Step 5 — Lock down your database (optional — skip for now if confused)

**What this does:** Stops strangers on the internet from reading your family’s predictions. Your app still works without this step while you’re testing at home.

**You can skip Step 5 entirely for now** and come back later. Steps 1–4 + Step 6 are enough to test.

---

### If you want to do Step 5 (5 minutes, all in the browser)

1. Open **[Firebase Console](https://console.firebase.google.com)** and click your project **world-cup-predictions-48f1d**

2. In the left menu, click **Build** → **Firestore Database**

3. At the top of the Firestore page, click the tab **Rules** (next to “Data”)

4. You will see a text box with some rules already in it. **Select all the text** in that box and **delete it**

5. **Copy and paste** exactly this instead:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click the blue **Publish** button (top right)

7. You should see a message that rules were published. Done.

> **Do not** install anything extra or use the Terminal for this step. It is all done in the Firebase website.

---

## Step 6 — Start the app on your Mac

**What this does:** Turns on the prediction game on your computer so you can open it in Chrome/Safari.

---

### 6a — Open Terminal

1. Press **Cmd + Space** on your keyboard
2. Type **Terminal**
3. Press **Enter**

A window with a black or white background and a blinking cursor will appear. That is normal.

---

### 6b — Go to your project folder

**Copy this whole line**, paste it into Terminal, then press **Enter**:

```bash
cd "/Users/a.khouakhi/Library/CloudStorage/OneDrive-CranfieldUniversity/Projects/11. personal/world_cup"
```

Nothing visible may happen — that is fine.

---

### 6c — Install packages (first time only)

If you have **never** run the app before, paste this and press **Enter**:

```bash
npm install
```

Wait until it finishes (may take 1–2 minutes). When you see the cursor again, it is done.

> If you already ran `npm install` before, you can skip this.

---

### 6d — Start the app

Paste this and press **Enter**:

```bash
npm run dev
```

Wait until you see something like:

```
✓ Ready
- Local: http://127.0.0.1:3000
```

**Leave this Terminal window open.** Closing it stops the app.

---

### 6e — Open the app in your browser

1. Open **Chrome** or **Safari**
2. Click the address bar at the top
3. Type: **http://localhost:3000**
4. Press **Enter**

You should see the green **World Cup Predictions** homepage.

---

### 6f — Create your account and league

1. Click **Get started**
2. Click **New here? Create account**
3. Fill in:
   - **Display name** (e.g. your first name)
   - **Email**
   - **Password** (at least 6 characters)
4. Click **Create account**
5. You should land on **Your leagues**
6. Click **Create a league** → give it a name → click **Create league**
7. Copy the **6-letter invite code** and send it to family on WhatsApp

---

### To stop the app later

Click the Terminal window and press **Ctrl + C** on your keyboard.

---

### To start the app again another day

1. Open Terminal
2. Run the **6b** command (`cd ...`)
3. Run **6d** only (`npm run dev`) — no need to `npm install` again
4. Open **http://localhost:3000** in your browser

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Sign-in shows **Invalid token** | Step 4 not done correctly — put `firebase-service-account.json` in the project folder and restart the app |
| `auth/invalid-credential` | Wrong password, or Email/Password not enabled in Firebase |
| Empty matches | Add `API_FOOTBALL_KEY` and run sync (see README) |

---

## What you do NOT need

- ❌ SQL files (that was for Supabase)
- ❌ The npm install code from Firebase’s wizard
- ❌ Gemini toggle
- ❌ Supabase account
