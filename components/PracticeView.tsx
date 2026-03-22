import React from 'react';
import { ArrowUpRight, Bolt, HandHeart, NotebookPen } from 'lucide-react';
import { deepDivePractices, microPractices } from '../stitchData';

const accentClass = {
  green: 'bg-[#d7f2dd] text-[#255b31]',
  orange: 'bg-[#ffdcc7] text-[#723600]',
  purple: 'bg-[#ece6ff] text-[#4f457f]',
};

const PracticeView: React.FC = () => {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="inline-flex items-center rounded-full bg-[#ffdcc7] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#964900]">
          Guided Evolution
        </div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold leading-[0.92] tracking-[-0.05em] text-[#35680e] sm:text-5xl lg:text-7xl">
          Daily Practice <span className="italic text-[#ff8000]">Examples</span>
        </h1>
        <p className="max-w-2xl text-base leading-7 text-[#6f6258] sm:text-lg">
          Small, intentional steps to bridge the gap between abstract values and lived experience. Choose a duration that fits your day.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <section className="space-y-6 lg:col-span-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#ffdcc7] p-2 text-[#964900]">
                <Bolt className="h-5 w-5" />
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18] sm:text-3xl">Micro-moments</h2>
            </div>
            <span className="rounded-full bg-[#f1ebe5] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f6258]">1 minute</span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {microPractices.map((practice) => (
              <article key={practice.title} className="rounded-[2rem] bg-[#f9f2ed] p-7 shadow-[0_14px_32px_rgba(41,33,27,0.04)] transition-all hover:bg-[#f1ebe5]">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[practice.accent]}`}>
                    {practice.value}
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-[#9f948a]" />
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-[-0.03em] text-[#1e1b18]">{practice.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6f6258]">{practice.description}</p>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c7768]">{practice.duration}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="relative overflow-hidden rounded-[2.4rem] bg-[#35680e] p-8 text-white shadow-[0_24px_48px_rgba(53,104,14,0.2)] lg:col-span-4">
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-[#234e00] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">
              Social Practice
            </div>
            <h2 className="mt-6 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em]">The Generosity Pulse</h2>
            <p className="mt-4 text-sm leading-7 text-[#d4ebb8]">
              Surprise a colleague with a 15-minute unsolicited mentorship session or a thoughtful endorsement.
            </p>
            <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#ff8000] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(255,128,0,0.22)]">
              Try this now
              <HandHeart className="h-4 w-4" />
            </button>
          </div>
          <div className="pointer-events-none absolute -bottom-12 -right-10 opacity-10">
            <HandHeart className="h-48 w-48" />
          </div>
        </aside>

        <section className="space-y-6 lg:col-span-12">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#ece6ff] p-2 text-[#4f457f]">
                <NotebookPen className="h-5 w-5" />
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18] sm:text-3xl">Deep Dives</h2>
            </div>
            <span className="rounded-full bg-[#f1ebe5] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f6258]">15-30 minutes</span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {deepDivePractices.map((practice) => (
              <article
                key={practice.title}
                className="flex min-h-[24rem] flex-col justify-end rounded-[2.4rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.45),rgba(241,235,229,0.98))] p-7 shadow-[0_18px_34px_rgba(41,33,27,0.05)]"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#964900]">{practice.value}</span>
                <h3 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">{practice.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#6f6258]">{practice.description}</p>
                <button className="mt-8 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#234e00] shadow-[0_10px_24px_rgba(53,104,14,0.08)]">
                  Start Session
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PracticeView;
