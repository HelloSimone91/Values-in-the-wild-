import React from 'react';
import { ArrowUpRight, Brain, CalendarDays, Flame, Sparkles } from 'lucide-react';
import { recentReflections, trendBars } from '../stitchData';

const HistoryView: React.FC = () => {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e] sm:text-5xl">Your Journey</h1>
        <p className="max-w-2xl text-base leading-7 text-[#6f6258] sm:text-lg">
          Reflecting on your core values builds consistency and purpose. Here is a more editorial view of your progress over time.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="grid grid-cols-1 gap-6 md:col-span-4">
          <section className="relative overflow-hidden rounded-[2.4rem] bg-[#35680e] p-8 text-white shadow-[0_24px_48px_rgba(53,104,14,0.18)]">
            <div className="relative z-10">
              <Flame className="h-10 w-10" />
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">Current streak</p>
              <p className="mt-3 font-['Plus_Jakarta_Sans'] text-6xl font-extrabold tracking-[-0.06em]">
                12 <span className="text-2xl font-medium">days</span>
              </p>
              <p className="mt-8 text-sm text-[#d4ebb8]">Personal best: 24 days</p>
            </div>
            <div className="pointer-events-none absolute -bottom-10 -right-8 opacity-10">
              <Flame className="h-40 w-40" />
            </div>
          </section>

          <section className="rounded-[2.4rem] bg-[#f1ebe5] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7f7269]">Total reflections</p>
            <p className="mt-3 font-['Plus_Jakarta_Sans'] text-5xl font-extrabold tracking-[-0.05em] text-[#35680e]">158</p>
            <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#006a45]">
              <ArrowUpRight className="h-4 w-4" />
              +14 this week
            </div>
          </section>
        </div>

        <section className="rounded-[2.4rem] bg-[#f9f2ed] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18] sm:text-3xl">Practice Consistency</h2>
              <p className="mt-2 text-sm text-[#6f6258]">Frequency of reflections over the past 6 months</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-sm bg-[#e8e1dc]" />
                <div className="h-3 w-3 rounded-sm bg-[#b7f48b]" />
                <div className="h-3 w-3 rounded-sm bg-[#6ea24b]" />
                <div className="h-3 w-3 rounded-sm bg-[#234e00]" />
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <div className="grid min-w-[24rem] grid-cols-7 items-end gap-3">
              {trendBars.map((value, index) => (
                <div key={`${value}-${index}`} className="flex flex-col items-center gap-3">
                  <div
                    className={`w-full rounded-t-[1.25rem] ${index === trendBars.length - 1 ? 'bg-[#234e00]' : index % 3 === 0 ? 'bg-[#35680e]' : index % 2 === 0 ? 'bg-[#b7f48b]' : 'bg-[#e8e1dc]'}`}
                    style={{ height: `${value * 4}px` }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7668]">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-[2rem] bg-white px-5 py-4 shadow-[0_10px_22px_rgba(41,33,27,0.04)]">
              <div className="rounded-full bg-[#ffdcc7] p-3 text-[#964900]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7668]">Consistency score</p>
                <p className="mt-1 font-semibold text-[#1e1b18]">84% excellent</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-[2rem] bg-white px-5 py-4 shadow-[0_10px_22px_rgba(41,33,27,0.04)]">
              <div className="rounded-full bg-[#d7f2dd] p-3 text-[#006a45]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7668]">Best month</p>
                <p className="mt-1 font-semibold text-[#1e1b18]">October 2023</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2.4rem] bg-[#f1ebe5] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7f7269]">Most practiced value</p>
          <div className="mt-6 flex items-center gap-5">
            <div className="rounded-[1.5rem] bg-[#234e00] p-4 text-white">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#35680e]">Mindfulness</h2>
              <p className="mt-2 text-sm text-[#6f6258]">42 reflections this month</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2.4rem] bg-white p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)] md:col-span-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">Recent history</h2>
            <button className="inline-flex items-center gap-1 text-sm font-semibold text-[#35680e]">
              View all
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {recentReflections.map((item) => (
              <article key={`${item.value}-${item.date}`} className="rounded-[1.75rem] bg-[#faf5f1] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-['Inter'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#35680e]">{item.value}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{item.date}</span>
                </div>
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
