import React, { useMemo, useState } from 'react';
import { ArrowRight, Brain, CalendarDays, Flame, Pencil, Search, SlidersHorizontal, Sparkles, Trash2, X } from 'lucide-react';
import {
  buildTrendBars,
  calculateStreak,
  formatReflectionDate,
  ReflectionEntry,
  ValueDefinition,
  valueEmoji,
} from '../stitchData';

type TimeFilter = 'all' | '7d' | '30d' | '90d';
type SortOption = 'newest' | 'oldest' | 'value';

interface HistoryViewProps {
  reflections: ReflectionEntry[];
  values: ValueDefinition[];
  onSelectValue: (name: string) => void;
  onOpenValue: (name: string) => void;
  onOpenPractice: () => void;
  onUpdateReflection: (reflectionId: string, updates: Pick<ReflectionEntry, 'note' | 'practiceTitle'>) => void;
  onDeleteReflection: (reflectionId: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({
  reflections,
  values,
  onSelectValue,
  onOpenValue,
  onOpenPractice,
  onUpdateReflection,
  onDeleteReflection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [valueFilter, setValueFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [editingPracticeTitle, setEditingPracticeTitle] = useState('');

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

    const sorted = [...filtered];
    if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === 'value') {
      sorted.sort((a, b) => a.value.localeCompare(b.value) || new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return sorted;
  }, [reflections, searchQuery, sortBy, timeFilter, valueFilter]);

  const streak = useMemo(() => calculateStreak(filteredReflections), [filteredReflections]);
  const trendBars = useMemo(() => buildTrendBars(filteredReflections), [filteredReflections]);
  const weeklyCount = useMemo(() => trendBars.reduce((sum, day) => sum + day.count, 0), [trendBars]);
  const practicedMap = useMemo(() => {
    return filteredReflections.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.value] = (acc[entry.value] || 0) + 1;
      return acc;
    }, {});
  }, [filteredReflections]);

  const topValue = useMemo(() => {
    const [name] = Object.entries(practicedMap).sort((a, b) => b[1] - a[1])[0] || [];
    return values.find((value) => value.name === name) || null;
  }, [practicedMap, values]);

  const maxTrend = Math.max(...trendBars.map((day) => day.count), 1);

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
    setSortBy('newest');
  };

  if (!reflections.length) {
    return (
      <section className="rounded-[2.6rem] bg-[#f9f2ed] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">
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
            onClick={onOpenPractice}
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
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e] sm:text-5xl">Field Notes</h1>
        <p className="max-w-2xl text-base leading-7 text-[#6f6258] sm:text-lg">
          This is the Values in the Wild evidence layer. Search, sort, and revise your field notes as patterns become clearer.
        </p>
      </header>

      <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#f1ebe5] p-2 text-[#35680e]">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">History controls</p>
            <p className="mt-1 text-sm text-[#6f6258]">Filter by value and time window, search your notes, or sort the full record.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="mt-2 w-full rounded-[1.2rem] border border-[#ece3dc] bg-[#fff8f3] px-4 py-3 text-sm text-[#1e1b18] outline-none transition focus:border-[#35680e]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="value">Value A-Z</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6f6258]">{filteredReflections.length} matching field notes</p>
          <button onClick={clearFilters} className="rounded-full bg-[#f1ebe5] px-4 py-2 text-sm font-semibold text-[#35680e]">
            Reset filters
          </button>
        </div>
      </section>

      {!filteredReflections.length ? (
        <section className="rounded-[2.4rem] bg-[#f9f2ed] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
          <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#1e1b18]">No field notes match these filters.</h2>
          <p className="mt-3 text-sm leading-7 text-[#6f6258]">Try widening the time range, removing the value filter, or clearing the search query.</p>
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
                  <p className="mt-8 text-sm text-[#d4ebb8]">{weeklyCount} field notes in the last 7 days</p>
                </div>
                <div className="pointer-events-none absolute -bottom-10 -right-8 opacity-10">
                  <Flame className="h-40 w-40" />
                </div>
              </section>

              <section className="rounded-[2.4rem] bg-[#f1ebe5] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7f7269]">Visible field notes</p>
                <p className="mt-3 font-['Plus_Jakarta_Sans'] text-5xl font-extrabold tracking-[-0.05em] text-[#35680e]">{filteredReflections.length}</p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#006a45]">
                  <CalendarDays className="h-4 w-4" />
                  Last entry {formatReflectionDate(filteredReflections[0].date)}
                </div>
              </section>
            </div>

            <section className="rounded-[2.4rem] bg-[#f9f2ed] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18] sm:text-3xl">7-day field rhythm</h2>
                  <p className="mt-2 text-sm text-[#6f6258]">Field notes saved over the last week</p>
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Recent cadence</div>
              </div>

              <div className="mt-8 grid grid-cols-7 gap-3">
                {trendBars.map((day) => (
                  <div key={day.label} className="flex flex-col items-center gap-3">
                    <div className="flex h-40 w-full items-end">
                      <div
                        className="w-full rounded-t-[1rem] bg-[#35680e]"
                        style={{ height: `${Math.max(12, (day.count / maxTrend) * 100)}%`, opacity: day.count ? 1 : 0.18 }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{day.label}</p>
                      <p className="mt-1 text-sm font-bold text-[#1e1b18]">{day.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2.4rem] bg-[#f1ebe5] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-6">
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

            <section className="rounded-[2.4rem] bg-white p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">Recent field notes</h2>
                <button onClick={onOpenPractice} className="inline-flex items-center gap-1 text-sm font-semibold text-[#35680e]">
                  Add field note
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {filteredReflections.slice(0, 4).map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] bg-[#faf5f1] px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => {
                          onSelectValue(item.value);
                          onOpenValue(item.value);
                        }}
                        className="font-['Inter'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#35680e]"
                      >
                        {item.value}
                      </button>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{formatReflectionDate(item.date)}</span>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{item.practiceTitle}</p>
                    <p className="mt-3 text-sm leading-7 text-[#6f6258]">{item.note}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-[2.5rem] bg-white p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">All matching notes</p>
                <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18]">
                  Revise or remove field notes
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredReflections.map((item) => {
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
                            className="font-['Inter'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#35680e]"
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
          </section>
        </>
      )}
    </div>
  );
};

export default HistoryView;
