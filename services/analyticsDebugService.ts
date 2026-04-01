import { buildApiUrl } from './apiBase';

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
  const response = await fetch(buildApiUrl(`/api/v1/events?limit=${limit}&hours=${hours}`), {
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
