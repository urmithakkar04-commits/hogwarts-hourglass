# Hogwarts Hourglass

Personal + Play Store ready week planner (5 AM → midnight).

## Local use (PC)

```bash
cd week-planner
npm install
npm run install:all
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:4000  

## Phone install (you only)

Same Wi‑Fi → open `http://YOUR-PC-IP:5173` in Chrome → **Add to Home screen**.

## Google Play (everyone)

Full steps: see **[PLAY_STORE.md](./PLAY_STORE.md)**

Short version:

1. Deploy `backend` to Render/Railway (HTTPS URL)
2. Set that URL in `frontend/.env.production` as `VITE_API_BASE_URL`
3. `cd frontend && npm run android`
4. In Android Studio: signed **AAB** → upload in Play Console

App id: `com.hogwartshourglass.app` · Name: **Hogwarts Hourglass** · Icon: Dobby
