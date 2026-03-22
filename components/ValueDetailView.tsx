import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Compass, Sparkles } from 'lucide-react';
import { accentClass, categoryAccent, ValueDefinition, valueEmoji } from '../stitchData';

interface ValueDetailViewProps {
  value: ValueDefinition;
  values: ValueDefinition[];
  onBack: () => void;
  onOpenValue: (name: string) => void;
  onStartPractice: (name: string) => void;
}

const ValueDetailView: React.FC<ValueDetailViewProps> = ({
  value,
  values,
  onBack,
  onOpenValue,
  onStartPractice,
}) => {
  const relatedValues = useMemo(() => {
    return values
      .filter((candidate) => candidate.name !== value.name)
      .map((candidate) => {
        const sharedTags = candidate.tags.filter((tag) => value.tags.includes(tag)).length;
        const sameCategory = candidate.category === value.category ? 2 : 0;
        return { candidate, score: sharedTags + sameCategory };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry) => entry.candidate);
  }, [value, values]);

  const accent = categoryAccent[value.category] || 'green';

  return (
    <div className="space-y-10">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[#35680e]">
        <ArrowLeft className="h-4 w-4" />
        Back to guide
      </button>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <div className="rounded-[2.8rem] bg-[#35680e] p-8 text-white shadow-[0_24px_48px_rgba(53,104,14,0.18)] sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#234e00] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">
                <Compass className="h-3.5 w-3.5" />
                {value.category}
              </div>
              <h1 className="mt-6 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                {valueEmoji(value.name)} {value.name}
              </h1>
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[accent]}`}>
              field note
            </span>
          </div>

          <p className="mt-8 max-w-3xl text-base leading-8 text-[#f2f8ea] sm:text-lg">{value.description}</p>

          <div className="mt-8 rounded-[2rem] bg-white/10 p-6">
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">In the wild</p>
            <p className="mt-2 text-sm leading-7 text-white">{value.example}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {value.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2f8ea]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-[2.5rem] bg-[#f9f2ed] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">
            <Sparkles className="h-3.5 w-3.5" />
            Take it into practice
          </div>
          <h2 className="mt-6 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#1e1b18]">
            Turn this value into a lived move
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#6f6258]">
            Open prompts built from this value’s definition, example, and tags, then log what happened in the wild.
          </p>
          <button
            onClick={() => onStartPractice(value.name)}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#35680e] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)]"
          >
            Begin {value.name} practice
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </section>

      <section className="rounded-[2.6rem] bg-white p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Related values</p>
        <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18]">
          Nearby values in the field guide
        </h2>

        {relatedValues.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {relatedValues.map((candidate) => (
              <button
                key={candidate.name}
                onClick={() => onOpenValue(candidate.name)}
                className="rounded-[2rem] bg-[#f9f2ed] p-6 text-left transition hover:bg-[#f1ebe5]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[categoryAccent[candidate.category] || 'green']}`}>
                    {candidate.category}
                  </span>
                  <span className="text-2xl">{valueEmoji(candidate.name)}</span>
                </div>
                <h3 className="mt-4 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">{candidate.name}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6f6258]">{candidate.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm leading-7 text-[#6f6258]">No nearby values found for this definition yet.</p>
        )}
      </section>
    </div>
  );
};

export default ValueDetailView;
