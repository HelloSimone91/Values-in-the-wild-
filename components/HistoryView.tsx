import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, Brain, CalendarDays, Flame, LayoutGrid, Pencil, Search, SlidersHorizontal, Sparkles, Trash2, X } from './icons';
import {
  calculateStreak,
  formatReflectionDate,
  ReflectionEntry,
  ValueDefinition,
  valueEmoji,
} from '../stitchData';
import { GamificationWidgets } from './GamificationWidgets';

type TimeFilter = 'all' | '7d' | '30d' | '90d';
type NotesSortOption = 'newest' | 'oldest' | 'value' | 'valueNoteCount';
type AnalyticsView = 'week' | 'month';
type NextMoveActionKind = 'openValue' | 'practice' | 'reviewRecent';

interface NextMoveAction {
  kind: NextMoveActionKind;
  label: string;
  valueName?: string;
}

interface NextMoveSuggestion {
  body: string;
  detail?: string;
  eyebrow: string;
  primaryAction: NextMoveAction;
  secondaryAction?: NextMoveAction;
  title: string;
}

interface WeekBar {
  count: number;
  dateLabel: string;
  fullLabel: string;
  isToday: boolean;
  key: string;
  label: string;
}

interface HeatmapCell {
  count: number;
  dayNumber: number;
  isFuture: boolean;
  isToday: boolean;
  label: string;
}

interface HeatmapMonth {
  activeDays: number;
  coverage: number;
  key: string;
  label: string;
  peakCount: number;
  peakLabel: string;
  totalNotes: number;
  weeks: Array<Array<HeatmapCell | null>>;
}

interface HistoryViewProps {
  authConfigured: boolean;
  favoriteValues: string[];
  isGuestMode: boolean;
  isAuthenticated: boolean;
  reflections: ReflectionEntry[];
  values: ValueDefinition[];
  onSelectValue: (name: string) => void;
  onOpenValue: (name: string) => void;
  onOpenPractice: (valueName?: string) => void;
  onUpdateReflection: (reflectionId: string, updates: Pick<ReflectionEntry, 'note' | 'practiceTitle'>) => void;
  onDeleteReflection: (reflectionId: string) => void;
  onRequestSignIn: () => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const toDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getCountByDay = (reflections: ReflectionEntry[]) =>
  reflections.reduce<Record<string, number>>((acc, entry) => {
    const key = toDayKey(new Date(entry.date));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const getSundayStart = (date: Date) => {
  const sunday = startOfLocalDay(date);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  return sunday;
};

const buildWeeklyRhythm = (reflections: ReflectionEntry[]): WeekBar[] => {
  const today = startOfLocalDay(new Date());
  const weekStart = getSundayStart(today);
  const counts = getCountByDay(reflections);

  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = toDayKey(date);

    return {
      count: counts[key] || 0,
      dateLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullLabel: date.toLocaleDateString(undefined, { weekday: 'long' }),
      isToday: key === toDayKey(today),
      key,
      label,
    };
  });
};

const getMonthSpan = (start: Date, end: Date) =>
  (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

const buildMonthlyHeatmap = (reflections: ReflectionEntry[]): HeatmapMonth[] => {
  if (!reflections.length) return [];

  const counts = getCountByDay(reflections);
  const today = startOfLocalDay(new Date());
  const firstReflectionMonth = startOfMonth(
    reflections.reduce((earliest, entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getTime() < earliest.getTime() ? entryDate : earliest;
    }, new Date(reflections[0].date))
  );
  const finalVisibleMonth = startOfMonth(
    reflections.reduce((latest, entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getTime() > latest.getTime() ? entryDate : latest;
    }, today)
  );
  const monthCount = getMonthSpan(firstReflectionMonth, finalVisibleMonth);
  const months: HeatmapMonth[] = [];

  for (let offset = 0; offset < monthCount; offset += 1) {
    const monthDate = new Date(firstReflectionMonth.getFullYear(), firstReflectionMonth.getMonth() + offset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const weeks = Array.from({ length: Math.ceil((firstDayIndex + daysInMonth) / 7) }, () =>
      Array<HeatmapCell | null>(7).fill(null)
    );

    let totalNotes = 0;
    let activeDays = 0;
    let peakCount = 0;
    let peakLabel = 'No notes yet';

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = toDayKey(date);
      const count = counts[key] || 0;
      const slot = firstDayIndex + day - 1;
      const weekIndex = Math.floor(slot / 7);
      const weekdayIndex = slot % 7;
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      weeks[weekIndex][weekdayIndex] = {
        count,
        dayNumber: day,
        isFuture: date.getTime() > today.getTime(),
        isToday: key === toDayKey(today),
        label,
      };

      totalNotes += count;
      if (count > 0) activeDays += 1;
      if (count > peakCount) {
        peakCount = count;
        peakLabel = label;
      }
    }

    months.push({
      activeDays,
      coverage: daysInMonth ? activeDays / daysInMonth : 0,
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      peakCount,
      peakLabel,
      totalNotes,
      weeks,
    });
  }

  return months;
};

const getHeatmapCellTone = (count: number, maxCount: number, isFuture: boolean, isToday: boolean) => {
  if (isFuture) return 'border border-dashed border-[#eadfd6] bg-[#fffaf6] text-[#ccbdb0]';
  if (count === 0) return isToday ? 'border border-[#bfd2af] bg-[#eef5e8] text-[#6f6258]' : 'border border-[#ece3dc] bg-white text-[#b8aa9f]';

  const ratio = count / maxCount;

  if (ratio >= 0.75) return isToday ? 'bg-[#234e00] text-white ring-2 ring-[#a7cc7e]' : 'bg-[#35680e] text-white';
  if (ratio >= 0.4) return isToday ? 'bg-[#4b7f22] text-white ring-2 ring-[#bddaa0]' : 'bg-[#5f8f34] text-white';
  return isToday ? 'bg-[#d5e6c6] text-[#234e00] ring-2 ring-[#9ebe78]' : 'bg-[#dfead5] text-[#35680e]';
};

const formatValueList = (names: string[]) => {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));

