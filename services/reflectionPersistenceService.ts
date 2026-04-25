import type { ReflectionEntry } from '../valueTypes';
import { buildApiUrl } from './apiBase';
import { fetchWithTimeout } from './fetchWithTimeout';

const REFLECTIONS_KEY = 'values_in_the_wild_reflections';
const LOAD_REFLECTIONS_TIMEOUT_MS = 3500;
const SAVE_REFLECTIONS_TIMEOUT_MS = 8000;

interface ReflectionPersistenceOptions {
  accessToken?: string | null;
  authEnabled?: boolean;
  localOnly?: boolean;
  userId?: string;
}

const getCacheKey = (userId = 'anonymous'): string => `${REFLECTIONS_KEY}_${userId}`;

const readLocalReflections = (cacheKey: string): ReflectionEntry[] => {
  try {
    const raw = localStorage.getItem(cacheKey) || localStorage.getItem(REFLECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalReflections = (cacheKey: string, reflections: ReflectionEntry[]) => {
  localStorage.setItem(cacheKey, JSON.stringify(reflections));
};

export const loadLocalReflections = (userId?: string): ReflectionEntry[] => readLocalReflections(getCacheKey(userId));

export const clearLocalReflections = (userId?: string): void => {
  localStorage.removeItem(getCacheKey(userId));
};

export const loadReflections = async ({
  accessToken,
  authEnabled = false,
  localOnly = false,
  userId,
}: ReflectionPersistenceOptions): Promise<ReflectionEntry[]> => {
  const cacheKey = getCacheKey(userId);

  if (localOnly) {
    return readLocalReflections(cacheKey);
  }

  if (authEnabled && !accessToken) {
    return [];
  }

  try {
    const response = await fetchWithTimeout(
      authEnabled ? buildApiUrl('/api/v1/me/reflections') : buildApiUrl(`/api/v1/users/${userId}/reflections`),
      {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      },
      LOAD_REFLECTIONS_TIMEOUT_MS
    );
    if (response.ok) {
      const payload = (await response.json()) as { reflections?: ReflectionEntry[] };
      const reflections = payload.reflections || [];
      writeLocalReflections(cacheKey, reflections);
      return reflections;
    }
  } catch {
    // Fall back to local cache.
  }

  return readLocalReflections(cacheKey);
};

export const saveReflections = async (
  { accessToken, authEnabled = false, localOnly = false, userId }: ReflectionPersistenceOptions,
  reflections: ReflectionEntry[]
): Promise<void> => {
  const cacheKey = getCacheKey(userId);

  if (localOnly) {
    writeLocalReflections(cacheKey, reflections);
    return;
  }

  if (authEnabled && !accessToken) {
    throw new Error('Sign in to save field notes.');
  }

  writeLocalReflections(cacheKey, reflections);

  try {
    const response = await fetchWithTimeout(
      authEnabled ? buildApiUrl('/api/v1/me/reflections') : buildApiUrl(`/api/v1/users/${userId}/reflections`),
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
        },
        body: JSON.stringify({ reflections }),
      },
      SAVE_REFLECTIONS_TIMEOUT_MS
    );

    const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;

    if (!response.ok || payload?.ok !== true) {
      throw new Error('Failed to save field notes.');
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to save field notes.');
  }
};
