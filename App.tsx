import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenText, History, LibraryBig, Loader2, UserCircle2 } from 'lucide-react';
import LandingView from './components/LandingView';
import HistoryView from './components/HistoryView';
import PracticeView from './components/PracticeView';
import ValueDetailView from './components/ValueDetailView';
import ValuesLibraryView from './components/ValuesLibraryView';
import { AppView, ReflectionEntry, ValueDefinition } from './stitchData';
import { loadReflections, saveReflections } from './services/reflectionPersistenceService';
import { getOrCreateUserId, hasSeenLanding, markLandingSeen } from './services/userSessionService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(() => (hasSeenLanding() ? 'library' : 'landing'));
  const [values, setValues] = useState<ValueDefinition[]>([]);
  const [selectedValueName, setSelectedValueName] = useState<string>('');
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [isLoadingValues, setIsLoadingValues] = useState(true);
  const [isLoadingReflections, setIsLoadingReflections] = useState(true);
  const [valuesError, setValuesError] = useState<string | null>(null);
  const [reflectionsError, setReflectionsError] = useState<string | null>(null);
  const [userId] = useState(() => getOrCreateUserId());

  useEffect(() => {
    let cancelled = false;

    const loadValues = async () => {
      setIsLoadingValues(true);
      setValuesError(null);

      try {
        const response = await fetch('/api/v1/values');
        if (!response.ok) throw new Error('Failed to load values definitions.');

        const payload = await response.json();
        if (cancelled) return;

        const loadedValues = (payload.values || []) as ValueDefinition[];
        setValues(loadedValues);

        if (loadedValues.length && !selectedValueName) {
          setSelectedValueName(loadedValues[0].name);
        }
      } catch (error) {
        if (!cancelled) {
          setValuesError(error instanceof Error ? error.message : 'Failed to load values definitions.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingValues(false);
        }
      }
    };

    loadValues();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSavedReflections = async () => {
      setIsLoadingReflections(true);
      setReflectionsError(null);

      try {
        const loaded = await loadReflections(userId);
        if (!cancelled) {
          setReflections(loaded);
        }
      } catch (error) {
        if (!cancelled) {
          setReflectionsError(error instanceof Error ? error.message : 'Failed to load reflection history.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingReflections(false);
        }
      }
    };

    loadSavedReflections();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const selectedValue = useMemo(
    () => values.find((value) => value.name === selectedValueName) || values[0] || null,
    [selectedValueName, values]
  );

  const navItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'library', label: 'Field Guide', icon: LibraryBig },
    { id: 'practice', label: 'Practice', icon: BookOpenText },
    { id: 'history', label: 'Field Notes', icon: History },
  ];

  const navigateTo = (nextView: AppView) => {
    if (view === 'landing' && nextView !== 'landing') {
      markLandingSeen();
    }
    setView(nextView);
  };

  const handleSelectValue = (name: string) => {
    setSelectedValueName(name);
  };

  const handleStartPractice = (valueName: string) => {
    setSelectedValueName(valueName);
    navigateTo('practice');
  };

  const handleOpenValue = (valueName: string) => {
    setSelectedValueName(valueName);
    navigateTo('value');
  };

  const handleAddReflection = (entry: Omit<ReflectionEntry, 'id' | 'date'>) => {
    setReflections((prev) => {
      const nextReflections = [
        {
          id: `reflection_${Date.now()}`,
          date: new Date().toISOString(),
          ...entry,
        },
        ...prev,
      ];

      void saveReflections(userId, nextReflections);
      return nextReflections;
    });
    navigateTo('history');
  };

  const handleUpdateReflection = (reflectionId: string, updates: Pick<ReflectionEntry, 'note' | 'practiceTitle'>) => {
    setReflections((prev) => {
      const nextReflections = prev.map((entry) =>
        entry.id === reflectionId ? { ...entry, ...updates } : entry
      );
      void saveReflections(userId, nextReflections);
      return nextReflections;
    });
  };

  const handleDeleteReflection = (reflectionId: string) => {
    setReflections((prev) => {
      const nextReflections = prev.filter((entry) => entry.id !== reflectionId);
      void saveReflections(userId, nextReflections);
      return nextReflections;
    });
  };

  const renderView = () => {
    if (isLoadingValues || isLoadingReflections) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-[#f1ebe5] px-5 py-3 text-sm font-semibold text-[#6f6258]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading the Values in the Wild field guide
          </div>
        </div>
      );
    }

    if (valuesError || reflectionsError) {
      return (
        <div className="rounded-[2rem] bg-[#fff1ef] p-8 text-[#93000a] shadow-[0_14px_30px_rgba(186,26,26,0.08)]">
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em]">Unable to load app data</h1>
          <p className="mt-3 text-sm leading-7">{valuesError || reflectionsError}</p>
          <p className="mt-3 text-sm leading-7">
            Check that the Values in the Wild library file is available and that the backend is running.
          </p>
        </div>
      );
    }

    switch (view) {
      case 'landing':
        return (
          <LandingView
            valueCount={values.length}
            onEnterFieldGuide={() => navigateTo('library')}
            onStartPractice={() => {
              if (selectedValue) {
                handleStartPractice(selectedValue.name);
              } else {
                navigateTo('library');
              }
            }}
          />
        );
      case 'value':
        return selectedValue ? (
          <ValueDetailView
            value={selectedValue}
            values={values}
            onBack={() => navigateTo('library')}
            onOpenValue={handleOpenValue}
            onStartPractice={handleStartPractice}
          />
        ) : null;
      case 'practice':
        return (
          <PracticeView
            selectedValue={selectedValue}
            values={values}
            onSelectValue={handleSelectValue}
            onAddReflection={handleAddReflection}
          />
        );
      case 'history':
        return (
          <HistoryView
            reflections={reflections}
            values={values}
            onSelectValue={handleSelectValue}
            onOpenValue={handleOpenValue}
            onOpenPractice={() => navigateTo('practice')}
            onUpdateReflection={handleUpdateReflection}
            onDeleteReflection={handleDeleteReflection}
          />
        );
      case 'library':
      default:
        return (
          <ValuesLibraryView
            values={values}
            selectedValueName={selectedValue?.name || ''}
            onSelectValue={handleSelectValue}
            onOpenValue={handleOpenValue}
            onStartPractice={handleStartPractice}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] text-[#1e1b18]">
      <header className="sticky top-0 z-50 border-b border-[#efe6df] bg-[rgba(255,248,243,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex min-w-0 flex-col">
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black tracking-[-0.05em] text-[#35680e]">Values in the Wild</span>
            <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8a7668]">Field guide to lived values</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const active = item.id === 'library' ? view === 'library' || view === 'value' : view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`font-['Plus_Jakarta_Sans'] text-sm font-bold tracking-tight transition-colors ${active ? 'border-b-2 border-[#35680e] pb-1 text-[#35680e]' : 'text-[#85786e] hover:text-[#35680e]'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button className="rounded-full p-2 text-[#35680e] transition-colors hover:bg-[#f1ebe5]">
            <UserCircle2 className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-28 pt-10 sm:px-6 md:px-8 md:pb-16 md:pt-14">{renderView()}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#efe6df] bg-[rgba(255,248,243,0.88)] px-4 pb-6 pt-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === 'library' ? view === 'library' || view === 'value' : view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex min-h-[64px] flex-col items-center justify-center rounded-full px-3 py-2 transition-all ${active ? 'bg-[#35680e] text-white shadow-[0_16px_28px_rgba(53,104,14,0.2)]' : 'text-[#85786e]'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 font-['Inter'] text-[10px] font-bold uppercase tracking-[0.18em]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;
