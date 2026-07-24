# Publish Hogwarts Hourglass to Google Play (for everyone)

This app is a **Capacitor Android** wrapper around the React UI. Everyone needs a **live HTTPS API** — phones cannot use `localhost` on your PC.

## 1) Deploy the backend (required)

1. Create a free account on [Render](https://render.com) (or Railway / Fly.io).
2. New → Web Service → connect this GitHub repo (or upload the `backend` folder).
3. Settings:
   - **Root directory:** `backend`
   - **Build:** `npm install`
   - **Start:** `npm start`
4. After deploy, copy your URL, e.g. `https://hogwarts-hourglass-api.onrender.com`
5. Open `https://YOUR-URL/api/health` — you should see `{ "ok": true, ... }`

Or use the included `render.yaml` at the repo root (Blueprint).

## 2) Point the Android app at that API

Edit `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://YOUR-URL
```

(No trailing slash.)

## 3) Build the Android project

On your PC install:

- [Node.js](https://nodejs.org)
- [Android Studio](https://developer.android.com/studio) (with Android SDK)

Then:

```bash
cd week-planner
npm run install:all
cd frontend
npm install
npm run android
```

That builds the web app, syncs Capacitor, and opens **Android Studio**.

## 4) App identity (already set)

| Field | Value |
|--------|--------|
| App name | Hogwarts Hourglass |
| Package ID | `com.hogwartshourglass.app` |
| Icon | Dobby (`public/icons`) |

In Android Studio, replace launcher icons if needed:

`android/app/src/main/res/` → use **Image Asset** studio with `frontend/public/icons/icon-512.png`.

## 5) Generate a Play Store upload file (AAB)

1. Android Studio → **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Create a new keystore (save the passwords somewhere safe — you need them forever)
4. Build release → you get an `.aab` file

## 6) Google Play Console

1. Pay the one-time [Play Console](https://play.google.com/console) developer fee
2. **Create app** → name **Hogwarts Hourglass**
3. Complete:
   - Store listing (title, short/full description, screenshots)
   - Privacy policy URL (required — can be a simple Google Doc / Notion public page)
   - Content rating questionnaire
   - Data safety form
   - Target audience
4. **Production** (or Internal testing first) → Upload the `.aab`
5. Submit for review

Internal testing first is recommended — you can invite your own Gmail and test before public release.

## 7) After updates

Whenever you change the web UI or API URL:

```bash
cd frontend
# ensure .env.production is correct
npm run android
```

Then rebuild the signed AAB in Android Studio and upload a new version (increase `versionCode` in `android/app/build.gradle`).

## Notes

- Free Render apps may sleep after idle time — first open can be slow; upgrade if needed.
- Do **not** commit real API secrets; `JWT_SECRET` should be set in the host’s environment.
- Harry Potter branding may get trademark attention from Warner Bros. For a public store listing, use original art/names if you want zero risk (e.g. rename for store if required).
