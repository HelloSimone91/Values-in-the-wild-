export type AppView = 'library' | 'practice' | 'history';

export interface ValueCard {
  name: string;
  emoji: string;
  subtitle: string;
  description: string;
  reflections: number;
}

export interface PracticeItem {
  title: string;
  value: string;
  description: string;
  duration: string;
  accent: 'green' | 'orange' | 'purple';
}

export interface RecentReflection {
  value: string;
  note: string;
  date: string;
}

export const libraryValues: ValueCard[] = [
  {
    name: 'Acceptance',
    emoji: '🤲',
    subtitle: 'Radical Presence',
    description: 'Meeting your current reality without flinching, so you can act from truth instead of resistance.',
    reflections: 8,
  },
  {
    name: 'Authenticity',
    emoji: '💎',
    subtitle: 'True Self',
    description: 'Choosing honest expression over polished performance, especially when the stakes feel personal.',
    reflections: 15,
  },
  {
    name: 'Bravery',
    emoji: '🛡️',
    subtitle: 'Fierce Action',
    description:
      'The willingness to confront uncertainty, pain, or exposure when something more important than comfort is at stake.',
    reflections: 12,
  },
  {
    name: 'Compassion',
    emoji: '🌿',
    subtitle: 'Shared Humanity',
    description: 'Making room for your own softness and other people’s complexity without collapsing your boundaries.',
    reflections: 9,
  },
  {
    name: 'Connection',
    emoji: '🔗',
    subtitle: 'Interdependence',
    description: 'Treating belonging as a practice, not a byproduct, by moving toward people with care and curiosity.',
    reflections: 11,
  },
  {
    name: 'Curiosity',
    emoji: '🔍',
    subtitle: "Beginner's Mind",
    description: 'Approaching the familiar with questions instead of conclusions, so life keeps opening.',
    reflections: 18,
  },
  {
    name: 'Creativity',
    emoji: '🎨',
    subtitle: 'Soul Expression',
    description: 'Turning inner material into outer form through making, experimenting, sketching, and shaping.',
    reflections: 7,
  },
  {
    name: 'Discipline',
    emoji: '⏰',
    subtitle: 'Steady Flow',
    description: 'Building trust with yourself through repeated follow-through, especially on ordinary days.',
    reflections: 13,
  },
  {
    name: 'Clarity',
    emoji: '🔭',
    subtitle: 'Single Focus',
    description: 'Reducing noise until the next right move becomes visible and easy to name.',
    reflections: 10,
  },
  {
    name: 'Collaboration',
    emoji: '🤝',
    subtitle: 'United Aim',
    description: 'Creating better work with others by sharing authorship, inviting input, and holding a common standard.',
    reflections: 6,
  },
];

export const microPractices: PracticeItem[] = [
  {
    title: 'Pre-Meeting Breath',
    value: 'Patience',
    description: 'Take one deliberate breath before a hard conversation so your tone arrives before your reaction.',
    duration: '1 min',
    accent: 'green',
  },
  {
    title: "The Difficult 'No'",
    value: 'Courage',
    description: 'Decline one request that does not align with your priorities, with warmth and precision.',
    duration: '1 min',
    accent: 'orange',
  },
  {
    title: 'Signal Appreciation',
    value: 'Gratitude',
    description: 'Send a short note naming one thing someone did well today without adding extra context.',
    duration: '1 min',
    accent: 'purple',
  },
  {
    title: 'Desk Reset',
    value: 'Clarity',
    description: 'Clear one square foot of physical space so the next task begins in a cleaner field.',
    duration: '1 min',
    accent: 'green',
  },
];

export const deepDivePractices: PracticeItem[] = [
  {
    title: 'Values Journaling',
    value: 'Gratitude',
    description: 'Map three wins from the week back to the value that made each one possible.',
    duration: '15 min',
    accent: 'orange',
  },
  {
    title: 'Silent Listening',
    value: 'Empathy',
    description: 'Spend 20 minutes with someone you care about and resist the urge to interrupt, fix, or redirect.',
    duration: '20 min',
    accent: 'green',
  },
  {
    title: 'The Idea Forge',
    value: 'Creativity',
    description: 'Make something for 30 minutes with no goal beyond output and honest experimentation.',
    duration: '30 min',
    accent: 'purple',
  },
];

export const recentReflections: RecentReflection[] = [
  {
    value: 'Bravery',
    note: 'Asked the uncomfortable question in the team review instead of waiting for a cleaner moment.',
    date: 'Today',
  },
  {
    value: 'Discipline',
    note: 'Finished the writing block before checking messages. The work felt lighter after the first ten minutes.',
    date: 'Yesterday',
  },
  {
    value: 'Connection',
    note: 'Called my sister back without multitasking and stayed present through the whole conversation.',
    date: 'Mar 19',
  },
  {
    value: 'Curiosity',
    note: 'Followed a strange question for half an hour and found a new direction for the project.',
    date: 'Mar 18',
  },
];

export const trendBars = [12, 18, 15, 24, 21, 14, 28];
