# Values in the Wild

Editorial values app rebuilt from the `stitch.zip` concepts and the external values definitions JSON.

The current product has four connected surfaces:
- `Library`: searchable values index
- `Value Detail`: full-page value definitions with related values
- `Practice`: prompts generated from the selected value
- `History`: persistent reflections, streaks, and recent entries

Reflections are stored in Postgres through the backend API. Authentication is optional by configuration:
- without Supabase env vars, the app stays in local mode
- with Supabase env vars, field notes and history are tied to authenticated users

Guest mode stays available even when auth is configured. Guests can keep notes locally on the current browser, then claim those notes into their account after signing in.

## Run locally

```bash
npm install
npm run dev:full
```

This starts:
- Vite on `http://localhost:3000`
- the backend API on `http://localhost:8787`

For backend persistence, set `DATABASE_URL` to a Postgres instance. If `DATABASE_URL` is missing, the API still starts, but reflection endpoints return a storage error and the frontend falls back to local browser storage.

`VITE_BACKEND_URL` is optional when the frontend and backend are served from the same origin. Set it only when the API lives on a different host.

To enable real-user auth locally, also set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

The frontend uses Supabase magic links. The backend verifies bearer tokens and stores reflections against the authenticated user id.

The repo includes a bundled copy at `data/Values-en.json`. `VALUES_FILE` is optional and only needed if you want to override that source.
Approved editorial overlays live in `data/ValueSiteContent.json`. This file is merged onto the base values dataset at runtime so stronger reviewed copy can ship without exposing raw source text.

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

## Supabase auth setup

1. Create a Supabase project.
2. In Supabase Auth settings, enable email magic links.
3. Add your redirect URLs:
- local: `http://localhost:3000/guide`
- production: `https://valuesinthewild.com/guide`
- production: `https://www.valuesinthewild.com/guide`
4. Add the Supabase URL + publishable key to both the frontend (`VITE_*`) and backend env vars on Render.
5. Add at least one analytics admin allowlist env var on Render:
- `ADMIN_EMAILS=you@example.com`
- or `ADMIN_USER_IDS=<supabase-user-id>`

### Branded magic-link email

Supabase sends the login email. The repo now includes a branded Magic Link template at [docs/supabase-magic-link-email.html](/Users/simonedeangelis/Downloads/embodied_-values-detective/docs/supabase-magic-link-email.html) that matches the site palette and makes it explicit that the email is for signing in to `Values in the Wild`.

Recommended dashboard settings:
- `Auth -> Email Templates -> Magic Link`
- subject: `Log in to Values in the Wild`
- HTML body: paste the contents of `docs/supabase-magic-link-email.html`

The template uses Supabase's supported template variables, including `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, and `{{ .Email }}`.

When auth is configured:
- `GET /api/v1/me/reflections` requires `Authorization: Bearer <access_token>`
- `PUT /api/v1/me/reflections` requires `Authorization: Bearer <access_token>`
- the legacy `/api/v1/users/:userId/reflections` route remains available for local-mode fallback

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

## Basic analytics

The backend also stores a minimal analytics event stream in Postgres via `POST /api/v1/events`.

Current tracked events include:
- `screen_view`
- `guest_mode_selected`
- `sign_in_requested`
- `magic_link_requested`
- `auth_signed_in`
- `signed_out`
- `reflection_saved`
- `reflection_updated`
- `reflection_deleted`
- `guest_notes_claimed`

Use `/debug/analytics` in the app to inspect recent events and counts. When auth is configured, that route requires a signed-in session.
To lock that route down properly, configure `ADMIN_EMAILS` and/or `ADMIN_USER_IDS`. Only allowlisted users can access the analytics endpoint or see the debug button.
