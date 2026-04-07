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

type QuickChecklistFallbackFactory = (value: ValueDefinition) => PracticeChecklistEntry[];

export interface ReflectionEntry {
  id: string;
  value: string;
  note: string;
  date: string;
  practiceTitle: string;
}

export const categoryAccent: Record<string, 'green' | 'orange' | 'purple'> = {
  'Core Values': 'purple',
  Personal: 'green',
  Aspirations: 'orange',
  Growth: 'green',
  Interpersonal: 'orange',
  Mindset: 'purple',
  Social: 'green',
};

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');

const collapseSpace = (value: string) => value.replace(/\s+/g, ' ').trim();

const dedupeStrings = (values: string[]) => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalized = collapseSpace(value).toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const siteList = (field?: ApprovedSiteField<string[]>) => field?.value || [];
const siteText = (field?: ApprovedSiteField<string>) => field?.value || '';

const createDefaultQuickChecklist = (value: ValueDefinition): PracticeChecklistEntry[] => {
  const valueName = value.name.toLowerCase();

  const fallbackFactories: Record<string, QuickChecklistFallbackFactory> = {
    'Core Values': () => [
      {
        label: `Did ${valueName} shape a concrete choice you can point to today?`,
        summary: `${value.name} shaped a concrete choice`,
      },
      {
        label: 'Did you see someone make the more honest or responsible move today?',
        summary: `Saw ${valueName} in an honest or responsible move`,
      },
      {
        label: `Did ${valueName} hold when something got tense, costly, or inconvenient today?`,
        summary: `${value.name} held under tension, cost, or inconvenience`,
      },
      {
        label: `Did you catch a quieter act of ${valueName} that still left a trace today?`,
        summary: `Caught a quieter act of ${valueName}`,
      },
    ],
    Personal: () => [
      {
        label: `Did ${valueName} change how you treated your pace, limits, or energy today?`,
        summary: `${value.name} changed how you treated your pace, limits, or energy`,
      },
      {
        label: 'Did you notice someone honor a need, boundary, or reset without making it dramatic today?',
        summary: `Saw ${valueName} in the way someone honored a need, boundary, or reset`,
      },
      {
        label: `Did ${valueName} hold when the day got messy, rushed, or inconvenient today?`,
        summary: `${value.name} held when the day got messy, rushed, or inconvenient`,
      },
      {
        label: `Did you catch a small private act of ${valueName} in an ordinary moment today?`,
        summary: `Caught a small private act of ${valueName}`,
      },
    ],
    Aspirations: () => [
      {
        label: `Did ${valueName} show up in a real step, not just a wish, today?`,
        summary: `${value.name} showed up in a real step`,
      },
      {
        label: 'Did you see someone choose stretch, possibility, or visible effort today?',
        summary: `Saw ${valueName} in a choice toward stretch, possibility, or visible effort`,
      },
      {
        label: `Did ${valueName} hold before the outcome was clear today?`,
        summary: `${value.name} held before the outcome was clear`,
      },
      {
        label: 'Did you catch a smaller move that pointed life in the right direction today?',
        summary: `Caught ${valueName} in a smaller move in the right direction`,
      },
    ],
    Growth: () => [
      {
        label: `Did ${valueName} show up in practice, revision, or another attempt today?`,
        summary: `${value.name} showed up in practice, revision, or another attempt`,
      },
      {
        label: 'Did you notice someone turn intention into a next step you could actually name today?',
        summary: `Saw ${valueName} turn intention into a clear next step`,
      },
      {
        label: `Did ${valueName} hold when effort, uncertainty, or repetition was required today?`,
        summary: `${value.name} held through effort, uncertainty, or repetition`,
      },
      {
        label: `Did you catch a modest improvement that reflected ${valueName} today?`,
        summary: `Caught ${valueName} in a modest improvement`,
      },
    ],
    Interpersonal: () => [
      {
        label: `Did ${valueName} change the feel of a real interaction today?`,
        summary: `${value.name} changed the feel of a real interaction`,
      },
      {
        label: 'Did you see someone shape their tone, timing, or attention around another person with care today?',
        summary: `Saw ${valueName} in someone's tone, timing, or attention`,
      },
      {
        label: `Did ${valueName} hold in a live conversation, repair, or moment of friction today?`,
        summary: `${value.name} held in conversation, repair, or friction`,
      },
      {
        label: `Did you catch a subtle relational cue that reflected ${valueName} today?`,
        summary: `Caught ${valueName} in a subtle relational cue`,
      },
    ],
    Mindset: () => [
      {
        label: `Did ${valueName} change how you named, framed, or understood something today?`,
        summary: `${value.name} changed how something was named, framed, or understood`,
      },
      {
        label: 'Did you see someone pause long enough to think instead of reacting on autopilot today?',
        summary: `Saw ${valueName} in a pause before reacting`,
      },
      {
        label: `Did ${valueName} hold in uncertainty, complexity, or conflicting signals today?`,
        summary: `${value.name} held in uncertainty, complexity, or conflicting signals`,
      },
      {
        label: `Did you catch a quieter version of ${valueName} in a pause, question, or reframing today?`,
        summary: `Caught a quieter version of ${valueName}`,
      },
    ],
    Social: () => [
      {
        label: `Did ${valueName} affect more than one person today?`,
        summary: `${value.name} affected more than one person`,
      },
      {
        label: 'Did you notice someone use their care, voice, or access to support another person today?',
        summary: `Saw ${valueName} in the way someone supported another person`,
      },
      {
        label: `Did ${valueName} show up when silence or passivity would have been easier today?`,
        summary: `${value.name} showed up when silence or passivity would have been easier`,
      },
      {
        label: `Did you catch a small act of ${valueName} that widened support, inclusion, or shared responsibility today?`,
        summary: `Caught ${valueName} in a small act that widened support or inclusion`,
      },
    ],
  };

  return (fallbackFactories[value.category] || fallbackFactories.Personal)(value);
};

