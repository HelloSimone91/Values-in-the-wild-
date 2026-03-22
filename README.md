# Values in the Wild

Editorial values app rebuilt from the `stitch.zip` concepts and the external values definitions JSON.

The current product has four connected surfaces:
- `Library`: searchable values index
- `Value Detail`: full-page value definitions with related values
- `Practice`: prompts generated from the selected value
- `History`: persistent reflections, streaks, and recent entries

## Run locally

```bash
npm install
npm run dev:full
```

This starts:
- Vite on `http://localhost:3000`
- the backend API on `http://localhost:8787`

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
