const configuredBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const API_BASE = configuredBase || (import.meta.env.DEV ? 'http://localhost:8787' : '');

type AnalyticsPayload = Record<string, unknown>;

interface TrackEventOptions {
  accessToken?: string | null;
  anonymousId?: string | null;
  metadata?: AnalyticsPayload;
}

export const trackEvent = async (eventName: string, options: TrackEventOptions = {}): Promise<void> => {
  if (!API_BASE) return;

  const payload = {
    eventName,
    anonymousId: options.anonymousId || undefined,
    metadata: options.metadata || {},
  };

  try {
    await fetch(`${API_BASE}/api/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.accessToken
          ? {
              Authorization: `Bearer ${options.accessToken}`,
            }
          : {}),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics should never block the product flow.
  }
};