const quickChecklistOverrides: Record<string, PracticeChecklistEntry[]> = {
  Acceptance: [
    {
      label: 'Did you notice yourself or someone else stop fighting reality and work with what was actually true today?',
      summary: 'Stopped fighting reality and worked with what was true',
    },
    {
      label: 'Did you notice someone make room for a hard limit without collapsing into self-pity today?',
      summary: 'Made room for a hard limit without spiraling',
    },
    {
      label: 'Did acceptance show up in a tense moment when the next kind move mattered more than wishing things were different?',
      summary: 'Chose the next kind move instead of arguing with reality',
    },
    {
      label: 'Did you catch a quieter version of acceptance in a small adjustment, reroute, or reset today?',
      summary: 'Caught acceptance in a small adjustment or reset',
    },
  ],
  Accountability: [
    {
      label: 'Did someone own a miss plainly and start fixing it today?',
      summary: 'Owned a miss and started fixing it',
    },
    {
      label: 'Did someone follow through on something other people were counting on today?',
      summary: 'Followed through on something people were counting on',
    },
    {
      label: 'Did accountability show up when it would have been easier to deflect, excuse, or disappear?',
      summary: 'Stayed accountable instead of deflecting or disappearing',
    },
    {
      label: 'Did you notice a quieter version of accountability in a check-in, update, or cleanup no one had to ask for?',
      summary: 'Caught accountability in an unprompted check-in or cleanup',
    },
  ],
  Adventure: [
    {
      label: 'Did someone say yes to something that felt alive and slightly uncertain today?',
      summary: 'Said yes to something alive and uncertain',
    },
    {
      label: 'Did you notice someone choose discovery over predictability today?',
      summary: 'Chose discovery over predictability',
    },
    {
      label: 'Did adventure show up in a moment where comfort had a strong case?',
      summary: 'Chose adventure when comfort had a strong case',
    },
    {
      label: 'Did you catch a smaller version of adventure in a detour, first try, or spontaneous plan today?',
      summary: 'Caught adventure in a detour, first try, or spontaneous plan',
    },
  ],
  Ambiguity: [
    {
      label: 'Did someone stay with "I do not know yet" instead of forcing a neat answer today?',
      summary: 'Stayed with not knowing instead of forcing a neat answer',
    },
    {
      label: 'Did you notice someone hold multiple meanings or mixed motives without flattening them today?',
      summary: 'Held multiple meanings or mixed motives without flattening them',
    },
    {
      label: 'Did ambiguity show up in a decision with incomplete information today?',
      summary: 'Stayed with ambiguity in a decision with incomplete information',
    },
    {
      label: 'Did you catch a quieter version of ambiguity in a pause, question, or softened opinion today?',
      summary: 'Caught ambiguity in a pause, question, or softened opinion',
    },
  ],
  Approachability: [
    {
      label: 'Did someone make it easy for another person to speak today?',
      summary: 'Made it easy for another person to speak',
    },
    {
      label: 'Did you notice genuine warmth, space, or curiosity that lowered the social cost of reaching out today?',
      summary: 'Lowered the social cost of reaching out',
    },
    {
      label: 'Did approachability hold in a tense or status-heavy moment today?',
      summary: 'Kept approachability even in a tense or status-heavy moment',
    },
    {
      label: 'Did you catch it in small signals like body language, tone, or an unhurried reply today?',
      summary: 'Caught approachability in body language, tone, or an unhurried reply',
    },
  ],
  Capitalism: [
    {
      label: 'Did you notice someone take a business or money risk in hopes of building something today?',
      summary: 'Took a business or money risk to build something',
    },
    {
      label: 'Did you see a live market moment, like pricing, selling, competing, or investing, that made capitalism visible today?',
      summary: 'Noticed capitalism in a live market moment',
    },
    {
      label: 'Did capitalism show up in a hard tradeoff about ownership, incentive, or profit today?',
      summary: 'Caught capitalism in a hard tradeoff about ownership, incentive, or profit',
    },
    {
      label: 'Did you catch it in smaller signals like how people talked about value, growth, or customers today?',
      summary: 'Caught capitalism in the way people talked about value, growth, or customers',
    },
  ],
  Comfort: [
    {
      label: 'Did someone make a space, body, or conversation feel gentler today?',
      summary: 'Made a space, body, or conversation feel gentler',
    },
    {
      label: 'Did you notice someone actively helping another person relax, settle, or feel safe enough to stay today?',
      summary: 'Helped another person relax, settle, or feel safe enough to stay',
    },
    {
      label: 'Did comfort show up when stress, pain, or overstimulation were in the room?',
      summary: 'Brought comfort into stress, pain, or overstimulation',
    },
    {
      label: 'Did you catch it in a blanket, chair, tone of voice, snack, pause, or other small soothing detail today?',
      summary: 'Caught comfort in a small soothing detail',
    },
  ],
  Craftsmanship: [
    {
      label: 'Did you notice someone take extra care with fit, finish, or details today?',
      summary: 'Took extra care with fit, finish, or details',
    },
    {
      label: 'Did you see someone refuse to leave something sloppy even when no one else would have noticed today?',
      summary: 'Refused to leave something sloppy even when no one else would notice',
    },
    {
      label: 'Did craftsmanship hold when speed or convenience were tempting?',
      summary: 'Kept craftsmanship when speed or convenience were tempting',
    },
    {
      label: 'Did you catch it in a tiny correction, refinement, or quality check today?',
      summary: 'Caught craftsmanship in a tiny correction, refinement, or quality check',
    },
  ],
  Discipline: [
    {
      label: 'Did someone keep to a plan even when they did not feel like it today?',
      summary: 'Kept to a plan even without feeling like it',
    },
    {
      label: 'Did you notice practice, repetition, or structure carrying a person through the day?',
      summary: 'Let practice, repetition, or structure carry the day',
    },
    {
      label: 'Did discipline show up when distraction or comfort were pulling hard?',
      summary: 'Stayed disciplined while distraction or comfort were pulling hard',
    },
    {
      label: 'Did you catch it in a small kept promise, routine, or boundary today?',
      summary: 'Caught discipline in a kept promise, routine, or boundary',
    },
  ],
  Freedom: [
    {
      label: 'Did someone make a real choice without coercion today?',
      summary: 'Made a real choice without coercion',
    },
    {
      label: 'Did you notice someone tell the truth, move, refuse, or create more freely today?',
      summary: 'Moved, refused, or created more freely',
    },
    {
      label: 'Did freedom show up when control, pressure, or compliance were on the table?',
      summary: 'Held onto freedom under control, pressure, or compliance',
    },
    {
      label: 'Did you catch it in a smaller moment of agency, permission, or breathing room today?',
      summary: 'Caught freedom in a moment of agency, permission, or breathing room',
    },
  ],
  Choice: [
    {
      label: 'Did someone get a real option today instead of just the performance of options?',
      summary: 'Had a real option instead of the performance of options',
    },
    {
      label: 'Did you notice a person say no, change course, or pick what actually fit them today?',
      summary: 'Said no, changed course, or picked what actually fit',
    },
    {
      label: 'Did choice matter in a moment with pressure, urgency, or outside expectation today?',
      summary: 'Protected real choice in a pressured moment',
    },
    {
      label: 'Did you catch it in a small preference, boundary, or redirect today?',
      summary: 'Caught choice in a small preference, boundary, or redirect',
    },
  ],
  Stewardship: [
    {
      label: 'Did someone care for something as if it had to last beyond them today?',
      summary: 'Cared for something as if it had to last beyond them',
    },
    {
      label: 'Did you notice someone leave a place, tool, relationship, or resource better than they found it today?',
      summary: 'Left a place, tool, relationship, or resource better than they found it',
    },
    {
      label: 'Did stewardship hold when short-term convenience could have won today?',
      summary: 'Kept stewardship when short-term convenience could have won',
    },
    {
      label: 'Did you catch it in maintenance, cleanup, tending, or careful use today?',
      summary: 'Caught stewardship in maintenance, cleanup, tending, or careful use',
    },
  ],
  Teaching: [
    {
      label: 'Did someone explain something at the other person’s pace today?',
      summary: 'Explained something at the other person’s pace',
    },
    {
      label: 'Did you notice someone use examples, questions, or practice to help understanding land today?',
      summary: 'Used examples, questions, or practice to help understanding land',
    },
    {
      label: 'Did teaching hold when it would have been easier to rush, show off, or move on?',
      summary: 'Kept teaching well when it would have been easier to rush or move on',
    },
    {
      label: 'Did you catch it in a small clarification or patient re-explanation today?',
      summary: 'Caught teaching in a small clarification or patient re-explanation',
    },
  ],
  Tranquility: [
    {
      label: 'Did someone lower the noise in a room, conversation, or nervous system today?',
      summary: 'Lowered the noise in a room, conversation, or nervous system',
    },
    {
      label: 'Did you notice someone slow the pace enough for calm to return today?',
      summary: 'Slowed the pace enough for calm to return',
    },
    {
      label: 'Did tranquility show up in the middle of stress instead of only after it passed?',
      summary: 'Found tranquility in the middle of stress',
    },
    {
      label: 'Did you catch it in a breath, walk, pause, or gentle simplification today?',
      summary: 'Caught tranquility in a breath, walk, pause, or gentle simplification',
    },
  ],
  Vision: [
    {
      label: 'Did someone act from a clear picture of what they were building toward today?',
      summary: 'Acted from a clear picture of what they were building toward',
    },
    {
      label: 'Did you notice someone make a present choice because they could see farther ahead than the moment today?',
      summary: 'Made a present choice because they could see farther ahead than the moment',
    },
    {
      label: 'Did vision matter in a hard tradeoff or a delayed-reward decision today?',
      summary: 'Used vision in a hard tradeoff or delayed-reward decision',
    },
    {
      label: 'Did you catch it in a sketch, plan, sentence, or decision that quietly pointed forward today?',
      summary: 'Caught vision in something that quietly pointed forward',
    },
  ],
};