  if (uniqueNames.length <= 1) return uniqueNames[0] || '';
  if (uniqueNames.length === 2) return `${uniqueNames[0]} and ${uniqueNames[1]}`;

  return `${uniqueNames.slice(0, -1).join(', ')}, and ${uniqueNames[uniqueNames.length - 1]}`;
};

const HistoryView: React.FC<HistoryViewProps> = ({
  authConfigured,
  favoriteValues,
  isGuestMode,
  isAuthenticated,
  reflections,
  values,
  onSelectValue,
  onOpenValue,
  onOpenPractice,
  onUpdateReflection,
  onDeleteReflection,
  onRequestSignIn,
}) => {
  const PAGE_SIZE = 12;
  const [searchQuery, setSearchQuery] = useState('');
  const [valueFilter, setValueFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [notesSortBy, setNotesSortBy] = useState<NotesSortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [editingPracticeTitle, setEditingPracticeTitle] = useState('');
  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>('week');
  const [selectedHeatmapMonth, setSelectedHeatmapMonth] = useState<string | null>(null);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const recentFieldNotesRef = useRef<HTMLElement | null>(null);

  const valueOptions = useMemo(
    () => ['All', ...Array.from(new Set(reflections.map((entry) => entry.value))).sort()],
    [reflections]
  );

  const filteredReflections = useMemo(() => {
    const now = Date.now();
    const query = searchQuery.trim().toLowerCase();

    const rangeMs: Record<Exclude<TimeFilter, 'all'>, number> = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };

    const filtered = reflections.filter((entry) => {
      const matchesValue = valueFilter === 'All' || entry.value === valueFilter;
      if (!matchesValue) return false;

      const matchesTime =
        timeFilter === 'all' || now - new Date(entry.date).getTime() <= rangeMs[timeFilter];
      if (!matchesTime) return false;

      if (!query) return true;
      return [entry.value, entry.note, entry.practiceTitle].join(' ').toLowerCase().includes(query);
    });

    return filtered;
  }, [reflections, searchQuery, timeFilter, valueFilter]);

  const streak = useMemo(() => calculateStreak(filteredReflections), [filteredReflections]);
  const trendBars = useMemo(() => buildWeeklyRhythm(filteredReflections), [filteredReflections]);
  const heatmapMonths = useMemo(() => buildMonthlyHeatmap(filteredReflections), [filteredReflections]);
  const weeklyCount = useMemo(() => trendBars.reduce((sum, day) => sum + day.count, 0), [trendBars]);
  const practicedMap = useMemo(() => {
    return filteredReflections.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.value] = (acc[entry.value] || 0) + 1;
      return acc;
    }, {});
  }, [filteredReflections]);
  const newestFirstReflections = useMemo(
    () => [...filteredReflections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredReflections]
  );
  const mostRecentFilteredEntry = newestFirstReflections[0] || null;
  const recentReflections = newestFirstReflections.slice(0, 4);
  const reviewSortedReflections = useMemo(() => {
    const sorted = [...filteredReflections];

    if (notesSortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return sorted;
    }

    if (notesSortBy === 'value') {
      sorted.sort((a, b) => a.value.localeCompare(b.value) || new Date(b.date).getTime() - new Date(a.date).getTime());
      return sorted;
    }

    if (notesSortBy === 'valueNoteCount') {
      sorted.sort(
        (a, b) =>
          (practicedMap[b.value] || 0) - (practicedMap[a.value] || 0) ||
          a.value.localeCompare(b.value) ||
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return sorted;
    }

    sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted;
  }, [filteredReflections, notesSortBy, practicedMap]);
  const maxHeatmapCount = useMemo(
    () => Math.max(...heatmapMonths.flatMap((month) => month.weeks.flat().filter(Boolean).map((cell) => cell!.count)), 1),
    [heatmapMonths]
  );

  const topValue = useMemo(() => {
    const [name] = (Object.entries(practicedMap) as [string, number][]).sort((a, b) => b[1] - a[1])[0] || [];
    return values.find((value) => value.name === name) || null;
  }, [practicedMap, values]);

  const selectedMonthStats = useMemo(() => {
    if (!heatmapMonths.length) return null;
    return heatmapMonths.find((month) => month.key === selectedHeatmapMonth) || heatmapMonths[heatmapMonths.length - 1];
  }, [heatmapMonths, selectedHeatmapMonth]);
  const heatmapRangeLabel = useMemo(() => {
    if (!heatmapMonths.length) return 'No months yet';
    if (heatmapMonths.length === 1) return heatmapMonths[0].label;
    return `${heatmapMonths[0].label} - ${heatmapMonths[heatmapMonths.length - 1].label}`;
  }, [heatmapMonths]);

  const busiestMonth = useMemo(() => {
    return [...heatmapMonths].sort((a, b) => b.totalNotes - a.totalNotes || b.activeDays - a.activeDays)[0] || null;
  }, [heatmapMonths]);

  const busiestWeekDay = useMemo(() => {
    return [...trendBars].sort((a, b) => b.count - a.count)[0] || null;
  }, [trendBars]);

  const favoriteSummaries = useMemo(() => {
    return favoriteValues
      .map((name) => {
        const value = values.find((entry) => entry.name === name) || null;
        const allEntries = reflections.filter((entry) => entry.value === name);
        const totalNotes = allEntries.length;
        const visibleNotes = filteredReflections.filter((entry) => entry.value === name).length;
        const mostRecentEntry = [...allEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;

        return {
          lastLoggedAt: mostRecentEntry?.date || null,
          name,
          totalNotes,
          value,
          visibleNotes,
        };
      })
      .filter((entry) => entry.value);
  }, [favoriteValues, filteredReflections, reflections, values]);

  const nextMove = useMemo<NextMoveSuggestion | null>(() => {
    const activeValues = (Object.entries(practicedMap) as [string, number][])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
    const recentActiveValues = activeValues.slice(0, 2);
    const activeLeadIn = recentActiveValues.length
      ? `You've logged ${formatValueList(recentActiveValues)}${valueFilter === 'All' ? ' recently' : ' in this view'}.`
      : '';

    const untouchedFavorite = favoriteSummaries.find((favorite) => favorite.totalNotes === 0);
    if (untouchedFavorite) {
      return {
        eyebrow: 'Where to go next',
        title: `Try ${untouchedFavorite.name} in the wild`,
        body: activeLeadIn
          ? `${activeLeadIn} ${untouchedFavorite.name} is pinned in your guide but still has no field note.`
          : `${untouchedFavorite.name} is pinned in your guide, but you haven't logged a field note for it yet.`,
        detail: 'Turn that value into one concrete moment, then come back and compare it with the rest of your notes.',
        primaryAction: {
          kind: 'practice',
          label: 'Begin practice',
          valueName: untouchedFavorite.name,
        },
        secondaryAction: {
          kind: 'openValue',
          label: 'Open value',
          valueName: untouchedFavorite.name,
        },
      };
    }

    const staleFavorite =
      favoriteSummaries
        .filter((favorite) => favorite.totalNotes > 0 && favorite.visibleNotes === 0)
        .sort((a, b) => new Date(b.lastLoggedAt || 0).getTime() - new Date(a.lastLoggedAt || 0).getTime())[0] || null;

    if (staleFavorite) {
      return {
        eyebrow: 'Worth revisiting',
        title: `${staleFavorite.name} fell out of the current view`,
        body: activeLeadIn
          ? `${activeLeadIn} ${staleFavorite.name} still matters to you, but it isn't showing up with the filters you have on now.`
          : `${staleFavorite.name} is pinned and practiced before, but it isn't showing up with the current filters.`,
        detail: staleFavorite.lastLoggedAt
          ? `Last logged ${formatReflectionDate(staleFavorite.lastLoggedAt)}. Re-open it or practice it again to see whether it still belongs in the mix.`
          : 'Re-open it or practice it again to see whether it still belongs in the mix.',
        primaryAction: {
          kind: 'openValue',
          label: 'Open value',
          valueName: staleFavorite.name,
        },
        secondaryAction: {
          kind: 'practice',
          label: 'Practice this value',
          valueName: staleFavorite.name,
        },
      };
    }

    const strongestActiveValue = activeValues[0];
    if (!strongestActiveValue) return null;

    return {
      eyebrow: 'Keep this alive',
      title: `${strongestActiveValue} is carrying the signal`,
      body:
        recentActiveValues.length > 1
          ? `${formatValueList(recentActiveValues)} are the values most visible in your notes right now. Review the latest entries and decide what to deepen next.`
          : `${strongestActiveValue} is the clearest live pattern in your notes right now. Review the latest entries and decide what to deepen next.`,
      detail: `${practicedMap[strongestActiveValue]} note${practicedMap[strongestActiveValue] === 1 ? '' : 's'} visible with the current filters.`,
      primaryAction: {
        kind: 'reviewRecent',
        label: 'Review recent notes',
      },
      secondaryAction: {
        kind: 'openValue',
        label: 'Open value',
        valueName: strongestActiveValue,
      },
    };
  }, [favoriteSummaries, practicedMap, valueFilter]);

  const maxTrend = Math.max(...trendBars.map((day) => day.count), 1);
  const totalPages = Math.max(1, Math.ceil(filteredReflections.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedReflections = reviewSortedReflections.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [notesSortBy, searchQuery, timeFilter, valueFilter]);

  useEffect(() => {
    if (!heatmapMonths.length) {
      setSelectedHeatmapMonth(null);
      return;
    }

    setSelectedHeatmapMonth((current) =>
      current && heatmapMonths.some((month) => month.key === current) ? current : heatmapMonths[heatmapMonths.length - 1].key
    );
  }, [heatmapMonths]);

  const startEditing = (entry: ReflectionEntry) => {
    setEditingId(entry.id);
    setEditingNote(entry.note);
    setEditingPracticeTitle(entry.practiceTitle);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingNote('');
    setEditingPracticeTitle('');
  };

  const saveEditing = () => {
    if (!editingId || !editingNote.trim() || !editingPracticeTitle.trim()) return;
    onUpdateReflection(editingId, {
      note: editingNote.trim(),
      practiceTitle: editingPracticeTitle.trim(),
    });
    cancelEditing();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setValueFilter('All');
    setTimeFilter('all');
  };

  const handleNextMoveAction = (action: NextMoveAction) => {
    if (action.kind === 'reviewRecent') {
      recentFieldNotesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!action.valueName) return;

    onSelectValue(action.valueName);

    if (action.kind === 'practice') {
      onOpenPractice(action.valueName);
      return;
    }

    onOpenValue(action.valueName);
  };

  if (!reflections.length) {
    return (
      <section className="rounded-[2.6rem] bg-[#f9f2ed] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5e8] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">
            <Sparkles className="h-3.5 w-3.5" />
            No field notes yet
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e] sm:text-5xl">
            Your field notes start with one real moment.
          </h1>
          <p className="text-base leading-7 text-[#6f6258] sm:text-lg">
            Open practice, pick a value, and save one grounded note from the wild. This screen turns those notes into streaks, trends, and signal.
          </p>
          <button
            onClick={() => onOpenPractice()}
            className="inline-flex items-center gap-2 rounded-full bg-[#35680e] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)]"
          >
            Begin practice
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-9">
      <div className="mb-4"><GamificationWidgets reflections={reflections} /></div>
      <header className="space-y-3">
        <p className="max-w-2xl text-base leading-7 text-[#6f6258] sm:text-lg">
          Search, sort, and revise the moments you’ve already logged.
        </p>
      </header>

      {authConfigured && isGuestMode && !isAuthenticated && (
        <section className="rounded-[2rem] border border-[#dce7d2] bg-[#f6fbf2] p-5 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">Guest mode</p>
              <p className="mt-2 text-sm leading-6 text-[#4d5b43]">
                These field notes stay on this browser only. Sign in if you want them attached to your account and available across devices.
              </p>
            </div>
            <button
              onClick={onRequestSignIn}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#35680e] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)]"
            >
              Sign in for sync
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      <section className="rounded-[2.5rem] bg-white p-5 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-6">
        <button
          type="button"
          onClick={() => setIsControlsOpen((current) => !current)}
          aria-expanded={isControlsOpen}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#f1ebe5] p-2 text-[#35680e]">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Controls</p>
            </div>
          </div>
          <div className="rounded-full bg-[#f7f1eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">
            {isControlsOpen ? 'Hide' : 'Show'}
          </div>
        </button>

        {isControlsOpen && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Search</span>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9f948a]" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by value, note, or prompt"
                    className="w-full rounded-[1.2rem] border border-[#ece3dc] bg-[#fff8f3] py-3 pl-11 pr-4 text-sm text-[#1e1b18] outline-none transition focus:border-[#35680e]"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Value</span>
                <select
                  value={valueFilter}
                  onChange={(event) => setValueFilter(event.target.value)}
                  className="mt-2 w-full rounded-[1.2rem] border border-[#ece3dc] bg-[#fff8f3] px-4 py-3 text-sm text-[#1e1b18] outline-none transition focus:border-[#35680e]"
                >
                  {valueOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Window</span>
                <select
                  value={timeFilter}
                  onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
                  className="mt-2 w-full rounded-[1.2rem] border border-[#ece3dc] bg-[#fff8f3] px-4 py-3 text-sm text-[#1e1b18] outline-none transition focus:border-[#35680e]"
                >
                  <option value="all">All time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </label>

            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#6f6258]">{filteredReflections.length} notes</p>
              <button onClick={clearFilters} className="rounded-full bg-[#f1ebe5] px-4 py-2 text-sm font-semibold text-[#35680e]">
                Reset filters
              </button>
            </div>
          </>
        )}
      </section>

      {!filteredReflections.length ? (
        <section className="rounded-[2.4rem] bg-[#f9f2ed] p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
          <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#1e1b18]">No field notes match these filters.</h2>
          <p className="mt-3 text-sm leading-6 text-[#6f6258]">Widen the time range, remove the value filter, or reset search.</p>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="grid grid-cols-1 gap-6 md:col-span-4">
              <section className="relative overflow-hidden rounded-[2.4rem] bg-[#35680e] p-8 text-white shadow-[0_24px_48px_rgba(53,104,14,0.18)]">
                <div className="relative z-10">
                  <Flame className="h-10 w-10" />
                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">Wild streak</p>
                  <p className="mt-3 font-['Plus_Jakarta_Sans'] text-6xl font-extrabold tracking-[-0.06em]">
                    {streak} <span className="text-2xl font-medium">days</span>
                  </p>
                  <p className="mt-8 text-sm text-[#d4ebb8]">{weeklyCount} field notes in this Sunday-to-Saturday view</p>
                </div>
                <div className="pointer-events-none absolute -bottom-10 -right-8 opacity-10">
                  <Flame className="h-40 w-40" />
                </div>
              </section>

              <section className="rounded-[2.4rem] bg-[#f1ebe5] p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7f7269]">Visible field notes</p>
                <p className="mt-3 font-['Plus_Jakarta_Sans'] text-5xl font-extrabold tracking-[-0.05em] text-[#35680e]">{filteredReflections.length}</p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#006a45]">
                  <CalendarDays className="h-4 w-4" />
                  Last entry {mostRecentFilteredEntry ? formatReflectionDate(mostRecentFilteredEntry.date) : 'No notes yet'}
                </div>
              </section>
            </div>

            <section className="rounded-[2.4rem] bg-[#f9f2ed] p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Field rhythm</p>
                  <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18] sm:text-3xl">
                    {analyticsView === 'week' ? 'Weekly layout' : 'Month-to-month heatmap'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#6f6258]">
                    {analyticsView === 'week'
                      ? 'Sunday-first, with each column locked to the correct calendar date.'
                      : 'A month-by-month heatmap that starts with your first visible note and keeps skipped months in sequence.'}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="inline-flex rounded-full bg-white p-1 shadow-[0_10px_24px_rgba(41,33,27,0.06)]">
                    <button
                      onClick={() => setAnalyticsView('week')}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        analyticsView === 'week' ? 'bg-[#35680e] text-white' : 'text-[#6f6258]'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Week
                    </button>
                    <button
                      onClick={() => setAnalyticsView('month')}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        analyticsView === 'month' ? 'bg-[#35680e] text-white' : 'text-[#6f6258]'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Heatmap
                    </button>
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">
                    {analyticsView === 'week'
                      ? `${trendBars[0]?.dateLabel} - ${trendBars[6]?.dateLabel}`
                      : heatmapRangeLabel}
                  </div>
                </div>
              </div>

              {analyticsView === 'week' ? (
                <>
                  <div className="mt-8 grid grid-cols-7 gap-3">
                    {trendBars.map((day) => (
                      <div key={day.key} className="flex flex-col items-center gap-3">
                        <div className="flex h-40 w-full items-end">
                          <div
                            className={`w-full rounded-t-[1rem] ${day.isToday ? 'bg-[#234e00]' : 'bg-[#35680e]'}`}
                            style={{ height: `${Math.max(12, (day.count / maxTrend) * 100)}%`, opacity: day.count ? 1 : 0.18 }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{day.label}</p>
                          <p className="mt-1 text-sm font-bold text-[#1e1b18]">{day.count}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#aa9a8e]">
                            {day.dateLabel}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-white/80 px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Week total</p>
                      <p className="mt-2 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.05em] text-[#1e1b18]">{weeklyCount}</p>
                      <p className="mt-2 text-sm text-[#6f6258]">All notes logged between Sunday and Saturday.</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-white/80 px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Busiest day</p>
                      <p className="mt-2 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.05em] text-[#1e1b18]">
                        {busiestWeekDay?.fullLabel || 'No signal'}
                      </p>
                      <p className="mt-2 text-sm text-[#6f6258]">
                        {busiestWeekDay ? `${busiestWeekDay.count} note${busiestWeekDay.count === 1 ? '' : 's'} on ${busiestWeekDay.dateLabel}.` : 'Log a note to start the pattern.'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
                  <div className="grid gap-4 md:grid-cols-2">
                    {heatmapMonths.map((month) => {
                      const isSelected = selectedMonthStats?.key === month.key;

                      return (
                        <button
                          key={month.key}
                          onClick={() => setSelectedHeatmapMonth(month.key)}
                          className={`rounded-[1.8rem] border p-4 text-left transition ${
                            isSelected
                              ? 'border-[#bfd2af] bg-[#f3f8ee] shadow-[0_18px_30px_rgba(53,104,14,0.08)]'
                              : 'border-transparent bg-white/80 hover:border-[#e6ddd5]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-[-0.03em] text-[#1e1b18]">{month.label}</p>
                              <p className="mt-1 text-sm text-[#6f6258]">
                                {month.totalNotes} note{month.totalNotes === 1 ? '' : 's'} across {month.activeDays} active day{month.activeDays === 1 ? '' : 's'}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#35680e]">
                              {Math.round(month.coverage * 100)}% active
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-7 gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aa9a8e]">
                            {WEEKDAY_LABELS.map((label) => (
                              <span key={`${month.key}-${label}`} className="text-center">
                                {label[0]}
                              </span>
                            ))}
                          </div>

                          <div className="mt-2 grid gap-1">
                            {month.weeks.map((week, weekIndex) => (
                              <div key={`${month.key}-${weekIndex}`} className="grid grid-cols-7 gap-1">
                                {week.map((cell, cellIndex) =>
                                  cell ? (
                                    <div
                                      key={`${month.key}-${cell.dayNumber}`}
                                      title={`${cell.label}: ${cell.count} note${cell.count === 1 ? '' : 's'}`}
                                      className={`flex h-8 items-center justify-center rounded-[0.7rem] text-[11px] font-semibold transition ${getHeatmapCellTone(
                                        cell.count,
                                        maxHeatmapCount,
                                        cell.isFuture,
                                        cell.isToday
                                      )}`}
                                    >
                                      {cell.dayNumber}
                                    </div>
                                  ) : (
                                    <div key={`${month.key}-empty-${weekIndex}-${cellIndex}`} className="h-8 rounded-[0.7rem] bg-transparent" />
                                  )
                                )}
                              </div>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <aside className="rounded-[2rem] bg-[#234e00] p-6 text-white shadow-[0_24px_48px_rgba(35,78,0,0.18)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">Monthly stats</p>
                    <h3 className="mt-3 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.05em]">
                      {selectedMonthStats?.label || 'No month selected'}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#d4ebb8]">
                      Pick any month on the left. The heatmap starts with your first visible note and keeps the same Sunday-first cadence as the weekly view.
                    </p>

                    <div className="mt-6 space-y-3">
                      <div className="rounded-[1.4rem] bg-white/10 px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">Notes logged</p>
                        <p className="mt-2 font-['Plus_Jakarta_Sans'] text-4xl font-bold tracking-[-0.05em]">
                          {selectedMonthStats?.totalNotes || 0}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] bg-white/10 px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">Active days</p>
                        <p className="mt-2 text-2xl font-bold">
                          {selectedMonthStats?.activeDays || 0}
                          <span className="ml-2 text-sm font-medium text-[#d4ebb8]">days with at least one note</span>
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] bg-white/10 px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">Peak day</p>
                        <p className="mt-2 text-2xl font-bold">
                          {selectedMonthStats?.peakCount ? selectedMonthStats.peakLabel : 'No notes yet'}
                        </p>
                        <p className="mt-2 text-sm text-[#d4ebb8]">
                          {selectedMonthStats?.peakCount
                            ? `${selectedMonthStats.peakCount} note${selectedMonthStats.peakCount === 1 ? '' : 's'} on the strongest day.`
                            : 'This month has no visible notes with the current filters.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[1.4rem] border border-white/10 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">Strongest month in view</p>
                      <p className="mt-2 text-lg font-bold">{busiestMonth?.label || 'No signal yet'}</p>
                      <p className="mt-2 text-sm text-[#d4ebb8]">
                        {busiestMonth
                          ? `${busiestMonth.totalNotes} notes across ${busiestMonth.activeDays} active days.`
                          : 'Adjust filters or add more notes to reveal a monthly pattern.'}
                      </p>
                    </div>
                  </aside>
                </div>
              )}
            </section>

            <section className="rounded-[2.4rem] bg-[#f1ebe5] p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7f7269]">Most-lived value</p>
              <div className="mt-6 flex items-center gap-5">
                <div className="rounded-[1.5rem] bg-[#234e00] p-4 text-white">
                  <Brain className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#35680e]">
                    {topValue ? `${valueEmoji(topValue.name)} ${topValue.name}` : 'No signal yet'}
                  </h2>
                  <p className="mt-2 text-sm text-[#6f6258]">
                    {topValue ? `${practicedMap[topValue.name]} field notes logged` : 'Keep practicing to surface a pattern'}
                  </p>
                </div>
              </div>
              {topValue && (
                <button
                  onClick={() => {
                    onSelectValue(topValue.name);
                    onOpenValue(topValue.name);
                  }}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#35680e]"
                >
                  View value
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </section>

            <section className="rounded-[2.4rem] bg-white p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">Recent field notes</h2>
                <button onClick={() => onOpenPractice()} className="inline-flex items-center gap-2 rounded-full bg-[#35680e] px-4 py-2 text-sm font-bold text-white">
                  Add field note
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {recentReflections.map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] bg-[#faf5f1] px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => {
                          onSelectValue(item.value);
                          onOpenValue(item.value);
                        }}
                        className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#35680e]"
                      >
                        {item.value}
                      </button>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{formatReflectionDate(item.date)}</span>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{item.practiceTitle}</p>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6f6258]">{item.note}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[2.4rem] bg-[#fffdf9] p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-12">
              {nextMove && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
                  <div className="rounded-[2rem] bg-[#f6f0ea] p-6 sm:p-7">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">{nextMove.eyebrow}</p>
                    <h2 className="mt-4 max-w-2xl font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#1e1b18] sm:text-[2rem]">
                      {nextMove.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f6258]">{nextMove.body}</p>
                    {nextMove.detail && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8a7668]">{nextMove.detail}</p>}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button
                        onClick={() => handleNextMoveAction(nextMove.primaryAction)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#35680e] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)]"
                      >
                        {nextMove.primaryAction.label}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      {nextMove.secondaryAction && (
                        <button
                          onClick={() => handleNextMoveAction(nextMove.secondaryAction!)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8cdc4] bg-white px-5 py-3 text-sm font-semibold text-[#35680e]"
                        >
                          {nextMove.secondaryAction.label}
                        </button>
                      )}
                    </div>
                  </div>

                  <aside className="rounded-[2rem] bg-[#234e00] p-6 text-white shadow-[0_24px_48px_rgba(35,78,0,0.16)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">Current notes view</p>
                    <p className="mt-4 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em]">
                      {filteredReflections.length}
                    </p>
                    <p className="mt-2 text-sm text-[#d4ebb8]">visible field note{filteredReflections.length === 1 ? '' : 's'}</p>

                    <div className="mt-6 space-y-3">
                      <div className="rounded-[1.4rem] bg-white/10 px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">Lead value</p>
                        <p className="mt-2 text-2xl font-bold">{topValue ? topValue.name : 'No signal yet'}</p>
                        <p className="mt-2 text-sm text-[#d4ebb8]">
                          {topValue ? `${practicedMap[topValue.name]} note${practicedMap[topValue.name] === 1 ? '' : 's'} in the current view.` : 'Add more notes to reveal a stronger pattern.'}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] bg-white/10 px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">Pinned values</p>
                        <p className="mt-2 text-2xl font-bold">{favoriteSummaries.length}</p>
                        <p className="mt-2 text-sm text-[#d4ebb8]">
                          {favoriteSummaries.length
                            ? `${favoriteSummaries.filter((favorite) => favorite.totalNotes === 0).length} still untouched across all notes.`
                            : 'No pinned values yet, so this recommendation is driven by your notes alone.'}
                        </p>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </section>
          </div>

          <section ref={recentFieldNotesRef} className="rounded-[2.5rem] bg-white p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">All matching notes</p>
                <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18]">Revise or remove notes</h2>
              </div>
              <label className="block lg:min-w-[15rem]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Sort notes</span>
                <select
                  value={notesSortBy}
                  onChange={(event) => setNotesSortBy(event.target.value as NotesSortOption)}
                  className="mt-2 w-full rounded-[1.2rem] border border-[#ece3dc] bg-[#fff8f3] px-4 py-3 text-sm text-[#1e1b18] outline-none transition focus:border-[#35680e]"
                >
                  <option value="newest">Date: newest first</option>
                  <option value="oldest">Date: oldest first</option>
                  <option value="value">Value: A-Z</option>
                  <option value="valueNoteCount">Value: most notes logged</option>
                </select>
              </label>
            </div>

            <div className="mt-6 space-y-4">
              {paginatedReflections.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <article key={item.id} className="rounded-[1.8rem] bg-[#faf5f1] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => {
                              onSelectValue(item.value);
                              onOpenValue(item.value);
                            }}
                            className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#35680e]"
                          >
                            {item.value}
                          </button>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{formatReflectionDate(item.date)}</span>
                        </div>
                        {!isEditing ? (
                          <>
                            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{item.practiceTitle}</p>
                            <p className="mt-3 text-sm leading-7 text-[#6f6258]">{item.note}</p>
                          </>
                        ) : (
                          <div className="mt-4 space-y-3">
                            <input
                              value={editingPracticeTitle}
                              onChange={(event) => setEditingPracticeTitle(event.target.value)}
                              className="w-full rounded-[1rem] border border-[#ece3dc] bg-white px-4 py-3 text-sm text-[#1e1b18] outline-none transition focus:border-[#35680e]"
                            />
                            <textarea
                              value={editingNote}
                              onChange={(event) => setEditingNote(event.target.value)}
                              className="min-h-[140px] w-full rounded-[1rem] border border-[#ece3dc] bg-white px-4 py-3 text-sm leading-7 text-[#1e1b18] outline-none transition focus:border-[#35680e]"
                            />
                          </div>
                        )}
                      </div>

                      {!isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(item)}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#35680e]"
                          >
                            <Pencil className="h-4 w-4" />
                            Revise
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this field note?')) {
                                onDeleteReflection(item.id);
                              }
                            }}
                            className="inline-flex items-center gap-2 rounded-full bg-[#fff1ef] px-4 py-2 text-sm font-semibold text-[#93000a]"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditing}
                            className="inline-flex items-center gap-2 rounded-full bg-[#35680e] px-4 py-2 text-sm font-bold text-white"
                          >
                            Save changes
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#6f6258]"
                          >
                            <X className="h-4 w-4" />
                            Discard
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col gap-3 border-t border-[#eee4dc] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#6f6258]">
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safePage === 1}
                    className="inline-flex items-center gap-2 rounded-full bg-[#f1ebe5] px-4 py-2 text-sm font-semibold text-[#35680e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safePage === totalPages}
                    className="inline-flex items-center gap-2 rounded-full bg-[#35680e] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#c9d7bc]"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default HistoryView;
