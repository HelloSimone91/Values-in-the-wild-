const configuredBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const API_BASE = configuredBase || (import.meta.env.DEV ? 'http://localhost:8787' : '');

export interface AnalyticsEvent {
  id: number;
  eventName: string;
  userId: string | null;
  anonymousId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AnalyticsSummaryItem {
  eventName: string;
  count: number;
}

export interface AnalyticsDebugPayload {
  events: AnalyticsEvent[];
  summary: AnalyticsSummaryItem[];
  windowHours: number;
}

export const loadAnalyticsDebug = async (accessToken: string | null, limit = 50, hours = 168): Promise<AnalyticsDebugPayload> => {
  if (!API_BASE) {
    throw new Error('Backend API is not configured.');
  }

  const response = await fetch(`${API_BASE}/api/v1/events?limit=${limit}&hours=${hours}`, {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || 'Failed to load analytics debug data.');
  }

  return (await response.json()) as AnalyticsDebugPayload;
};
