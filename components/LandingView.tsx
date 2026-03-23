import React from 'react';
import { ArrowRight, BookOpenText, Compass, Sparkles } from 'lucide-react';

interface LandingViewProps {
  authConfigured: boolean;
  valueCount: number;
  onContinueAsGuest: () => void;
  onEnterFieldGuide: () => void;
  onSignIn: () => void;
  onStartPractice: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({
  authConfigured,
  valueCount,
  onContinueAsGuest,
  onEnterFieldGuide,
  onSignIn,
  onStartPractice,
}) => {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-end">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5e8] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">
            <Sparkles className="h-3.5 w-3.5" />
            Values in the Wild
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-5xl font-extrabold leading-[0.92] tracking-[-0.06em] text-[#35680e] sm:text-6xl lg:text-7xl">
            A field guide to the values you <span className="italic text-[#ff8000]">actually live</span>
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#6f6258] sm:text-lg">
            Read the guide, practice one value, and keep notes on what actually happened.
          </p>
          {authConfigured ? (
            <div className="rounded-[2rem] bg-white p-5 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Choose how to start</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={onContinueAsGuest}
                  className="rounded-[1.5rem] border border-[#ece3dc] bg-[#fff8f3] p-4 text-left transition hover:border-[#d8cdc4]"
                >
                  <p className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-[-0.03em] text-[#1e1b18]">Continue as guest</p>
                  <p className="mt-2 text-sm leading-6 text-[#6f6258]">Browse, practice, and keep notes on this device only.</p>
                </button>
                <button
                  onClick={onSignIn}
                  className="rounded-[1.5rem] bg-[#35680e] p-4 text-left text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)]"
                >
                  <p className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-[-0.03em]">Sign in</p>
                  <p className="mt-2 text-sm leading-6 text-[#d4ebb8]">Save notes to your account and sync them across devices.</p>
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onEnterFieldGuide}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8cdc4] bg-white px-6 py-3 text-sm font-semibold text-[#35680e]"
                >
                  Browse first
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onStartPractice}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8cdc4] bg-white px-6 py-3 text-sm font-semibold text-[#35680e]"
                >
                  Begin practice
                  <BookOpenText className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onEnterFieldGuide}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#35680e] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)]"
              >
                Browse the field guide
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onStartPractice}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8cdc4] bg-white px-6 py-3 text-sm font-semibold text-[#35680e]"
              >
                Begin practice
                <BookOpenText className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f1ebe5] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">
            <Compass className="h-3.5 w-3.5" />
            What’s inside
          </div>
          <div className="mt-5 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#f1ebe5] pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Field guide</p>
              <p className="text-right text-sm text-[#6f6258]">{valueCount} values</p>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-[#f1ebe5] pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Practice</p>
              <p className="text-right text-sm text-[#6f6258]">Short prompts and longer sessions</p>
            </div>
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Field notes</p>
              <p className="text-right text-sm text-[#6f6258]">A persistent record of lived evidence</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingView;
