import React, { useMemo, useState } from 'react';
import { ArrowRight, Compass, Search, Sparkles } from 'lucide-react';
import { accentClass, categoryAccent, ValueDefinition, valueEmoji } from '../stitchData';

interface ValuesLibraryViewProps {
  values: ValueDefinition[];
  selectedValueName: string;
  onSelectValue: (name: string) => void;
  onStartPractice: (valueName: string) => void;
}

const ValuesLibraryView: React.FC<ValuesLibraryViewProps> = ({
  values,
  selectedValueName,
  onSelectValue,
  onStartPractice,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(values.map((value) => value.category))).sort()],
    [values]
  );

  const filteredValues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return values.filter((value) => {
      const matchesCategory = category === 'All' || value.category === category;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      return [value.name, value.description, value.example, value.category, value.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [category, query, values]);

  const selectedValue =
    filteredValues.find((value) => value.name === selectedValueName) ||
    values.find((value) => value.name === selectedValueName) ||
    filteredValues[0] ||
    values[0] ||
    null;

  const featuredValues = filteredValues.slice(0, 18);

  return (
    <div className="space-y-10">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-end">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ece6ff] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4f457f]">
            <Compass className="h-3.5 w-3.5" />
            Values Library
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e] sm:text-5xl lg:text-6xl">
            Definitions you can actually <span className="italic text-[#ff8000]">work with</span>
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#6f6258] sm:text-lg">
            Search the full library, read grounded definitions, and move directly from a value into a daily practice flow.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
          <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Search the library</label>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9f948a]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try courage, belonging, or boundaries"
              className="w-full rounded-[1.2rem] border border-[#ece3dc] bg-[#fff8f3] py-3 pl-11 pr-4 text-sm text-[#1e1b18] outline-none transition focus:border-[#35680e]"
            />
          </div>
        </div>
      </header>

      <section className="flex flex-wrap gap-3">
        {categories.map((option) => {
          const active = option === category;
          return (
            <button
              key={option}
              onClick={() => setCategory(option)}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                active ? 'bg-[#35680e] text-white' : 'bg-[#f1ebe5] text-[#6f6258]'
              }`}
            >
              {option}
            </button>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featuredValues.map((value) => {
            const accent = categoryAccent[value.category] || 'green';
            const active = selectedValue?.name === value.name;

            return (
              <button
                key={value.name}
                onClick={() => onSelectValue(value.name)}
                className={`rounded-[2rem] border p-6 text-left transition ${
                  active
                    ? 'border-[#35680e] bg-white shadow-[0_20px_34px_rgba(53,104,14,0.1)]'
                    : 'border-transparent bg-[#f9f2ed] hover:border-[#e5d8cd]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[accent]}`}>
                    {value.category}
                  </span>
                  <span className="text-2xl">{valueEmoji(value.name)}</span>
                </div>
                <h2 className="mt-5 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18]">{value.name}</h2>
                <p className="mt-3 line-clamp-4 text-sm leading-7 text-[#6f6258]">{value.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {value.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <aside className="rounded-[2.6rem] bg-white p-7 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-8">
          {selectedValue ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#f1ebe5] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Selected value
                  </div>
                  <h2 className="mt-5 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e]">
                    {valueEmoji(selectedValue.name)} {selectedValue.name}
                  </h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[categoryAccent[selectedValue.category] || 'green']}`}>
                  {selectedValue.category}
                </span>
              </div>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Definition</p>
                  <p className="mt-3 text-sm leading-7 text-[#6f6258]">{selectedValue.description}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Grounded example</p>
                  <p className="mt-3 text-sm leading-7 text-[#6f6258]">{selectedValue.example}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedValue.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#fff8f3] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onStartPractice(selectedValue.name)}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#35680e] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)]"
              >
                Practice this value
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <p className="text-sm text-[#6f6258]">No matching values found.</p>
          )}
        </aside>
      </section>
    </div>
  );
};

export default ValuesLibraryView;
