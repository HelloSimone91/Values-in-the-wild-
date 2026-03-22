import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenText, CheckCircle2, History, LibraryBig, Loader2, TriangleAlert, UserCircle2, X } from 'lucide-react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import LandingView from './components/LandingView';
import HistoryView from './components/HistoryView';
import PracticeView from './components/PracticeView';
import ValueDetailView from './components/ValueDetailView';
import ValuesLibraryView from './components/ValuesLibraryView';
import valuesSeed from './data/Values-en.json';
import { findValueBySlug, ReflectionEntry, slugifyValueName, ValueDefinition } from './stitchData';
import { loadReflections, saveReflections } from './services/reflectionPersistenceService';
import { getOrCreateUserId, hasSeenLanding, markLandingSeen } from './services/userSessionService';

type ToastTone = 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [values, setValues] = useState<ValueDefinition[]>([]);
  const [selectedValueName, setSelectedValueName] = useState<string>('');
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [isLoadingValues, setIsLoadingValues] = useState(true);
  const [isLoadingReflections, setIsLoadingReflections] = useState(true);
  const [valuesError, setValuesError] = useState<string | null>(null);
  const [reflectionsError, setReflectionsError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [userId] = useState(() => getOrCreateUserId());

  const guideMatch = matchPath('/guide/:valueSlug', location.pathname);
  const practiceMatch = matchPath('/practice/:valueSlug', location.pathname);
  const routeValueSlug = guideMatch?.params.valueSlug || practiceMatch?.params.valueSlug || null;

  const currentView = useMemo(() => {
    if (location.pathname === '/') return 'landing';
    if (location.pathname === '/guide' || guideMatch) return guideMatch ? 'value' : 'library';
    if (practiceMatch) return 'practice';
    if (location.pathname === '/notes') return 'history';
    return 'library';
  }, [guideMatch, location.pathname, practiceMatch]);

  const selectedValue = useMemo(() => {
    if (routeValueSlug) {
      return findValueBySlug(values, routeValueSlug) || null;
    }
    return values.find((value) => value.name === selectedValueName) || values[0] || null;
  }, [routeValueSlug, selectedValueName, values]);

  const navItems: { label: string; icon: React.ComponentType<{ className?: string }>; href: string; active: boolean }[] = [
    { label: 'Field Guide', icon: LibraryBig, href: '/guide', active: currentView === 'library' || currentView === 'value' },
    {
      label: 'Practice',
      icon: BookOpenText,
      href: selectedValue ? `/practice/${slugifyValueName(selectedValue.name)}` : '/guide',
      active: currentView === 'practice',
    },
    { label: 'Field Notes', icon: History, href: '/notes', active: currentView === 'history' },
  ];

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const pushToast = (message: string, tone: ToastTone) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => removeToast(id), 3200);
  };

  useEffect(() => {
    let cancelled = false;

    const loadValues = async () => {
      setIsLoadingValues(true);
      setValuesError(null);

      try {
        let loadedValues: ValueDefinition[] = [];

        try {
          const response = await fetch('/api/v1/values');
          if (response.ok) {
            const payload = (await response.json()) as { values?: ValueDefinition[] };
            loadedValues = payload.values || [];
          }
        } catch {
          // Static hosting falls back to the bundled values file below.
        }

        if (!loadedValues.length) {
          loadedValues = (valuesSeed.values || []) as ValueDefinition[];
        }

        if (cancelled) return;
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

  useEffect(() => {
    if (location.pathname === '/' && hasSeenLanding()) {
      navigate('/guide', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!isLoadingValues && routeValueSlug && !selectedValue) {
      navigate('/guide', { replace: true });
    }
  }, [isLoadingValues, navigate, routeValueSlug, selectedValue]);

  useEffect(() => {
    if (selectedValue) {
      setSelectedValueName(selectedValue.name);
    }
  }, [selectedValue]);

  const enterApp = (href: string) => {
    markLandingSeen();
    navigate(href);
  };

  const handleSelectValue = (name: string) => {
    setSelectedValueName(name);
  };

  const handleStartPractice = (valueName: string) => {
    setSelectedValueName(valueName);
    enterApp(`/practice/${slugifyValueName(valueName)}`);
  };

  const handleOpenValue = (valueName: string) => {
    setSelectedValueName(valueName);
    enterApp(`/guide/${slugifyValueName(valueName)}`);
  };

  const handleAddReflection = (entry: Omit<ReflectionEntry, 'id' | 'date'>) => {
    const newReflection: ReflectionEntry = {
      id: `reflection_${Date.now()}`,
      date: new Date().toISOString(),
      ...entry,
    };

    const previous = reflections;
    const nextReflections = [newReflection, ...previous];
    setReflections(nextReflections);
    enterApp('/notes');

    void saveReflections(userId, nextReflections).catch((error) => {
      setReflections(previous);
      pushToast(error instanceof Error ? error.message : 'Unable to save field note.', 'error');
    });
  };

  const handleUpdateReflection = (reflectionId: string, updates: Pick<ReflectionEntry, 'note' | 'practiceTitle'>) => {
    const previous = reflections;
    const nextReflections = previous.map((entry) => (entry.id === reflectionId ? { ...entry, ...updates } : entry));
    setReflections(nextReflections);

    void saveReflections(userId, nextReflections)
      .then(() => pushToast('Field note updated.', 'success'))
      .catch((error) => {
        setReflections(previous);
        pushToast(error instanceof Error ? error.message : 'Unable to update field note.', 'error');
      });
  };

  const handleDeleteReflection = (reflectionId: string) => {
    const previous = reflections;
    const nextReflections = previous.filter((entry) => entry.id !== reflectionId);
    setReflections(nextReflections);

    void saveReflections(userId, nextReflections)
      .then(() => pushToast('Field note removed.', 'success'))
      .catch((error) => {
        setReflections(previous);
        pushToast(error instanceof Error ? error.message : 'Unable to remove field note.', 'error');
      });
  };

  const renderRoute = () => {
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

    if (currentView === 'landing') {
      return (
        <LandingView
          valueCount={values.length}
          onEnterFieldGuide={() => enterApp('/guide')}
          onStartPractice={() => {
            if (selectedValue) {
              handleStartPractice(selectedValue.name);
            } else {
              enterApp('/guide');
            }
          }}
        />
      );
    }

    if (currentView === 'value') {
      return selectedValue ? (
        <ValueDetailView
          value={selectedValue}
          values={values}
          onBack={() => navigate('/guide')}
          onOpenValue={handleOpenValue}
          onStartPractice={handleStartPractice}
        />
      ) : null;
    }

    if (currentView === 'practice') {
      return (
        <PracticeView
          selectedValue={selectedValue}
          values={values}
          onSelectValue={(name) => {
            handleSelectValue(name);
            handleStartPractice(name);
          }}
          onAddReflection={handleAddReflection}
        />
      );
    }

    if (currentView === 'history') {
      return (
        <HistoryView
          reflections={reflections}
          values={values}
          onSelectValue={handleSelectValue}
          onOpenValue={handleOpenValue}
          onOpenPractice={() => {
            if (selectedValue) {
              handleStartPractice(selectedValue.name);
            } else {
              enterApp('/guide');
            }
          }}
          onUpdateReflection={handleUpdateReflection}
          onDeleteReflection={handleDeleteReflection}
        />
      );
    }

    return (
      <ValuesLibraryView
        values={values}
        selectedValueName={selectedValue?.name || ''}
        onSelectValue={handleSelectValue}
        onOpenValue={handleOpenValue}
        onStartPractice={handleStartPractice}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] text-[#1e1b18]">
      <header className="sticky top-0 z-50 border-b border-[#efe6df] bg-[rgba(255,248,243,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 flex-col">
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black tracking-[-0.05em] text-[#35680e]">Values in the Wild</span>
            <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8a7668]">Field guide to lived values</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const active = item.active;
              return (
                <button
                  key={item.label}
                  onClick={() => enterApp(item.href)}
                  className={`font-['Plus_Jakarta_Sans'] text-sm font-bold tracking-tight transition-colors ${
                    active ? 'border-b-2 border-[#35680e] pb-1 text-[#35680e]' : 'text-[#85786e] hover:text-[#35680e]'
                  }`}
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

      <main className="mx-auto max-w-7xl px-5 pb-28 pt-8 sm:px-6 md:px-8 md:pb-16 md:pt-10">{renderRoute()}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#efe6df] bg-[rgba(255,248,243,0.88)] px-4 pb-6 pt-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => enterApp(item.href)}
                className={`flex min-h-[64px] flex-col items-center justify-center rounded-full px-3 py-2 transition-all ${
                  item.active ? 'bg-[#35680e] text-white shadow-[0_16px_28px_rgba(53,104,14,0.2)]' : 'text-[#85786e]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 font-['Inter'] text-[10px] font-bold uppercase tracking-[0.18em]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {!!toasts.length && (
        <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
          {toasts.map((toast) => {
            const toneClass =
              toast.tone === 'success'
                ? 'border-[#d1eac7] bg-white text-[#255b31]'
                : 'border-[#f2c8c5] bg-white text-[#93000a]';
            const Icon = toast.tone === 'success' ? CheckCircle2 : TriangleAlert;
            return (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-start gap-3 rounded-[1.4rem] border px-4 py-4 shadow-[0_14px_30px_rgba(41,33,27,0.08)] ${toneClass}`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="flex-1 text-sm leading-6">{toast.message}</p>
                <button onClick={() => removeToast(toast.id)} className="text-current/60 transition hover:text-current">
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default App;
