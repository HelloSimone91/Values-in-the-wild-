# Valu

Editorial values app rebuilt from the `stitch.zip` concepts.

The current product shell has three stitched views:
- `Library`: expandable values cards
- `Practice`: daily practice examples
- `History`: progress, stats, and recent reflections

## Run locally

```bash
npm install
npm run dev
```

If you want to serve the production build through the Node backend:

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
