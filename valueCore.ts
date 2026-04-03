import type { ValueDefinition, ValueSiteContent } from './valueTypes';

export const slugifyValueName = (valueName: string) =>
  valueName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const findValueBySlug = (values: ValueDefinition[], slug: string) =>
  values.find((value) => slugifyValueName(value.name) === slug) || null;

export const mergeValueSiteContent = (
  values: ValueDefinition[],
  siteContentByValue: Record<string, ValueSiteContent> = {}
): ValueDefinition[] =>
  values.map((value) => ({
    ...value,
    siteContent: siteContentByValue[value.name] || value.siteContent,
  }));
