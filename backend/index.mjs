import cors from 'cors';
import express from 'express';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
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

const defaultStore = {
  reflections: {},
};

let store = { ...defaultStore };
let persistQueue = Promise.resolve();

const ensureStore = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await fs.readFile(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    store = {
      reflections: parsed.reflections || {},
    };
  } catch {
    await queuePersistStore();
  }
};

const persistStore = async () => {
  const tempFile = `${STORE_FILE}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  const payload = JSON.stringify(store, null, 2);
  await fs.writeFile(tempFile, payload, 'utf-8');
  await fs.rename(tempFile, STORE_FILE);
};

const queuePersistStore = async () => {
  persistQueue = persistQueue.then(() => persistStore()).catch((error) => {
    console.error('Persist queue error:', error);
  });
  return persistQueue;
};

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: CORS_ORIGINS === '*' ? true : CORS_ORIGINS,
  })
);

app.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true, now: Date.now() });
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

app.get('/api/v1/users/:userId/reflections', (req, res) => {
  const { userId } = req.params;
  const reflections = store.reflections[userId] || [];
  res.json({ reflections });
});

app.put('/api/v1/users/:userId/reflections', async (req, res) => {
  const { userId } = req.params;
  const { reflections } = req.body || {};

  if (typeof userId !== 'string' || !userId.trim()) {
    return res.status(400).json({ error: 'Invalid userId.' });
  }

  if (!Array.isArray(reflections)) {
    return res.status(400).json({ error: 'Body must include { reflections: ReflectionEntry[] }.' });
  }

  store.reflections[userId] = reflections;
  await queuePersistStore();
  res.json({ ok: true, reflections });
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

await ensureStore();

app.listen(PORT, () => {
  console.log(`Values API listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${Array.isArray(CORS_ORIGINS) ? CORS_ORIGINS.join(', ') : '*'}`);
});
