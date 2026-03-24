import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Compass, Sparkles, Star } from 'lucide-react';
import { accentClass, categoryAccent, getValueWildMoments, ValueDefinition } from '../stitchData';

interface ValueDetailViewProps {
  value: ValueDefinition;
  values: ValueDefinition[];
  favoriteValues: string[];
  onFilterCategory: (category: string) => void;
  onFilterTag: (tag: string) => void;
  onBack: () => void;
  onOpenValue: (name: string) => void;
  onStartPractice: (name: string) => void;
  onToggleFavorite: (name: string) => void;
}

const ValueDetailView: React.FC<ValueDetailViewProps> = ({
  value,
  values,
  favoriteValues,
  onFilterCategory,
  onFilterTag,
  onBack,
  onOpenValue,
  onStartPractice,
  onToggleFavorite,
}) => {
  const siteContent = value.siteContent;
  const wildMoments = getValueWildMoments(value, 3);
  const alphabetizedValues = useMemo(
    () => [...values].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })),
    [values]
  );
  const currentValueIndex = useMemo(
    () => alphabetizedValues.findIndex((candidate) => candidate.name === value.name),
    [alphabetizedValues, value.name]
  );
  const previousValue = currentValueIndex > 0 ? alphabetizedValues[currentValueIndex - 1] : null;
  const nextValue = currentValueIndex >= 0 && currentValueIndex < alphabetizedValues.length - 1 ? alphabetizedValues[currentValueIndex + 1] : null;
  const alphabetNav = useMemo(() => {
    const entries = new Map<string, ValueDefinition>();

    alphabetizedValues.forEach((candidate) => {
      const firstLetter = candidate.name.trim().charAt(0).toUpperCase();
      if (/^[A-Z]$/.test(firstLetter) && !entries.has(firstLetter)) {
        entries.set(firstLetter, candidate);
      }
    });

    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
      letter,
      target: entries.get(letter) || null,
    }));
  }, [alphabetizedValues]);
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
  const favorite = favoriteValues.includes(value.name);
  const summary = siteContent?.summary?.value || '';
  const shortDefinition = siteContent?.shortDefinition?.value || '';
  const longDefinition = siteContent?.longDefinition?.value || '';
  const misalignment = siteContent?.misalignment?.value || '';
  const habitIdeas = siteContent?.habitIdeas?.value || [];
  const journalPrompts = siteContent?.journalPrompts?.value || [];
  const conversationStarters = siteContent?.conversationStarters?.value || [];
  const popCultureSpotlight = siteContent?.popCultureSpotlight?.value;
  const heroLead = shortDefinition || summary || value.description;
  const heroSummary = summary && summary !== heroLead ? summary : '';

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[#35680e]">
        <ArrowLeft className="h-4 w-4" />
        Back to guide
      </button>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <div className="rounded-[2.8rem] bg-[#35680e] p-8 text-white shadow-[0_24px_48px_rgba(53,104,14,0.18)] sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => onFilterCategory(value.category)}
                className="inline-flex items-center gap-2 rounded-full bg-[#234e00] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]"
              >
                <Compass className="h-3.5 w-3.5" />
                {value.category}
              </button>
              <h1 className="mt-6 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                {value.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[accent]}`}>
                field note
              </span>
              <button
                type="button"
                aria-label={favorite ? `Remove ${value.name} from favorites` : `Add ${value.name} to favorites`}
                aria-pressed={favorite}
                onClick={() => onToggleFavorite(value.name)}
                className={`rounded-full border p-3 transition ${
                  favorite
                    ? 'border-[#d8f4bd] bg-[#234e00] text-[#d8f4bd]'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <Star className={`h-5 w-5 ${favorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          <p className="mt-7 max-w-3xl text-base leading-7 text-[#f2f8ea] sm:text-lg">{heroLead}</p>
          {heroSummary ? <p className="mt-4 max-w-3xl text-sm leading-7 text-[#d4ebb8] sm:text-base">{heroSummary}</p> : null}

          <div className="mt-7 rounded-[2rem] bg-white/10 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">In the wild</p>
            <ul className="mt-3 space-y-3">
              {wildMoments.map((moment) => (
                <li key={moment} className="flex gap-3 text-sm leading-6 text-white">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8f4bd]" />
                  <span>{moment}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {value.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onFilterTag(tag)}
                className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2f8ea] transition hover:bg-white/10"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-[2.5rem] bg-[#f9f2ed] p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5e8] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">
            <Sparkles className="h-3.5 w-3.5" />
            Practice
          </div>
          <h2 className="mt-6 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#1e1b18]">
            Turn this into one lived move
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#6f6258]">
            Open prompts built from this value, then save what happened.
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

      {(shortDefinition || longDefinition || misalignment) && (
        <section className="grid gap-4 lg:grid-cols-3">
          {shortDefinition ? (
            <article className="rounded-[2rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">At a glance</p>
              <p className="mt-3 text-sm leading-7 text-[#1e1b18]">{shortDefinition}</p>
            </article>
          ) : null}
          {longDefinition ? (
            <article className="rounded-[2rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)] lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Longer read</p>
              <p className="mt-3 text-sm leading-7 text-[#1e1b18]">{longDefinition}</p>
            </article>
          ) : null}
          {misalignment ? (
            <article className="rounded-[2rem] bg-[#f9f2ed] p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)] lg:col-span-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">When it slips</p>
              <p className="mt-3 text-sm leading-7 text-[#1e1b18]">{misalignment}</p>
            </article>
          ) : null}
        </section>
      )}

      {(habitIdeas.length > 0 || conversationStarters.length > 0 || journalPrompts.length > 0 || popCultureSpotlight) && (
        <section className="grid gap-4 xl:grid-cols-2">
          {habitIdeas.length > 0 ? (
            <article className="rounded-[2rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Habit ideas</p>
              <ul className="mt-4 space-y-3">
                {habitIdeas.map((idea) => (
                  <li key={idea} className="flex gap-3 text-sm leading-6 text-[#1e1b18]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#35680e]" />
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
          {conversationStarters.length > 0 ? (
            <article className="rounded-[2rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Conversation starters</p>
              <ul className="mt-4 space-y-3">
                {conversationStarters.map((prompt) => (
                  <li key={prompt} className="flex gap-3 text-sm leading-6 text-[#1e1b18]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff8000]" />
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
          {journalPrompts.length > 0 ? (
            <article className="rounded-[2rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Journal prompts</p>
              <ul className="mt-4 space-y-3">
                {journalPrompts.map((prompt) => (
                  <li key={prompt} className="flex gap-3 text-sm leading-6 text-[#1e1b18]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4f457f]" />
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
          {popCultureSpotlight ? (
            <article className="rounded-[2rem] bg-[#f9f2ed] p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Pop culture spotlight</p>
              <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">
                {popCultureSpotlight.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#1e1b18]">{popCultureSpotlight.summary}</p>
              <p className="mt-4 rounded-[1.4rem] bg-white px-4 py-3 text-sm leading-6 text-[#6f6258]">
                {popCultureSpotlight.takeaway}
              </p>
            </article>
          ) : null}
        </section>
      )}

      <section className="rounded-[2.6rem] bg-white p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Related values</p>

        {relatedValues.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedValues.map((candidate) => (
              <article key={candidate.name} className="rounded-[2rem] bg-[#f9f2ed] p-5 text-left transition hover:bg-[#f1ebe5]">
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => onFilterCategory(candidate.category)}
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[categoryAccent[candidate.category] || 'green']}`}
                  >
                    {candidate.category}
                  </button>
                  <button
                    type="button"
                    aria-label={favoriteValues.includes(candidate.name) ? `Remove ${candidate.name} from favorites` : `Add ${candidate.name} to favorites`}
                    aria-pressed={favoriteValues.includes(candidate.name)}
                    onClick={() => onToggleFavorite(candidate.name)}
                    className={`rounded-full border p-2 transition ${
                      favoriteValues.includes(candidate.name)
                        ? 'border-[#35680e] bg-[#eef5e8] text-[#35680e]'
                        : 'border-[#e4d8cf] bg-white text-[#8a7668] hover:border-[#cdbeb2] hover:text-[#35680e]'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${favoriteValues.includes(candidate.name) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenValue(candidate.name)}
                  className="mt-4 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]"
                >
                  {candidate.name}
                </button>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6f6258]">{candidate.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-[#6f6258]">No nearby values found yet.</p>
        )}
      </section>

      <section className="rounded-[2.6rem] bg-[#f9f2ed] p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Keep browsing</p>
            <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#1e1b18]">
              Move through the field guide
            </h2>
          </div>
          <p className="text-sm leading-6 text-[#6f6258]">
            Jump alphabetically or step through the full guide one entry at a time.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {previousValue ? (
            <button
              type="button"
              onClick={() => onOpenValue(previousValue.name)}
              className="rounded-[2rem] bg-white p-5 text-left transition hover:bg-[#f6f1ec]"
            >
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </p>
              <p className="mt-4 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">
                {previousValue.name}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6f6258]">{previousValue.category}</p>
            </button>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-[#ddcfc4] p-5 text-left text-[#8a7668]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Previous</p>
              <p className="mt-4 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#b5a79b]">Start of guide</p>
              <p className="mt-2 text-sm leading-6">This value is the first entry in the alphabetical index.</p>
            </div>
          )}

          {nextValue ? (
            <button
              type="button"
              onClick={() => onOpenValue(nextValue.name)}
              className="rounded-[2rem] bg-white p-5 text-left transition hover:bg-[#f6f1ec]"
            >
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </p>
              <p className="mt-4 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">
                {nextValue.name}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6f6258]">{nextValue.category}</p>
            </button>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-[#ddcfc4] p-5 text-left text-[#8a7668]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Next</p>
              <p className="mt-4 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#b5a79b]">End of guide</p>
              <p className="mt-2 text-sm leading-6">This value is the last entry in the alphabetical index.</p>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Jump to letter</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {alphabetNav.map(({ letter, target }) => {
              const active = value.name.trim().charAt(0).toUpperCase() === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={!target}
                  onClick={() => target && onOpenValue(target.name)}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                    active
                      ? 'bg-[#35680e] text-white'
                      : target
                        ? 'bg-[#f1ebe5] text-[#6f6258] hover:bg-[#e7ddd5] hover:text-[#35680e]'
                        : 'cursor-not-allowed bg-[#f6f1ec] text-[#c6b8ad]'
                  }`}
                  aria-label={target ? `Jump to ${target.name}` : `No values under ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ValueDetailView;
