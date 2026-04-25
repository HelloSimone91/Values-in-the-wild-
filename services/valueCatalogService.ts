import { findValueBySlug, mergeValueSiteContent } from '../valueCore';
import type { ValueDefinition, ValueSiteContent } from '../valueTypes';

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
  // The field guide content ships with the frontend, so load it directly and
  // keep guide routes independent from backend cold starts.
  return (await loadLocalMergedValues()).map(buildValueSummary);
};

export const loadValueBySlug = async (valueSlug: string): Promise<ValueDefinition | null> => {
  const mergedValues = await loadLocalMergedValues();
  return findValueBySlug(mergedValues, valueSlug);
};
