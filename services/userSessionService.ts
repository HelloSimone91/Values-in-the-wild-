const USER_ID_KEY = 'values_in_the_wild_user_id';
const LANDING_KEY = 'values_in_the_wild_has_seen_landing';
const ENTRY_MODE_KEY = 'values_in_the_wild_entry_mode';

export type EntryMode = 'guest' | 'account';

export const getOrCreateUserId = (): string => {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  const generated = `user_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  localStorage.setItem(USER_ID_KEY, generated);
  return generated;
};

export const hasSeenLanding = (): boolean => localStorage.getItem(LANDING_KEY) === 'true';

export const markLandingSeen = (): void => {
  localStorage.setItem(LANDING_KEY, 'true');
};

export const getEntryMode = (): EntryMode | null => {
  const raw = localStorage.getItem(ENTRY_MODE_KEY);
  return raw === 'guest' || raw === 'account' ? raw : null;
};

export const setEntryMode = (mode: EntryMode): void => {
  localStorage.setItem(ENTRY_MODE_KEY, mode);
};
