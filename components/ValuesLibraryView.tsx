import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Compass, Search, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { accentClass, categoryAccent, getValueSearchText, ValueDefinition } from '../stitchData';

interface ValuesLibraryViewProps {
  values: ValueDefinition[];
  favoriteValues: string[];
  onOpenValue: (valueName: string) => void;
  onStartPractice: (valueName: string) => void;
  onToggleFavorite: (valueName: string) => void;
}

const ValuesLibraryView: React.FC<ValuesLibraryViewProps> = ({
  values,
  favoriteValues,
  onOpenValue,
  onStartPractice,
  onToggleFavorite,
}) => {
  const INITIAL_VISIBLE_VALUES = 12;
  const LOAD_MORE_VALUES_COUNT = 6;
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_VALUES);
  const [searchParams, setSearchParams] = useSearchParams();
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const activeCategory = searchParams.get('category') || 'All';
  const activeTag = searchParams.get('tag') || '';
  const favoritesOnly = searchParams.get('favorites') === '1';

  const categories = useMemo(
    () => Array.from(new Set(values.map((value) => value.category))).sort(),
    [values]
  );

  const setExclusiveFilter = (next: { category?: string; tag?: string; favorites?: boolean }) => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete('category');
    nextParams.delete('tag');
    nextParams.delete('favorites');

    if (next.category && next.category !== 'All') {
      nextParams.set('category', next.category);
    }

    if (next.tag) {
      nextParams.set('tag', next.tag);
    }

    if (next.favorites) {
      nextParams.set('favorites', '1');
    }

    setSearchParams(nextParams);
  };

  const filteredValues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return values.filter((value) => {
      const matchesCategory = activeCategory === 'All' || value.category === activeCategory;
      if (!matchesCategory) return false;
      if (activeTag && !value.tags.some((tag) => tag.toLowerCase() === activeTag.toLowerCase())) return false;
      if (favoritesOnly && !favoriteValues.includes(value.name)) return false;
      if (!normalizedQuery) return true;

      return getValueSearchText(value).includes(normalizedQuery);
    });
  }, [activeCategory, activeTag, favoriteValues, favoritesOnly, query, values]);

  const activeFilterLabel = favoritesOnly
    ? 'favorites'
    : activeTag
      ? `tag: ${activeTag}`
      : activeCategory !== 'All'
        ? activeCategory
        : '';

  const visibleValues = filteredValues.slice(0, visibleCount);
  const remainingValuesCount = Math.max(filteredValues.length - visibleValues.length, 0);
  const nextLoadCount = Math.min(LOAD_MORE_VALUES_COUNT, remainingValuesCount);
  const hasMoreValues = remainingValuesCount > 0;

  const loadMoreValues = () => {
    if (!hasMoreValues) return;

    setVisibleCount((currentCount) => Math.min(currentCount + LOAD_MORE_VALUES_COUNT, filteredValues.length));
  };

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_VALUES);
  }, [activeCategory, activeTag, favoritesOnly, query]);

  useEffect(() => {
    if (!hasMoreValues || !loadMoreTriggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreValues();
        }
      },
      { rootMargin: '0px 0px 240px 0px' }
    );

    observer.observe(loadMoreTriggerRef.current);

    return () => observer.disconnect();
  }, [hasMoreValues, visibleCount, filteredValues.length]);

  return (
    <div className="space-y-8">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-end">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5e8] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">
            <Compass className="h-3.5 w-3.5" />
            Values in the Wild
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e] sm:text-5xl lg:text-6xl">
            A field guide to the values you <span className="italic text-[#ff8000]">actually live</span>
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#6f6258] sm:text-lg">
            Browse the guide, then move any value straight into practice.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-4 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Search</label>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9f948a]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courage, belonging, or boundaries"
              className="w-full rounded-[1.2rem] border border-[#ece3dc] bg-[#fff8f3] py-3 pl-11 pr-4 text-sm text-[#1e1b18] outline-none transition focus:border-[#35680e]"
            />
          </div>
        </div>
      </header>

      <section className="flex flex-wrap gap-3">
        <button
          onClick={() => setExclusiveFilter({ category: 'All' })}
          className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
            !activeFilterLabel ? 'bg-[#35680e] text-white' : 'bg-[#f1ebe5] text-[#6f6258]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setExclusiveFilter({ favorites: !favoritesOnly })}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
            favoritesOnly ? 'bg-[#35680e] text-white' : 'bg-[#f1ebe5] text-[#6f6258]'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
          Favorites
        </button>
        {categories.map((option) => {
          const active = option === activeCategory;
          return (
            <button
              key={option}
              onClick={() => setExclusiveFilter({ category: active ? 'All' : option })}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                active ? 'bg-[#35680e] text-white' : 'bg-[#f1ebe5] text-[#6f6258]'
              }`}
            >
              {option}
            </button>
          );
        })}
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#6f6258]">
          Showing {visibleValues.length} of {filteredValues.length} values in the field guide
          {activeFilterLabel ? ` · filtered by ${activeFilterLabel}` : ''}
          {!!activeFilterLabel && (
            <button onClick={() => setExclusiveFilter({ category: 'All' })} className="font-semibold text-[#35680e]">
              Clear filter
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleValues.map((value) => {
            const accent = categoryAccent[value.category] || 'green';
            const favorite = favoriteValues.includes(value.name);

            return (
              <article
                key={value.name}
                className="rounded-[2rem] border border-transparent bg-[#f9f2ed] p-6 text-left transition hover:border-[#e5d8cd]"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setExclusiveFilter({ category: value.category })}
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${accentClass[accent]}`}
                  >
                    {value.category}
                  </button>
                  <button
                    type="button"
                    aria-label={favorite ? `Remove ${value.name} from favorites` : `Add ${value.name} to favorites`}
                    aria-pressed={favorite}
                    onClick={() => onToggleFavorite(value.name)}
                    className={`rounded-full border p-2 transition ${
                      favorite
                        ? 'border-[#35680e] bg-[#eef5e8] text-[#35680e]'
                        : 'border-[#e4d8cf] bg-white text-[#8a7668] hover:border-[#cdbeb2] hover:text-[#35680e]'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <h2 className="mt-4">
                  <button
                    type="button"
                    onClick={() => onOpenValue(value.name)}
                    className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em] text-[#1e1b18] transition hover:text-[#35680e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35680e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f2ed]"
                  >
                    {value.name}
                  </button>
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6f6258]">{value.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {value.tags.slice(0, 3).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setExclusiveFilter({ tag: activeTag === tag ? '' : tag })}
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                        activeTag === tag ? 'bg-[#35680e] text-white' : 'bg-white text-[#8a7668]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => onOpenValue(value.name)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#35680e] px-4 py-2 text-sm font-bold text-white"
                  >
                    View value
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onStartPractice(value.name)}
                    className="rounded-full border border-[#e4d8cf] bg-white px-4 py-2 text-sm font-semibold text-[#35680e]"
                  >
                    Begin practice
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {hasMoreValues && (
          <div ref={loadMoreTriggerRef} className="flex flex-col items-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadMoreValues}
              className="inline-flex items-center gap-2 rounded-full border border-[#d9cec4] bg-white px-5 py-3 text-sm font-semibold text-[#35680e] transition hover:border-[#35680e]"
            >
              Load {nextLoadCount} more value{nextLoadCount === 1 ? '' : 's'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a7668]">
              {remainingValuesCount} more waiting below
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ValuesLibraryView;
