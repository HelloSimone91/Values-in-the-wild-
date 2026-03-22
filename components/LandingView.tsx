import React from 'react';
import { ArrowRight, BookOpenText, Compass, Sparkles } from 'lucide-react';

interface LandingViewProps {
  valueCount: number;
  onEnterFieldGuide: () => void;
  onStartPractice: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ valueCount, onEnterFieldGuide, onStartPractice }) => {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-end">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ece6ff] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4f457f]">
            <Sparkles className="h-3.5 w-3.5" />
            Values in the Wild
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-5xl font-extrabold leading-[0.92] tracking-[-0.06em] text-[#35680e] sm:text-6xl lg:text-7xl">
            A field guide to the values you <span className="italic text-[#ff8000]">actually live</span>
          </h1>
          <p className="max-w-3xl text-base leading-8 text-[#6f6258] sm:text-lg">
            Read grounded definitions, turn them into practice prompts, and keep field notes on how they show up in real life.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onEnterFieldGuide}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#35680e] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)]"
            >
              Enter the field guide
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onStartPractice}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f1ebe5] px-6 py-3 text-sm font-semibold text-[#35680e]"
            >
              Start with practice
              <BookOpenText className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-white p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f1ebe5] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">
            <Compass className="h-3.5 w-3.5" />
            What’s inside
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Field guide</p>
              <p className="mt-2 text-sm leading-7 text-[#6f6258]">{valueCount} value definitions with examples and related tags.</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Practice</p>
              <p className="mt-2 text-sm leading-7 text-[#6f6258]">Short prompts and longer sessions built directly from each value.</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Field notes</p>
              <p className="mt-2 text-sm leading-7 text-[#6f6258]">A persistent record of what happened in the wild, not just what you intended.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingView;
