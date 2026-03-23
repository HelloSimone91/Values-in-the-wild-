import cors from 'cors';
import express from 'express';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hasDatabase, initDatabase, listRecentEvents, listReflections, recordEvent, replaceReflections, summarizeRecentEvents } from './database.mjs';
import { hasSupabaseAuth, requireAuthenticatedUser } from './supabase.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '..', 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');
const VALUES_FILE = process.env.VALUES_FILE || path.join(__dirname, '..', 'data', 'Values-en.json');

const PORT = Number(process.env.PORT || 8787);

const parseCorsOrigins = () => {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:3000';
  if (raw === '*') return '*';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const CORS_ORIGINS = parseCorsOrigins();

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: CORS_ORIGINS === '*' ? true : CORS_ORIGINS,
  })
);

app.get('/api/v1/health', (_req, res) => {
  res.json({
    ok: true,
    now: Date.now(),
    database: hasDatabase() ? 'configured' : 'missing',
    auth: hasSupabaseAuth() ? 'configured' : 'missing',
  });
});

app.get('/api/v1/values', async (_req, res) => {
  try {
    const raw = await fs.readFile(VALUES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    res.json({ values: parsed.values || [] });
  } catch (error) {
    console.error('Failed to load values file:', error);
    res.status(500).json({ error: 'Failed to load values definitions.' });
  }
});

const isValidReflection = (entry) => {
  if (!entry || typeof entry !== 'object') return false;

  return [entry.id, entry.value, entry.note, entry.practiceTitle, entry.date].every(
    (field) => typeof field === 'string' && field.trim()
  );
};

const isValidEventName = (value) => typeof value === 'string' && /^[a-z0-9_.-]{3,64}$/i.test(value);

app.get('/api/v1/users/:userId/reflections', async (req, res) => {
  if (hasSupabaseAuth()) {
    return res.status(403).json({ error: 'Use /api/v1/me/reflections when auth is enabled.' });
  }

  const { userId } = req.params;

  if (typeof userId !== 'string' || !userId.trim()) {
    return res.status(400).json({ error: 'Invalid userId.' });
  }

  try {
    const reflections = await listReflections(userId);
    return res.json({ reflections });
  } catch (error) {
    console.error('Failed to load reflections:', error);
    return res.status(503).json({ error: 'Reflection storage is not configured.' });
  }
});

app.put('/api/v1/users/:userId/reflections', async (req, res) => {
  if (hasSupabaseAuth()) {
    return res.status(403).json({ error: 'Use /api/v1/me/reflections when auth is enabled.' });
  }

  const { userId } = req.params;
  const { reflections } = req.body || {};

  if (typeof userId !== 'string' || !userId.trim()) {
    return res.status(400).json({ error: 'Invalid userId.' });
  }

  if (!Array.isArray(reflections)) {
    return res.status(400).json({ error: 'Body must include { reflections: ReflectionEntry[] }.' });
  }

  if (!reflections.every(isValidReflection)) {
    return res.status(400).json({ error: 'Each reflection must include id, value, note, practiceTitle, and date.' });
  }

  try {
    await replaceReflections(userId, reflections);
    return res.json({ ok: true, reflections });
  } catch (error) {
    console.error('Failed to save reflections:', error);
    return res.status(503).json({ error: 'Reflection storage is not configured.' });
  }
});

app.get('/api/v1/me/reflections', async (req, res) => {
  try {
    const user = await requireAuthenticatedUser(req);
    const reflections = await listReflections(user.id);
    return res.json({ reflections });
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 503;
    console.error('Failed to load authenticated reflections:', error);
    return res.status(status).json({ error: error.message || 'Failed to load reflections.' });
  }
});

app.put('/api/v1/me/reflections', async (req, res) => {
  const { reflections } = req.body || {};

  if (!Array.isArray(reflections)) {
    return res.status(400).json({ error: 'Body must include { reflections: ReflectionEntry[] }.' });
  }

  if (!reflections.every(isValidReflection)) {
    return res.status(400).json({ error: 'Each reflection must include id, value, note, practiceTitle, and date.' });
  }

  try {
    const user = await requireAuthenticatedUser(req);
    await replaceReflections(user.id, reflections);
    return res.json({ ok: true, reflections });
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 503;
    console.error('Failed to save authenticated reflections:', error);
    return res.status(status).json({ error: error.message || 'Failed to save reflections.' });
  }
});

app.post('/api/v1/events', async (req, res) => {
  const { anonymousId, eventName, metadata } = req.body || {};

  if (!isValidEventName(eventName)) {
    return res.status(400).json({ error: 'Invalid eventName.' });
  }

  if (anonymousId != null && (typeof anonymousId !== 'string' || !anonymousId.trim())) {
    return res.status(400).json({ error: 'Invalid anonymousId.' });
  }

  let userId = null;

  if (req.headers.authorization) {
    try {
      const user = await requireAuthenticatedUser(req);
      userId = user.id;
    } catch (error) {
      const status = typeof error?.status === 'number' ? error.status : 401;
      return res.status(status).json({ error: error.message || 'Invalid or expired session.' });
    }
  }

  try {
    await recordEvent({
      anonymousId: anonymousId || null,
      eventName,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      userId,
    });
    return res.status(202).json({ ok: true });
  } catch (error) {
    console.error('Failed to record analytics event:', error);
    return res.status(503).json({ error: 'Analytics storage is not configured.' });
  }
});

app.get('/api/v1/events', async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const hours = Number(req.query.hours || 168);

  if (hasSupabaseAuth()) {
    try {
      await requireAuthenticatedUser(req);
    } catch (error) {
      const status = typeof error?.status === 'number' ? error.status : 401;
      return res.status(status).json({ error: error.message || 'Invalid or expired session.' });
    }
  }

  try {
    const [events, summary] = await Promise.all([listRecentEvents(limit), summarizeRecentEvents(hours)]);
    return res.json({ events, summary, windowHours: hours });
  } catch (error) {
    console.error('Failed to list analytics events:', error);
    return res.status(503).json({ error: 'Analytics storage is not configured.' });
  }
});

if (fsSync.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));

  // In production, serve the built SPA from the same service.
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(DIST_INDEX);
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

await initDatabase();

app.listen(PORT, () => {
  console.log(`Values API listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${Array.isArray(CORS_ORIGINS) ? CORS_ORIGINS.join(', ') : '*'}`);
  console.log(`Database: ${hasDatabase() ? 'configured' : 'missing DATABASE_URL'}`);
  console.log(`Auth: ${hasSupabaseAuth() ? 'configured' : 'missing Supabase env'}`);
});
