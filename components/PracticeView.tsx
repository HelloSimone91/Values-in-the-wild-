import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bolt, CheckCircle2, NotebookPen, Sparkles } from 'lucide-react';
import {
  accentClass,
  createDeepDivePractices,
  createMicroPractices,
  ValueDefinition,
  valueEmoji,
  ReflectionEntry,
} from '../stitchData';

interface PracticeViewProps {
  selectedValue: ValueDefinition | null;
  values: ValueDefinition[];
  onSelectValue: (name: string) => void;
  onAddReflection: (entry: Omit<ReflectionEntry, 'id' | 'date'>) => void;
}

const PracticeView: React.FC<PracticeViewProps> = ({ selectedValue, values, onSelectValue, onAddReflection }) => {
  const [activePracticeId, setActivePracticeId] = useState<string>('');
  const [reflection, setReflection] = useState('');

  const microPractices = useMemo(
    () => (selectedValue ? createMicroPractices(selectedValue) : []),
    [selectedValue]
  );
  const deepDivePractices = useMemo(
    () => (selectedValue ? createDeepDivePractices(selectedValue) : []),
    [selectedValue]
  );
  const allPractices = useMemo(() => [...microPractices, ...deepDivePractices], [microPractices, deepDivePractices]);

  useEffect(() => {
    setActivePracticeId(allPractices[0]?.id || '');
    setReflection('');
  }, [selectedValue?.name, allPractices]);

  const activePractice = allPractices.find((practice) => practice.id === activePracticeId) || allPractices[0] || null;

  const handleSaveReflection = () => {
    if (!selectedValue || !activePractice || !reflection.trim()) return;

    onAddReflection({
      value: selectedValue.name,
      note: reflection.trim(),
      practiceTitle: activePractice.title,
    });
    setReflection('');
  };

  if (!selectedValue) {
    return (
      <section className="rounded-[2.5rem] bg-[#f9f2ed] p-8 text-center shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
        <p className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18]">
          Choose a value to start practicing.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-10">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ffdcc7] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#964900]">
            <Sparkles className="h-3.5 w-3.5" />
            Values in the Wild
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold leading-[0.92] tracking-[-0.05em] text-[#35680e] sm:text-5xl lg:text-6xl">
            Practice <span className="italic text-[#ff8000]">{selectedValue.name}</span> in the wild
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#6f6258] sm:text-lg">{selectedValue.description}</p>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
          <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Switch value</label>
          <select
            value={selectedValue.name}
            onChange={(event) => onSelectValue(event.target.value)}
            className="mt-3 w-full rounded-[1.2rem] border border-[#ece3dc] bg-[#fff8f3] px-4 py-3 text-sm font-semibold text-[#1e1b18] outline-none transition focus:border-[#35680e]"
          >
            {values.map((value) => (
              <option key={value.name} value={value.name}>
                {value.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <div className="rounded-[2.5rem] bg-[#35680e] p-7 text-white shadow-[0_24px_48px_rgba(53,104,14,0.18)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">Today's value</p>
              <h2 className="mt-4 font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">
                {valueEmoji(selectedValue.name)} {selectedValue.name}
              </h2>
            </div>
            <span className="rounded-full bg-[#234e00] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">
              {selectedValue.category}
            </span>
          </div>
          <p className="mt-6 text-sm leading-7 text-[#d4ebb8]">{selectedValue.example}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {selectedValue.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2f8ea]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-[#f9f2ed] p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#d7f2dd] p-2 text-[#255b31]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Reflection</p>
              <p className="mt-1 text-sm text-[#6f6258]">Choose a prompt, then log what actually happened in the wild.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {allPractices.slice(0, 4).map((practice) => {
              const active = activePractice?.id === practice.id;
              return (
                <button
                  key={practice.id}
                  onClick={() => setActivePracticeId(practice.id)}
                  className={`w-full rounded-[1.6rem] border px-4 py-4 text-left transition ${
                    active
                      ? 'border-[#35680e] bg-white shadow-[0_14px_26px_rgba(53,104,14,0.08)]'
                      : 'border-transparent bg-white/70 hover:border-[#e7ddd5]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-[-0.03em] text-[#1e1b18]">{practice.title}</p>
                      <p className="mt-1 text-sm text-[#6f6258]">{practice.duration}</p>
                    </div>
                    <ArrowRight className={`h-4 w-4 transition ${active ? 'text-[#35680e]' : 'text-[#9f948a]'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#ffdcc7] p-2 text-[#964900]">
                <Bolt className="h-5 w-5" />
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18] sm:text-3xl">Micro practices</h2>
            </div>
            <span className="rounded-full bg-[#f1ebe5] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f6258]">1 minute</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {microPractices.map((practice) => (
              <article key={practice.id} className="rounded-[2rem] bg-[#f9f2ed] p-7 shadow-[0_14px_32px_rgba(41,33,27,0.04)]">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[practice.accent]}`}>
                    {practice.value}
                  </span>
                  <button
                    onClick={() => setActivePracticeId(practice.id)}
                    className="text-sm font-semibold text-[#35680e]"
                  >
                    Select
                  </button>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-[-0.03em] text-[#1e1b18]">{practice.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6f6258]">{practice.description}</p>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c7768]">{practice.prompt}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-[2.4rem] bg-[#35680e] p-8 text-white shadow-[0_24px_48px_rgba(53,104,14,0.2)] lg:col-span-5">
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-[#234e00] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">
              Active prompt
            </div>
            <h2 className="mt-6 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em]">
              {activePractice?.title || 'Choose a practice'}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#d4ebb8]">{activePractice?.description}</p>
            <p className="mt-5 text-sm leading-7 text-white">{activePractice?.prompt}</p>
          </div>
        </aside>

        <section className="space-y-6 lg:col-span-12">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#ece6ff] p-2 text-[#4f457f]">
                <NotebookPen className="h-5 w-5" />
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18] sm:text-3xl">Longer sessions</h2>
            </div>
            <span className="rounded-full bg-[#f1ebe5] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f6258]">15-30 minutes</span>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {deepDivePractices.map((practice) => (
              <article
                key={practice.id}
                className="flex min-h-[24rem] flex-col justify-between rounded-[2.4rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.45),rgba(241,235,229,0.98))] p-7 shadow-[0_18px_34px_rgba(41,33,27,0.05)]"
              >
                <div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[practice.accent]}`}>
                    {practice.value}
                  </span>
                  <h3 className="mt-4 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">{practice.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#6f6258]">{practice.description}</p>
                </div>
                <button
                  onClick={() => setActivePracticeId(practice.id)}
                  className="mt-8 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#234e00] shadow-[0_10px_24px_rgba(53,104,14,0.08)]"
                >
                  Focus this prompt
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-[2.6rem] bg-white p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Log a reflection</p>
            <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18]">
              Add a field note from today
            </h2>
          </div>
          <span className="rounded-full bg-[#f1ebe5] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f6258]">
            {activePractice?.title || 'No practice selected'}
          </span>
        </div>

        <textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder={`What did ${selectedValue.name.toLowerCase()} look like in the wild today?`}
          className="mt-6 min-h-[170px] w-full rounded-[1.8rem] border border-[#ece3dc] bg-[#fff8f3] px-5 py-4 text-sm leading-7 text-[#1e1b18] outline-none transition focus:border-[#35680e]"
        />

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-[#6f6258]">
            Save a specific moment, not a general intention. Field notes power your streaks, trends, and value history.
          </p>
          <button
            onClick={handleSaveReflection}
            disabled={!reflection.trim() || !activePractice}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#35680e] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)] transition hover:bg-[#2e5a0c] disabled:cursor-not-allowed disabled:bg-[#c9d7bc]"
          >
            Save reflection
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PracticeView;
