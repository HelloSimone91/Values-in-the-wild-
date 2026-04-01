import { buildApiUrl } from './apiBase';

type AnalyticsPayload = Record<string, unknown>;

interface TrackEventOptions {
  accessToken?: string | null;
  anonymousId?: string | null;
  metadata?: AnalyticsPayload;
}

export const trackEvent = async (eventName: string, options: TrackEventOptions = {}): Promise<void> => {
  const payload = {
    eventName,
    anonymousId: options.anonymousId || undefined,
    metadata: options.metadata || {},
  };

  try {
    await fetch(buildApiUrl('/api/v1/events'), {
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
