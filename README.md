<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/12w64UVoGcSPzuL74_3PqOZStDQJi4lRM

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`
3. Run frontend + API together:
   `npm run dev:full`

## Values-to-Action Plan (v1)

The app now includes an `Action Plan` mode with:
- 7-day plan generation from top embodied values
- Daily one-tap check-ins (`Done`, `Partially Done`, `Skipped`)
- Mid-week replanning for remaining days
- Weekly summary export with explicit consent gate

## Backend Persistence (cross-device ready)

Set `VITE_BACKEND_URL` to enable server persistence. In local development, the frontend defaults to `http://localhost:8787` automatically.

```bash
VITE_BACKEND_URL=https://your-api.example.com
```

Included backend endpoints:
- `GET /api/v1/users/:userId/action-plan`
- `PUT /api/v1/users/:userId/action-plan`
- `POST /api/v1/events`
- `GET /api/v1/health`

### Backend Commands

- Run only API server: `npm run dev:api`
- Run only frontend: `npm run dev`
- Run both: `npm run dev:full`

### Backend Storage

The backend stores data in `backend/data/store.json`:
- `plans` keyed by `userId`
- `events` for analytics

If backend is unavailable, the app still falls back to local storage.
