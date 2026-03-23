import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, NotebookPen, Sparkles } from 'lucide-react';
import {
  createQuickChecklist,
  createDeepDivePractices,
  getValueWildMoments,
  ValueDefinition,
  valueEmoji,
  ReflectionEntry,
} from '../stitchData';

interface PracticeViewProps {
  authConfigured: boolean;
  isGuestMode: boolean;
  isAuthenticated: boolean;
  selectedValue: ValueDefinition | null;
  values: ValueDefinition[];
  onSelectValue: (name: string) => void;
  onAddReflection: (entry: Omit<ReflectionEntry, 'id' | 'date'>) => void;
  onRequestSignIn: () => void;
}

type PracticeMode = 'micro' | 'deep';

const PracticeView: React.FC<PracticeViewProps> = ({
  authConfigured,
  isGuestMode,
  isAuthenticated,
  selectedValue,
  values,
  onSelectValue,
  onAddReflection,
  onRequestSignIn,
}) => {
  const [activePracticeId, setActivePracticeId] = useState<string>('');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('micro');
  const [checkedQuickItems, setCheckedQuickItems] = useState<string[]>([]);
  const [quickNote, setQuickNote] = useState('');
  const [deepReflection, setDeepReflection] = useState('');
  const wildMoments = selectedValue ? getValueWildMoments(selectedValue, 3) : [];

  const quickChecklist = useMemo(
    () => (selectedValue ? createQuickChecklist(selectedValue) : []),
    [selectedValue]
  );
  const deepDivePractices = useMemo(
    () => (selectedValue ? createDeepDivePractices(selectedValue) : []),
    [selectedValue]
  );

  useEffect(() => {
    setPracticeMode('micro');
    setActivePracticeId(deepDivePractices[0]?.id || '');
    setCheckedQuickItems([]);
    setQuickNote('');
    setDeepReflection('');
  }, [selectedValue?.name]);

  useEffect(() => {
    if (practiceMode === 'deep' && !deepDivePractices.some((practice) => practice.id === activePracticeId)) {
      setActivePracticeId(deepDivePractices[0]?.id || '');
    }
  }, [activePracticeId, deepDivePractices, practiceMode]);

  const activePractice = deepDivePractices.find((practice) => practice.id === activePracticeId) || deepDivePractices[0] || null;
  const selectedChecklistItems = quickChecklist.filter((item) => checkedQuickItems.includes(item.id));
  const libraryEyebrow = practiceMode === 'micro' ? 'Daily checklist' : 'Prompt library';
  const libraryTitle = practiceMode === 'micro' ? 'Check what you noticed' : 'Choose one prompt';
  const noteEyebrow = practiceMode === 'micro' ? 'Values observed' : 'Current prompt';
  const noteHint =
    practiceMode === 'micro'
      ? 'Check what you noticed. Add context only if it helps you remember the moment later.'
      : 'Save a specific moment, not an intention.';

  const handleToggleQuickItem = (itemId: string) => {
    setCheckedQuickItems((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  };

  const handleSaveReflection = () => {
    if (!selectedValue) return;

    if (practiceMode === 'micro') {
      const trimmedQuickNote = quickNote.trim();
      if (!selectedChecklistItems.length && !trimmedQuickNote) return;

      const quickLines = selectedChecklistItems.map((item) => `- ${item.summary}`);
      const quickEntryNote = quickLines.length
        ? trimmedQuickNote
          ? `Observed today:\n${quickLines.join('\n')}\n\nNote: ${trimmedQuickNote}`
          : `Observed today:\n${quickLines.join('\n')}`
        : trimmedQuickNote;

      onAddReflection({
        value: selectedValue.name,
        note: quickEntryNote,
        practiceTitle: 'Values observed',
      });
      setCheckedQuickItems([]);
      setQuickNote('');
      return;
    }

    if (!activePractice || !deepReflection.trim()) return;

    onAddReflection({
      value: selectedValue.name,
      note: deepReflection.trim(),
      practiceTitle: activePractice.title,
    });
    setDeepReflection('');
  };

  if (!selectedValue) {
    return (
      <section className="rounded-[2.5rem] bg-[#f9f2ed] p-8 text-center shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
        <p className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18]">
          Choose a value to begin practice.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5e8] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">
            <Sparkles className="h-3.5 w-3.5" />
            Values in the Wild
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold leading-[0.92] tracking-[-0.05em] text-[#35680e] sm:text-5xl lg:text-6xl">
            Practice <span className="italic text-[#35680e]">{selectedValue.name}</span>
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#6f6258] sm:text-lg line-clamp-2">{selectedValue.description}</p>
          {selectedValue.siteContent?.summary?.value ? (
            <p className="max-w-2xl text-sm leading-7 text-[#6f6258]">{selectedValue.siteContent.summary.value}</p>
          ) : null}
        </div>

        <div className="rounded-[2rem] bg-white p-4 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-5">
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

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)] lg:items-start">
        <div className="space-y-5">
          <div className="rounded-[2.5rem] bg-[#35680e] p-7 text-white shadow-[0_24px_48px_rgba(53,104,14,0.18)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">Current value</p>
                <h2 className="mt-4 font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">
                  {valueEmoji(selectedValue.name)} {selectedValue.name}
                </h2>
              </div>
              <span className="rounded-full bg-[#234e00] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">
                {selectedValue.category}
              </span>
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">Ways it shows up</p>
            <ul className="mt-3 space-y-3">
              {wildMoments.slice(0, 3).map((moment) => (
                <li key={moment} className="flex gap-3 text-sm leading-6 text-[#f2f8ea]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8f4bd]" />
                  <span>{moment}</span>
                </li>
              ))}
            </ul>
          </div>

          <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">{libraryEyebrow}</p>
                <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18]">{libraryTitle}</h2>
              </div>
              <div className="inline-flex rounded-full bg-[#f1ebe5] p-1">
                <button
                  onClick={() => setPracticeMode('micro')}
                  className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                    practiceMode === 'micro' ? 'bg-[#35680e] text-white' : 'text-[#6f6258]'
                  }`}
                >
                  Quick
                </button>
                <button
                  onClick={() => setPracticeMode('deep')}
                  className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                    practiceMode === 'deep' ? 'bg-[#35680e] text-white' : 'text-[#6f6258]'
                  }`}
                >
                  Longer
                </button>
              </div>
            </div>

            {practiceMode === 'micro' ? (
              <div className="mt-5 space-y-3">
                {quickChecklist.map((item) => {
                  const checked = checkedQuickItems.includes(item.id);

                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-[1.5rem] border px-4 py-4 transition ${
                        checked
                          ? 'border-[#35680e] bg-[#f6fbf2] shadow-[0_12px_20px_rgba(53,104,14,0.08)]'
                          : 'border-[#efe6df] bg-[#fff8f3] hover:border-[#d9cfc7]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleQuickItem(item.id)}
                        className="mt-1 h-5 w-5 rounded border-[#c8d7ba] text-[#35680e] focus:ring-[#35680e]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-6 text-[#1e1b18]">{item.label}</p>
                      </div>
                    </label>
                  );
                })}
                <p className="px-1 text-sm leading-6 text-[#6f6258]">Anything you check here saves into Field Notes as a quick “Values observed” entry.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {deepDivePractices.map((practice) => {
                  const active = activePractice?.id === practice.id;
                  return (
                    <button
                      key={practice.id}
                      onClick={() => setActivePracticeId(practice.id)}
                      className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                        active
                          ? 'border-[#35680e] bg-[#f6fbf2] shadow-[0_12px_20px_rgba(53,104,14,0.08)]'
                          : 'border-[#efe6df] bg-[#fff8f3] hover:border-[#d9cfc7]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-[-0.03em] text-[#1e1b18]">{practice.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6f6258]">{practice.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">{practice.duration}</p>
                          <ArrowRight className={`ml-auto mt-3 h-4 w-4 ${active ? 'text-[#35680e]' : 'text-[#9f948a]'}`} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-[2.6rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-7 lg:sticky lg:top-24">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#eef5e8] p-2 text-[#35680e]">
                <NotebookPen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Field note</p>
                <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em] text-[#1e1b18]">Add today’s note</h2>
              </div>
            </div>
            <span className="rounded-full bg-[#f1ebe5] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f6258]">
              {practiceMode === 'micro' ? 'Quick' : 'Longer'}
            </span>
          </div>

          <div className="mt-6 rounded-[2rem] bg-[#35680e] p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8f4bd]">{noteEyebrow}</p>
            <h3 className="mt-3 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em]">
              {practiceMode === 'micro' ? 'Values observed' : activePractice?.title || 'Choose a prompt'}
            </h3>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8f4bd]">
              {practiceMode === 'micro' ? '1 min' : activePractice?.duration || 'No duration'}
            </p>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#d4ebb8]">
              {practiceMode === 'micro'
                ? `Use this as a literal checklist. Save the value when you notice it in yourself or someone else.`
                : activePractice?.description}
            </p>
            <div className="mt-5 rounded-[1.5rem] bg-white/10 p-4">
              {practiceMode === 'micro' ? (
                selectedChecklistItems.length ? (
                  <ul className="space-y-2 text-sm leading-6 text-white">
                    {selectedChecklistItems.map((item) => (
                      <li key={item.id}>• {item.summary}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-6 text-white">
                    Check anything you noticed today, or write a short note below if the moment does not fit the checklist.
                  </p>
                )
              ) : (
                <p className="text-sm leading-6 text-white">{activePractice?.prompt}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">
                {practiceMode === 'micro' ? 'Your note' : 'Your field note'}
              </span>
              <textarea
                value={practiceMode === 'micro' ? quickNote : deepReflection}
                onChange={(event) => (practiceMode === 'micro' ? setQuickNote(event.target.value) : setDeepReflection(event.target.value))}
                placeholder={
                  practiceMode === 'micro'
                    ? `Optional: add a brief note about where you saw ${selectedValue.name.toLowerCase()} today.`
                    : `Write one real moment where ${selectedValue.name.toLowerCase()} showed up in the wild today.`
                }
                className={`mt-3 w-full rounded-[1.8rem] border border-[#ece3dc] bg-[#fff8f3] px-5 py-4 text-sm leading-7 text-[#1e1b18] outline-none transition focus:border-[#35680e] ${
                  practiceMode === 'micro' ? 'min-h-[130px]' : 'min-h-[190px]'
                }`}
              />
            </label>
          </div>

          {authConfigured && isGuestMode && (
            <div className="mt-6 rounded-[1.8rem] border border-[#dce7d2] bg-[#f6fbf2] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">Guest mode</p>
              <p className="mt-3 text-sm leading-6 text-[#4d5b43]">
                Field notes stay on this device until you sign in. Use an account if you want sync across devices.
              </p>
              <button
                onClick={onRequestSignIn}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#35680e] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)]"
              >
                Sign in for sync
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <p className="text-sm leading-6 text-[#6f6258]">
              {authConfigured && isGuestMode ? 'Guest notes stay on this device. Sign in later if you want sync.' : noteHint}
            </p>
            <button
              onClick={handleSaveReflection}
              disabled={practiceMode === 'micro' ? !selectedChecklistItems.length && !quickNote.trim() : !deepReflection.trim() || !activePractice}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#35680e] px-6 py-3.5 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)] transition hover:bg-[#2e5a0c] disabled:cursor-not-allowed disabled:bg-[#c9d7bc]"
            >
              {practiceMode === 'micro' ? 'Save observation' : 'Save field note'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </section>
    </div>
  );
};

export default PracticeView;
