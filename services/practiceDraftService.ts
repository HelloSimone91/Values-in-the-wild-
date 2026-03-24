import { getLocalDateKey } from './dailyQuickReflectionService';

export interface PracticeDraft {
  practiceMode: 'micro' | 'deep';
  activePracticeId: string;
  checkedQuickItems: string[];
  quickNote: string;
  deepReflection: string;
}

const PRACTICE_DRAFT_KEY = 'values-in-the-wild:practice-draft';

const buildDraftKey = (userId: string, valueName: string, dateKey: string) =>
  `${PRACTICE_DRAFT_KEY}:${userId}:${dateKey}:${encodeURIComponent(valueName)}`;

export const loadPracticeDraft = (userId: string, valueName: string, dateKey = getLocalDateKey()): PracticeDraft | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(buildDraftKey(userId, valueName, dateKey));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PracticeDraft>;
    return {
      practiceMode: parsed.practiceMode === 'deep' ? 'deep' : 'micro',
      activePracticeId: typeof parsed.activePracticeId === 'string' ? parsed.activePracticeId : '',
      checkedQuickItems: Array.isArray(parsed.checkedQuickItems)
        ? parsed.checkedQuickItems.filter((entry): entry is string => typeof entry === 'string')
        : [],
      quickNote: typeof parsed.quickNote === 'string' ? parsed.quickNote : '',
      deepReflection: typeof parsed.deepReflection === 'string' ? parsed.deepReflection : '',
    };
  } catch {
    return null;
  }
};

export const savePracticeDraft = (
  userId: string,
  valueName: string,
  draft: PracticeDraft,
  dateKey = getLocalDateKey()
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(buildDraftKey(userId, valueName, dateKey), JSON.stringify(draft));
};
