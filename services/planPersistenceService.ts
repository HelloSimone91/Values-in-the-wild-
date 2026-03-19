import { ActionPlanCycle } from '../types';

const USER_ID_KEY = 'embodied_user_id';
const PLAN_KEY = 'embodied_action_plan';
const configuredBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const API_BASE = configuredBase || (import.meta.env.DEV ? 'http://localhost:8787' : '');

export const getOrCreateUserId = (): string => {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  const generated = `user_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  localStorage.setItem(USER_ID_KEY, generated);
  return generated;
};

const readLocalPlan = (): ActionPlanCycle | null => {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeLocalPlan = (plan: ActionPlanCycle | null) => {
  if (!plan) {
    localStorage.removeItem(PLAN_KEY);
    return;
  }
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
};

export const loadActionPlan = async (userId: string): Promise<ActionPlanCycle | null> => {
  if (!API_BASE) {
    return readLocalPlan();
  }

  try {
    const response = await fetch(`${API_BASE}/api/v1/users/${userId}/action-plan`);
    if (response.ok) {
      const plan = (await response.json()) as ActionPlanCycle | null;
      if (plan) writeLocalPlan(plan);
      return plan;
    }
  } catch {
    // Fallback to local cache.
  }

  return readLocalPlan();
};

export const saveActionPlan = async (userId: string, plan: ActionPlanCycle | null): Promise<void> => {
  writeLocalPlan(plan);

  if (!API_BASE) return;

  try {
    await fetch(`${API_BASE}/api/v1/users/${userId}/action-plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
  } catch {
    // Local cache already updated; retry can happen on next write.
  }
};
