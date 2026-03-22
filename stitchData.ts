export type AppView = 'library' | 'value' | 'practice' | 'history';

export interface ValueDefinition {
  name: string;
  description: string;
  example: string;
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
  };

  return mapping[valueName] || '✦';
};

export const createMicroPractices = (value: ValueDefinition): PracticeItem[] => {
  const tags = value.tags.slice(0, 4);
  const accent = categoryAccent[value.category] || 'green';

  return tags.map((tag, index) => ({
    id: `${value.name}-micro-${index}`,
    title: `${titleCase(tag)} in motion`,
    value: value.name,
    description: `For one minute, choose one small way to ${tag} this value in a concrete moment today.`,
    duration: '1 min',
    accent,
    prompt: `Where can you ${tag} ${value.name.toLowerCase()} in the next hour?`,
  }));
};

export const createDeepDivePractices = (value: ValueDefinition): PracticeItem[] => {
  const accent = categoryAccent[value.category] || 'purple';
  const firstTag = value.tags[0] || 'practice';
  const secondTag = value.tags[1] || 'reflect';

  return [
    {
      id: `${value.name}-deep-example`,
      title: `${value.name} in real life`,
      value: value.name,
      description: value.example,
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