export const accentClass = {
  green: 'bg-[#d7f2dd] text-[#255b31]',
  orange: 'bg-[#ffdcc7] text-[#723600]',
  purple: 'bg-[#ece6ff] text-[#4f457f]',
};

export const valueEmoji = (valueName: string) => {
  const mapping: Record<string, string> = {
    Acceptance: '🤲',
    Accountability: '🧭',
    Achievement: '🏁',
    Action: '⚡',
    Adventure: '🧳',
    Advocacy: '📣',
    Ambition: '🚀',
    Appreciation: '🌞',
    Approachability: '💬',
    Authenticity: '💎',
    Balance: '⚖️',
    Beauty: '🌷',
    Bravery: '🛡️',
    Compassion: '🌿',
    Connection: '🔗',
    Courage: '🦁',
    Creativity: '🎨',
    Curiosity: '🔍',
    Discipline: '⏰',
    Empathy: '💙',
    Equality: '＝',
    Exploration: '🗺️',
    Clarity: '🔭',
    Collaboration: '🤝',
    Gratitude: '✨',
    Longevity: '⏳',
    Mindfulness: '🧠',
    Serenity: '🪷',
    Travel: '✈️',
    Tranquility: '🕊️',
  };

  return mapping[valueName] || '✦';
};

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

