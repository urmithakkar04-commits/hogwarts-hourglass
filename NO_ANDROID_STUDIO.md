# How to get the app WITHOUT installing Android Studio on your PC

You do **not** need Android Studio to test the app.

## Option A — Easiest: install from your phone browser (PWA)

1. Make sure Render API works:  
   https://hogwarts-hourglass-api.onrender.com/api/health
2. On your phone, open the website (after you deploy frontend, or use your PC IP for local).
3. Chrome menu → **Add to Home screen / Install app**
4. App name: **Hogwarts Hourglass** (Dobby icon)

This is perfect for **you** using it like an app.

---

## Option B — GitHub builds the APK for you (no Android Studio)

Your project has a GitHub Action that builds `app-debug.apk`.

### 1) Push the workflow to GitHub

On your PC:

```powershell
cd "C:\Users\91926\OneDrive\Desktop\CLG\week-planner"
git add .
git commit -m "Add GitHub Action to build Android APK"
git push
```

### 2) Set your API URL (one time)

1. Open GitHub → your repo `hogwarts-hourglass`
2. **Settings → Secrets and variables → Actions → Variables**
3. New variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://hogwarts-hourglass-api.onrender.com`

### 3) Run the build

1. GitHub → **Actions**
2. Click **Build Android APK**
3. Click **Run workflow** → **Run workflow**
4. Wait 5–10 minutes (green check = success)

### 4) Download the APK

1. Open the finished workflow run
2. Scroll to **Artifacts**
3. Download **hogwarts-hourglass-debug-apk**
4. Unzip it → you get `app-debug.apk`
5. Copy APK to your phone and open it to install  
   (Phone may ask: allow install from unknown sources)

This installs **Hogwarts Hourglass** like a normal app for testing.

---

## Option C — If you still want Android Studio later

Try these download tricks:

1. Use **Chrome** or **Edge** (not a blocked school network if possible)
2. Official page: https://developer.android.com/studio
3. Or direct “Download Options” → choose your Windows ZIP / EXE
4. Pause antivirus only while downloading (turn it back on after)
5. Need a friend / cyber cafe PC with better internet, copy the installer USB

If Android Studio keeps saying **Cannot start the IDE**, reinstall after full uninstall.

---

## About Play Store (everyone)

Play Store needs a **signed release AAB** + Play Console account.

- For now: use **Option B APK** to use the app yourself
- For Play Store later: either fix Android Studio, OR we can add a signed-release GitHub Action once you create a keystore

---

## Recommended path for you today

1. Push code (Option B step 1)
2. Add GitHub variable `VITE_API_BASE_URL`
3. Run **Build Android APK**
4. Install APK on your phone
