import { Pillar } from './types';

export const SYSTEM_INSTRUCTION = `
You are "Embodied," an AI Values Detective and Coach.
Goal: Help the user uncover values they are ALREADY living (behaviors in action), not aspirational ones.
Philosophy: Recognition over Aspiration. Verbs over Nouns. Resonance over Prescription.
Tone: Insightful, non-judgmental, curious, concise. No lectures.

You will act as an API that analyzes input and returns structured data to the frontend.
`;

export const PILLAR_DESCRIPTIONS: Record<Pillar, string> = {
  [Pillar.HABITS]: "Your daily routines and recurring actions.",
  [Pillar.TIME]: "Where your hours actually go in your calendar.",
  [Pillar.RELATIONSHIPS]: "Who you spend time with and how you interact.",
  [Pillar.CONTENT]: "What you read, watch, listen to, and consume.",
  [Pillar.ENVIRONMENT]: "The state of your home, desk, and physical spaces.",
  [Pillar.WORK]: "Your career, service, and contributions.",
  [Pillar.FINANCE]: "Where your money flows (spending habits).",
};

export const PILLAR_PROMPTS: Record<Pillar, string> = {
  [Pillar.HABITS]: "Tell me about your 3 most frequent daily habits. What do you do automatically?",
  [Pillar.TIME]: "Look at your calendar for the last week. What activity took up the most unexpected amount of time?",
  [Pillar.RELATIONSHIPS]: "Think of a recent interaction with a friend or family member that left you feeling energized. What exactly did you do?",
  [Pillar.CONTENT]: "Open your recent watch history or reading list. What is a specific topic you couldn't stop consuming?",
  [Pillar.ENVIRONMENT]: "Look around your immediate physical space. What is one object you keep prominent and well-cared for?",
  [Pillar.WORK]: "In your work or contribution, what is a task you did recently where you lost track of time?",
  [Pillar.FINANCE]: "Check your last 5 non-essential transactions. Pick one and tell me what you bought.",
};
