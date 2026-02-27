export enum Mode {
  LANDING = 'LANDING',
  AUDIT = 'AUDIT',
  WILD = 'WILD',
  SYNTHESIS = 'SYNTHESIS',
  ACTION_PLAN = 'ACTION_PLAN'
}

export enum Pillar {
  HABITS = 'Habits',
  TIME = 'Time Spent',
  RELATIONSHIPS = 'Relationships',
  CONTENT = 'Content Consumption',
  ENVIRONMENT = 'Physical Environment',
  WORK = 'Work/Contribution',
  FINANCE = 'Financial Spread'
}

export interface ResonanceOption {
  value: string;
  reason: string;
}

export interface ValueEntry {
  id: string;
  value: string;
  pillar: Pillar | 'Wild';
  sourceAction: string; // The raw input from user
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  type?: 'text' | 'resonance-menu';
  options?: ResonanceOption[]; // Only if type is resonance-menu
}

export type CheckInStatus = 'done' | 'partial' | 'skipped';

export interface DayCheckIn {
  status: CheckInStatus;
  note?: string;
  reasonChip?: string;
  timestamp: number;
}

export interface PlanAction {
  id: string;
  title: string;
  valueTag: string;
  durationMinutes: 5 | 15 | 30;
  rationale: string;
}

export interface PlanDay {
  day: number;
  theme: string;
  actions: PlanAction[];
  checkIn?: DayCheckIn;
}

export interface ActionPlanCycle {
  id: string;
  userId: string;
  selectedValues: string[];
  sourceEntryIds: string[];
  days: PlanDay[];
  status: 'active' | 'completed';
  createdAt: number;
  completedAt?: number;
}
