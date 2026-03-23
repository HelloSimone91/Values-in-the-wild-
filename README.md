# Values in the Wild

Editorial values app rebuilt from the `stitch.zip` concepts and the external values definitions JSON.

The current product has four connected surfaces:
- `Library`: searchable values index
- `Value Detail`: full-page value definitions with related values
- `Practice`: prompts generated from the selected value
- `History`: persistent reflections, streaks, and recent entries

Reflections are now stored in Postgres through the backend API. The frontend contract is unchanged.

## Run locally

```bash
npm install
npm run dev:full
```

This starts:
- Vite on `http://localhost:3000`
- the backend API on `http://localhost:8787`

For backend persistence, set `DATABASE_URL` to a Postgres instance. If `DATABASE_URL` is missing, the API still starts, but reflection endpoints return a storage error and the frontend falls back to local browser storage.

The repo includes a bundled copy at `data/Values-en.json`. `VALUES_FILE` is optional and only needed if you want to override that source.

If you want to serve the production build through the Node backend instead:

```bash
npm run build
npm run start
```

Open `http://localhost:8787`.

## Deployment

The repo includes:
- [render.yaml](/Users/simonedeangelis/Downloads/embodied_-values-detective/render.yaml) for a single Render web service
- [Dockerfile](/Users/simonedeangelis/Downloads/embodied_-values-detective/Dockerfile) for container deployment

Production uses the Node backend to serve the built Vite frontend and the existing API routes.

## Postgres

The backend creates the `reflections` table automatically on startup.

Schema shape:
- `user_id`
- `reflection_id`
- `value_name`
- `note`
- `practice_title`
- `reflection_date`
- `updated_at`

The Render blueprint provisions a managed Postgres database and injects `DATABASE_URL` into the web service.
