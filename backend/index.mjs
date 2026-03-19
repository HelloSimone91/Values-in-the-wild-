import cors from 'cors';
import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const PORT = Number(process.env.PORT || 8787);
const MAX_EVENTS = Number(process.env.MAX_EVENTS || 5000);

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
  plans: {},
  events: [],
};

let store = { ...defaultStore };
let persistQueue = Promise.resolve();

const ensureStore = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await fs.readFile(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    store = {
      plans: parsed.plans || {},
      events: parsed.events || [],
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

app.get('/api/v1/users/:userId/action-plan', (req, res) => {
  const { userId } = req.params;
  const plan = store.plans[userId] || null;
  res.json(plan);
});

app.put('/api/v1/users/:userId/action-plan', async (req, res) => {
  const { userId } = req.params;
  const { plan } = req.body || {};

  if (typeof userId !== 'string' || !userId.trim()) {
    return res.status(400).json({ error: 'Invalid userId.' });
  }

  if (plan !== null && typeof plan !== 'object') {
    return res.status(400).json({ error: 'Body must include { plan: object | null }.' });
  }

  if (plan && (!Array.isArray(plan.days) || !plan.id)) {
    return res.status(400).json({ error: 'Plan must include id and days.' });
  }

  if (plan === null) {
    delete store.plans[userId];
  } else {
    store.plans[userId] = plan;
  }

  await queuePersistStore();
  res.json({ ok: true, plan: store.plans[userId] || null });
});

app.post('/api/v1/events', async (req, res) => {
  const event = req.body || {};

  if (!event.name || typeof event.name !== 'string') {
    return res.status(400).json({ error: 'Event name is required.' });
  }

  const normalizedEvent = {
    ...event,
    serverReceivedAt: Date.now(),
  };

  store.events.push(normalizedEvent);
  if (store.events.length > MAX_EVENTS) {
    store.events = store.events.slice(-MAX_EVENTS);
  }

  await queuePersistStore();
  res.status(201).json({ ok: true });
});

app.get('/api/v1/events', (_req, res) => {
  res.json({ count: store.events.length, events: store.events.slice(-100) });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

await ensureStore();

app.listen(PORT, () => {
  console.log(`Values API listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${Array.isArray(CORS_ORIGINS) ? CORS_ORIGINS.join(', ') : '*'}`);
});
