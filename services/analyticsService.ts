export interface AnalyticsPayload {
  [key: string]: string | number | boolean | null | undefined;
}

interface AnalyticsEvent {
  name: string;
  payload: AnalyticsPayload;
  timestamp: number;
}

const STORAGE_KEY = 'embodied_analytics_events';
const MAX_EVENTS = 200;
const API_BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

const readEvents = (): AnalyticsEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeEvents = (events: AnalyticsEvent[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
};

export const trackEvent = (name: string, payload: AnalyticsPayload = {}) => {
  const event: AnalyticsEvent = {
    name,
    payload,
    timestamp: Date.now(),
  };

  const current = readEvents();
  current.push(event);
  writeEvents(current);

  if (API_BASE) {
    fetch(`${API_BASE}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {
      // Keep silent: local event copy is already persisted.
    });
  }
};
