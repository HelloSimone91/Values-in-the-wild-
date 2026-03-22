import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { libraryValues } from '../stitchData';

const ValuesLibraryView: React.FC = () => {
  const [activeValue, setActiveValue] = useState(libraryValues[2].name);

  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-4">
        <div className="inline-flex items-center rounded-full bg-[#ece6ff] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4f457f]">
          Core Principles
        </div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#1e1b18] sm:text-5xl lg:text-6xl">
          The Values Library
        </h1>
        <p className="max-w-lg text-base leading-7 text-[#6f6258] sm:text-lg">
          Explore the architectural pillars of a conscious life. Choose a value to deepen your understanding and move it into lived practice.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {libraryValues.map((value) => {
          const expanded = value.name === activeValue;

          if (expanded) {
            return (
              <button
                key={value.name}
                onClick={() => setActiveValue(value.name)}
                className="col-span-2 rounded-[2rem] bg-[#1c1247] p-6 text-left text-white shadow-[0_20px_40px_rgba(28,18,71,0.12)] transition-all hover:translate-y-[-2px] sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{value.emoji}</div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b7f48b]">{value.subtitle}</p>
                    <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em]">{value.name}</h2>
                  </div>
                </div>
                <p className="mt-6 max-w-xl text-sm leading-7 text-[#d4cffa] sm:text-[15px]">{value.description}</p>
                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#e6deff]">
                    {value.reflections} reflections
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#a9a0d9]">Next: practice {value.name}</span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={value.name}
              onClick={() => setActiveValue(value.name)}
              className="rounded-[1.75rem] bg-[#f6efe9] p-5 text-center shadow-[0_12px_30px_rgba(41,33,27,0.04)] transition-all hover:bg-[#f1ebe5] hover:translate-y-[-2px] sm:p-6"
            >
              <div className="text-3xl">{value.emoji}</div>
              <h3 className="mt-4 font-['Inter'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e1b18] sm:text-xs">{value.name}</h3>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#8a7668]">{value.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ValuesLibraryView;
