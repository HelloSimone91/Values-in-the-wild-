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
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Values-to-Action Plan (v1)

The app now includes an `Action Plan` mode with:
- 7-day plan generation from top embodied values
- Daily one-tap check-ins (`Done`, `Partially Done`, `Skipped`)
- Mid-week replanning for remaining days
- Weekly summary export with explicit consent gate

## Backend Persistence (cross-device ready)

Set `VITE_BACKEND_URL` to enable server persistence:

```bash
VITE_BACKEND_URL=https://your-api.example.com
```

Expected endpoints:
- `GET /api/v1/users/:userId/action-plan`
- `PUT /api/v1/users/:userId/action-plan`
- `POST /api/v1/events` (optional analytics sink)

If no backend URL is set, the app falls back to local storage.