export const getValueSearchText = (value: ValueDefinition) =>
  [
    value.name,
    value.description,
    value.example,
    value.inTheWild?.join(' ') || '',
    value.category,
    value.tags.join(' '),
    siteText(value.siteContent?.summary),
    siteText(value.siteContent?.shortDefinition),
    siteText(value.siteContent?.longDefinition),
    siteText(value.siteContent?.misalignment),
    siteList(value.siteContent?.everydayExamples).join(' '),
    siteList(value.siteContent?.practiceMoments).join(' '),
    siteList(value.siteContent?.habitIdeas).join(' '),
    (value.siteContent?.practiceChecklist?.value || [])
      .map((item) => `${item.label} ${item.summary}`)
      .join(' '),
    siteList(value.siteContent?.journalPrompts).join(' '),
    siteList(value.siteContent?.conversationStarters).join(' '),
    value.siteContent?.popCultureSpotlight?.value.title || '',
    value.siteContent?.popCultureSpotlight?.value.summary || '',
    value.siteContent?.popCultureSpotlight?.value.takeaway || '',
  ]
    .join(' ')
    .toLowerCase();

const hasWordBoundaryMatch = (text: string, query: string) => {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escapedQuery}`).test(text);
};

const getTagSearchScore = (tags: string[], query: string) => {
  if (tags.some((tag) => tag === query)) return 850;
  if (tags.some((tag) => tag.startsWith(query))) return 750;
  if (tags.some((tag) => hasWordBoundaryMatch(tag, query))) return 650;
  if (tags.some((tag) => tag.includes(query))) return 550;
  return null;
};

export const getValueSearchScore = (value: ValueDefinition, rawQuery: string) => {
  const normalizedQuery = collapseSpace(rawQuery).toLowerCase();
  if (!normalizedQuery) return null;

  const normalizedName = collapseSpace(value.name).toLowerCase();
  const normalizedCategory = collapseSpace(value.category).toLowerCase();
  const normalizedTags = value.tags.map((tag) => collapseSpace(tag).toLowerCase());
  const searchText = getValueSearchText(value);
  const tagScore = getTagSearchScore(normalizedTags, normalizedQuery);

  if (!searchText.includes(normalizedQuery)) return null;
  if (normalizedName === normalizedQuery) return 1000;
  if (tagScore !== null) return tagScore;
  if (normalizedName.startsWith(normalizedQuery)) return 700;
  if (hasWordBoundaryMatch(normalizedName, normalizedQuery)) return 600;
  if (normalizedCategory === normalizedQuery) return 500;
  if (normalizedName.includes(normalizedQuery)) return 300;
  if (hasWordBoundaryMatch(searchText, normalizedQuery)) return 200;
  return 100;
};

const createFallbackWildMoments = (value: ValueDefinition): string[] => {
  const valueName = value.name.toLowerCase();

  switch (value.category) {
    case 'Core Values':
      return [
        `Look for a moment when ${valueName} shaped a real choice instead of staying abstract.`,
        `You can spot ${valueName} in whether someone follows through when it costs them something.`,
        `It often becomes clearest in tense moments, repairs, and decisions that leave a trace.`,
      ];
    case 'Personal':
      return [
        `Look for a small choice that made life more steady, kind, or sustainable.`,
        `You can spot ${valueName} in how someone treats their limits, pace, or private standards.`,
        `It often shows up in ordinary adjustments long before it becomes a dramatic decision.`,
      ];
    case 'Aspirations':
      return [
        `Look for a concrete step toward what matters, not just a fantasy about it.`,
        `You can spot ${valueName} when someone risks motion, stretch, or visible effort.`,
        `It often appears before the outcome is certain and before anyone knows whether it will pay off.`,
      ];
    case 'Growth':
      return [
        `Look for practice, revision, or a next attempt instead of waiting to feel ready.`,
        `You can spot ${valueName} in what someone does after friction, boredom, or uncertainty enters the room.`,
        `It often shows up in repeatable small actions more than dramatic breakthroughs.`,
      ];
    case 'Interpersonal':
      return [
        `Look for a live interaction where another person feels the effect directly.`,
        `You can spot ${valueName} in tone, timing, listening, and what happens after a misunderstanding.`,
        `It often appears in small relational moves that change the feel of the moment.`,
      ];
    case 'Mindset':
      return [
        `Look for the thought pattern or naming move that changed what happened next.`,
        `You can spot ${valueName} in how someone handles uncertainty, complexity, or a strong first reaction.`,
        `It often shows up in a pause, question, or reframing that keeps the situation honest.`,
      ];
    case 'Social':
      return [
        `Look for a moment when someone's care or voice affected more than just themselves.`,
        `You can spot ${valueName} in who gets included, protected, backed, or taken seriously.`,
        `It often appears when silence would have been easier and someone stays engaged anyway.`,
      ];
    default:
      return [
        `Look for a real moment where ${valueName} changed what someone said, did, or chose.`,
        `You can spot ${valueName} in behavior before you can explain it in theory.`,
        `It often shows up in the small move that changes the feel of the moment.`,
      ];
  }
};

