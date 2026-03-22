import React, { useMemo } from 'react';
import { ArrowRight, Brain, CalendarDays, Flame, Sparkles } from 'lucide-react';
import {
  buildTrendBars,
  calculateStreak,
  formatReflectionDate,
  ReflectionEntry,
  ValueDefinition,
  valueEmoji,
} from '../stitchData';

interface HistoryViewProps {
  reflections: ReflectionEntry[];
  values: ValueDefinition[];
  onSelectValue: (name: string) => void;
  onOpenValue: (name: string) => void;
  onOpenPractice: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ reflections, values, onSelectValue, onOpenValue, onOpenPractice }) => {
  const streak = useMemo(() => calculateStreak(reflections), [reflections]);
  const trendBars = useMemo(() => buildTrendBars(reflections), [reflections]);
  const weeklyCount = useMemo(() => trendBars.reduce((sum, day) => sum + day.count, 0), [trendBars]);
  const practicedMap = useMemo(() => {
    return reflections.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.value] = (acc[entry.value] || 0) + 1;
      return acc;
    }, {});
  }, [reflections]);

  const topValue = useMemo(() => {
    const [name] = Object.entries(practicedMap).sort((a, b) => b[1] - a[1])[0] || [];
    return values.find((value) => value.name === name) || null;
  }, [practicedMap, values]);

  const maxTrend = Math.max(...trendBars.map((day) => day.count), 1);

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
            Start with practice
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
          This is the Values in the Wild evidence layer. Every saved field note becomes part of the record of how your values actually show up.
        </p>
      </header>

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
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7f7269]">Total field notes</p>
            <p className="mt-3 font-['Plus_Jakarta_Sans'] text-5xl font-extrabold tracking-[-0.05em] text-[#35680e]">{reflections.length}</p>
            <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#006a45]">
              <CalendarDays className="h-4 w-4" />
              Last entry {formatReflectionDate(reflections[0].date)}
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
              Open this value
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </section>

        <section className="rounded-[2.4rem] bg-white p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">Recent field notes</h2>
            <button onClick={onOpenPractice} className="inline-flex items-center gap-1 text-sm font-semibold text-[#35680e]">
              Log another
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {reflections.slice(0, 6).map((item) => (
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
    </div>
  );
};

export default HistoryView;
