import { findValueBySlug, mergeValueSiteContent } from '../valueCore';
import type { ValueDefinition, ValueSiteContent } from '../valueTypes';
import { buildApiUrl } from './apiBase';

const isLocalPreviewHost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const configuredBackendBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

const shouldTryValuesApi = (): boolean => Boolean(configuredBackendBase) || import.meta.env.DEV || !isLocalPreviewHost;

const buildValueSummary = (value: ValueDefinition): ValueDefinition => ({
  name: value.name,
  description: value.description,
  example: value.example,
  inTheWild: value.inTheWild,
  category: value.category,
  tags: value.tags,
  siteContent:
    value.siteContent?.summary || value.siteContent?.shortDefinition
      ? {
          summary: value.siteContent?.summary,
          shortDefinition: value.siteContent?.shortDefinition,
        }
      : undefined,
});

const loadLocalMergedValues = async (): Promise<ValueDefinition[]> => {
  const localValuesModule = await import('../data/Values-en.json');
  const localSiteContentModule = await import('../data/ValueSiteContent.json');

  return mergeValueSiteContent(
    (localValuesModule.default.values || []) as ValueDefinition[],
    (localSiteContentModule.default || {}) as Record<string, ValueSiteContent>
  );
};

export const loadValueSummaries = async (): Promise<ValueDefinition[]> => {
  if (shouldTryValuesApi()) {
    try {
      const response = await fetch(buildApiUrl('/api/v1/values'));
      if (response.ok) {
        const payload = (await response.json()) as { values?: ValueDefinition[] };
        return payload.values || [];
      }
    } catch {
      // Fall back to bundled data in static preview environments.
    }
  }

  return (await loadLocalMergedValues()).map(buildValueSummary);
};

export const loadValueBySlug = async (valueSlug: string): Promise<ValueDefinition | null> => {
  if (shouldTryValuesApi()) {
    try {
      const response = await fetch(buildApiUrl(`/api/v1/values/${encodeURIComponent(valueSlug)}`));
      if (response.status === 404) {
        return null;
      }

      if (response.ok) {
        const payload = (await response.json()) as { value?: ValueDefinition | null };
        return payload.value || null;
      }
    } catch {
      // Fall back to bundled data in static preview environments.
    }
  }

  const mergedValues = await loadLocalMergedValues();
  return findValueBySlug(mergedValues, valueSlug);
};
