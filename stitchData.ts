export type AppView = 'landing' | 'library' | 'value' | 'practice' | 'history';

export interface ValueDefinition {
  name: string;
  description: string;
  example: string;
  inTheWild?: string[];
  category: string;
  tags: string[];
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

const checklistFallbacks: Record<string, string> = {
  'Core Values': 'Watch for a moment when this value asks for honesty over convenience.',
  Personal: 'Watch for a routine, boundary, or body-level choice that quietly reflects this value.',
  Aspirations: 'Watch for the tiny move that turns longing into something lived.',
  Growth: 'Watch for a repetition, correction, or next step that builds this value.',
  Interpersonal: 'Watch for this value in tone, follow-through, or the quality of attention between people.',
  Mindset: 'Watch for this value in the pause between reaction and response.',
  Social: 'Watch for this value in who is included, supported, resourced, or protected.',
};

const microChecklistTitles = [
  'Spot it live',
  'See it in someone',
  'Catch it under pressure',
  'Notice the quiet version',
];

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
    Mindfulness: '🧠',
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

export const createMicroPractices = (value: ValueDefinition): PracticeItem[] => {
  const accent = categoryAccent[value.category] || 'green';
  const observations = value.inTheWild?.length ? value.inTheWild.slice(0, 3) : [value.example];
  const descriptions = [
    ...observations.map((entry) => `Watch for this: ${collapseSpace(entry)}`),
    checklistFallbacks[value.category] || checklistFallbacks.Personal,
  ].slice(0, 4);

  const prompts = [
    `If you notice this today, where does it show up?`,
    `Did you see someone else model this version today?`,
    `If the day gets tense, what would this value look like in motion?`,
    `What is the smallest everyday sign of ${value.name.toLowerCase()} you might miss if you rush?`,
  ];

  return descriptions.map((description, index) => ({
    id: `${value.name}-micro-${index}`,
    title: microChecklistTitles[index],
    value: value.name,
    description,
    duration: '1 min',
    accent,
    prompt: prompts[index],
  }));
};

export const createDeepDivePractices = (value: ValueDefinition): PracticeItem[] => {
  const accent = categoryAccent[value.category] || 'purple';
  const firstTag = value.tags[0] || 'practice';
  const secondTag = value.tags[1] || 'reflect';
  const livedExample = value.inTheWild?.[0] || value.example;

  return [
    {
      id: `${value.name}-deep-example`,
      title: `${value.name} in real life`,
      value: value.name,
      description: livedExample,
      duration: '15 min',
      accent,
      prompt: `Write about a recent moment where you either lived or avoided ${value.name.toLowerCase()}.`,
    },
    {
      id: `${value.name}-deep-tags`,
      title: `${titleCase(firstTag)} and ${titleCase(secondTag)}`,
      value: value.name,
      description: `Use the verbs "${firstTag}" and "${secondTag}" as prompts to design a deeper practice around ${value.name.toLowerCase()}.`,
      duration: '20 min',
      accent,
      prompt: `What would it look like to ${firstTag} and ${secondTag} ${value.name.toLowerCase()} this week?`,
    },
    {
      id: `${value.name}-deep-definition`,
      title: `Define your version of ${value.name}`,
      value: value.name,
      description: value.description,
      duration: '30 min',
      accent,
      prompt: `Translate the definition of ${value.name.toLowerCase()} into a personal rule, ritual, or standard.`,
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