export const getValueWildMoments = (value: ValueDefinition, max = 3): string[] => {
  const practiceLines = dedupeStrings(siteList(value.siteContent?.practiceMoments));
  if (practiceLines.length) {
    return practiceLines.slice(0, max);
  }

  const editorialLines = dedupeStrings(siteList(value.siteContent?.everydayExamples));
  if (editorialLines.length) {
    return editorialLines.slice(0, max);
  }
  return createFallbackWildMoments(value).slice(0, max);
};

export const createQuickChecklist = (value: ValueDefinition): QuickChecklistItem[] => {
  const siteChecklist = value.siteContent?.practiceChecklist?.value || [];
  const overrideItems = quickChecklistOverrides[value.name];
  const checklistItems =
    siteChecklist.length ? siteChecklist : overrideItems?.length ? overrideItems : createDefaultQuickChecklist(value);

  return checklistItems.map((item, index) => ({
    id: `${value.name}-quick-${index}`,
    value: value.name,
    label: item.label,
    summary: item.summary,
  }));
};

export const createDeepDivePractices = (value: ValueDefinition): PracticeItem[] => {
  const accent = categoryAccent[value.category] || 'purple';
  const firstTag = value.tags[0] || 'practice';
  const secondTag = value.tags[1] || 'reflect';
  const libraryLine = collapseSpace(getValueWildMoments(value, 1)[0] || value.description);
  const longDefinition = collapseSpace(siteText(value.siteContent?.longDefinition) || value.description);
  const journalPrompts = dedupeStrings(siteList(value.siteContent?.journalPrompts)).slice(0, 2);
  const habitIdeas = dedupeStrings(siteList(value.siteContent?.habitIdeas)).slice(0, 1);

  if (journalPrompts.length) {
    const editorialPractices = journalPrompts.map((prompt, index) => ({
      id: `${value.name}-deep-journal-${index}`,
      title: index === 0 ? 'Journal prompt' : 'Stay with the question',
      value: value.name,
      description: prompt,
      duration: '20 min',
      accent,
      prompt,
    }));

    if (habitIdeas[0]) {
      editorialPractices.push({
        id: `${value.name}-deep-ritual`,
        title: 'Turn it into a ritual',
        value: value.name,
        description: habitIdeas[0],
        duration: '15 min',
        accent,
        prompt: `Try this as a lived experiment: ${habitIdeas[0]}`,
      });
    } else {
      editorialPractices.push({
        id: `${value.name}-deep-definition`,
        title: `Define your version of ${value.name}`,
        value: value.name,
        description: 'Translate the editorial guide into a personal standard you can actually keep.',
        duration: '20 min',
        accent,
        prompt: `Use this guide line as a starting point: "${longDefinition}" What would ${value.name.toLowerCase()} look like in your life if it were specific, embodied, and non-performative?`,
      });
    }

    return editorialPractices;
  }

  return [
    {
      id: `${value.name}-deep-pressure`,
      title: `${value.name} under pressure`,
      value: value.name,
      description: `Use a real moment when ${value.name.toLowerCase()} became inconvenient, costly, or easy to avoid.`,
      duration: '15 min',
      accent,
      prompt: `Write about a recent moment when ${value.name.toLowerCase()} was tested. What happened, what did you do, and what would a fuller version of this value have asked of you?`,
    },
    {
      id: `${value.name}-deep-tags`,
      title: `${titleCase(firstTag)} and ${titleCase(secondTag)}`,
      value: value.name,
      description: `Borrow the verbs from your ${value.name.toLowerCase()} entry to design one small experiment for the week.`,
      duration: '20 min',
      accent,
      prompt: `Your library associates ${value.name.toLowerCase()} with "${firstTag}" and "${secondTag}." Which one feels alive, which one feels neglected, and what is one concrete way to practice it this week?`,
    },
    {
      id: `${value.name}-deep-definition`,
      title: `Define your version of ${value.name}`,
      value: value.name,
      description: `Start with your library language, then rewrite it into a personal rule, boundary, or ritual you can actually live.`,
      duration: '25 min',
      accent,
      prompt: `Your library says: "${libraryLine}" Use that together with this definition: "${longDefinition}" What does ${value.name.toLowerCase()} look like in your life when it is specific, embodied, and non-performative?`,
    },
  ];
};

export const formatReflectionDate = (date: string) => {
  const target = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const targetKey = target.toDateString();
  if (targetKey === today.toDateString()) return 'Today';
  if (targetKey === yesterday.toDateString()) return 'Yesterday';

  return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const buildTrendBars = (reflections: ReflectionEntry[]) => {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });

  return days.map((date, index) => {
    const count = reflections.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.toDateString() === date.toDateString();
    }).length;

    return {
      label: labels[index],
      count,
    };
  });
};

export const calculateStreak = (reflections: ReflectionEntry[]) => {
  const dates = new Set(reflections.map((entry) => new Date(entry.date).toDateString()));
  const cursor = new Date();
  let streak = 0;

  while (dates.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};
