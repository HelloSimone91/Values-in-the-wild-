import { ReflectionEntry } from '../stitchData';

const REFLECTIONS_KEY = 'values_in_the_wild_reflections';
const configuredBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const API_BASE = configuredBase || (import.meta.env.DEV ? 'http://localhost:8787' : '');

const readLocalReflections = (): ReflectionEntry[] => {
  try {
    const raw = localStorage.getItem(REFLECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalReflections = (reflections: ReflectionEntry[]) => {
  localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections));
};

export const loadReflections = async (userId: string): Promise<ReflectionEntry[]> => {
  if (!API_BASE) {
    return readLocalReflections();
  }

  try {
    const response = await fetch(`${API_BASE}/api/v1/users/${userId}/reflections`);
    if (response.ok) {
      const payload = (await response.json()) as { reflections?: ReflectionEntry[] };
      const reflections = payload.reflections || [];
      writeLocalReflections(reflections);
      return reflections;
    }
  } catch {
    // Fall back to local cache.
  }

  return readLocalReflections();
};

export const saveReflections = async (userId: string, reflections: ReflectionEntry[]): Promise<void> => {
  writeLocalReflections(reflections);

  if (!API_BASE) return;

  try {
    const response = await fetch(`${API_BASE}/api/v1/users/${userId}/reflections`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reflections }),
    });

    if (!response.ok) {
      throw new Error('Failed to save field notes.');
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to save field notes.');
  }
};
