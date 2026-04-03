import type { ReflectionEntry } from '../valueTypes';

export const DAILY_QUICK_REFLECTION_TITLE = 'Values observed';

const OBSERVED_TODAY_PREFIX = 'Observed today:';

const padNumber = (value: number) => value.toString().padStart(2, '0');

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

export const getLocalDateKey = (input: string | Date = new Date()): string => {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
};

export const buildDailyQuickReflectionNote = (summaries: string[], quickNote: string): string => {
  const trimmedSummaries = summaries.map((summary) => summary.trim()).filter(Boolean);
  const trimmedQuickNote = quickNote.trim();

  if (!trimmedSummaries.length) {
    return trimmedQuickNote;
  }

  const noteLines = [OBSERVED_TODAY_PREFIX, ...trimmedSummaries.map((summary) => `- ${summary}`)];

  if (trimmedQuickNote) {
    noteLines.push('', `Note: ${trimmedQuickNote}`);
  }

  return noteLines.join('\n');
};

export const parseDailyQuickReflectionNote = (note: string): { summaries: string[]; quickNote: string } => {
  const trimmedNote = note.trim();

  if (!trimmedNote) {
    return { summaries: [], quickNote: '' };
  }

  if (!trimmedNote.startsWith(OBSERVED_TODAY_PREFIX)) {
    return { summaries: [], quickNote: trimmedNote };
  }

  const summaries: string[] = [];
  const quickNoteLines: string[] = [];
  const lines = trimmedNote.split(/\r?\n/).slice(1);
  let isCollectingQuickNote = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      if (isCollectingQuickNote) {
        quickNoteLines.push('');
      }
      continue;
    }

    if (trimmedLine.startsWith('- ') && !isCollectingQuickNote) {
      summaries.push(trimmedLine.slice(2).trim());
      continue;
    }

    if (trimmedLine.startsWith('Note:')) {
      quickNoteLines.push(trimmedLine.slice('Note:'.length).trim());
      isCollectingQuickNote = true;
      continue;
    }

    if (isCollectingQuickNote) {
      quickNoteLines.push(trimmedLine);
    }
  }

  return {
    summaries: dedupeSummaries(summaries),
    quickNote: quickNoteLines.join('\n').trim(),
  };
};

export const dedupeSummaries = (summaries: string[]): string[] => {
  const seen = new Set<string>();

  return summaries.filter((summary) => {
    const normalized = normalizeText(summary);
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
};

export const findDailyQuickReflectionEntries = (
  reflections: ReflectionEntry[],
  valueName: string,
  dateKey = getLocalDateKey()
): ReflectionEntry[] =>
  reflections
    .filter(
      (entry) =>
        entry.value === valueName &&
        entry.practiceTitle === DAILY_QUICK_REFLECTION_TITLE &&
        getLocalDateKey(entry.date) === dateKey
    )
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
