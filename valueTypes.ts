export type AppView = 'landing' | 'library' | 'value' | 'practice' | 'history';

export type SiteContentSource = 'manual' | 'value-stacks' | 'big-ole' | 'values-in-the-wild';

export interface ApprovedSiteField<T> {
  value: T;
  source: SiteContentSource;
  sourcePageId?: string;
}

export interface PopCultureSpotlight {
  title: string;
  summary: string;
  takeaway: string;
}

export interface SeoContent {
  title?: string;
  description?: string;
  slug?: string;
}

export interface ValueSiteContent {
  summary?: ApprovedSiteField<string>;
  shortDefinition?: ApprovedSiteField<string>;
  longDefinition?: ApprovedSiteField<string>;
  everydayExamples?: ApprovedSiteField<string[]>;
  practiceMoments?: ApprovedSiteField<string[]>;
  misalignment?: ApprovedSiteField<string>;
  habitIdeas?: ApprovedSiteField<string[]>;
  practiceChecklist?: ApprovedSiteField<PracticeChecklistEntry[]>;
  journalPrompts?: ApprovedSiteField<string[]>;
  conversationStarters?: ApprovedSiteField<string[]>;
  popCultureSpotlight?: ApprovedSiteField<PopCultureSpotlight>;
  seo?: ApprovedSiteField<SeoContent>;
}

export interface ValueDefinition {
  name: string;
  description: string;
  example: string;
  inTheWild?: string[];
  category: string;
  tags: string[];
  siteContent?: ValueSiteContent;
}

export interface PracticeItem {
  id: string;
  title: string;
  value: string;
  description: string;
  duration: string;
  accent: 'green' | 'orange' | 'purple';
  prompt: string;
}

export interface QuickChecklistItem {
  id: string;
  value: string;
  label: string;
  summary: string;
}

export interface PracticeChecklistEntry {
  label: string;
  summary: string;
}

export interface ReflectionEntry {
  id: string;
  value: string;
  note: string;
  date: string;
  practiceTitle: string;
}
