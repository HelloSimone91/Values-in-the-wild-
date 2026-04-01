import React, { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Activity, BookOpenText, CheckCircle2, History, LibraryBig, Loader2, TriangleAlert, UserCircle2, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { findValueBySlug, mergeValueSiteContent, ReflectionEntry, slugifyValueName, ValueDefinition, ValueSiteContent } from './stitchData';
import { clearLocalReflections, loadLocalReflections, loadReflections, saveReflections } from './services/reflectionPersistenceService';
import { DAILY_QUICK_REFLECTION_TITLE, findDailyQuickReflectionEntries } from './services/dailyQuickReflectionService';
import { getCurrentSession, getSupabaseClient, isSupabaseConfigured, sendMagicLink, signOutUser } from './services/supabaseClient';
import { EntryMode, getEntryMode, getOrCreateUserId, hasSeenLanding, markLandingSeen, setEntryMode } from './services/userSessionService';
import { trackEvent } from './services/analyticsService';
import { loadAdminAccess } from './services/adminAccessService';
import { AnalyticsDebugPayload, loadAnalyticsDebug } from './services/analyticsDebugService';

type ToastTone = 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

const LandingView = lazy(() => import('./components/LandingView'));
const ValueDetailView = lazy(() => import('./components/ValueDetailView'));
const PracticeView = lazy(() => import('./components/PracticeView'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const ValuesLibraryView = lazy(() => import('./components/ValuesLibraryView'));
const AnalyticsDebugView = lazy(() => import('./components/AnalyticsDebugView'));
const AuthDialog = lazy(() => import('./components/AuthDialog'));

const RouteSuspenseFallback: React.FC = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="inline-flex items-center gap-3 rounded-full bg-[#f1ebe5] px-5 py-3 text-sm font-semibold text-[#6f6258]">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading the Values in the Wild field guide
    </div>
  </div>
);

const configuredBackendBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const isLocalPreviewHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const App: React.FC = () => {
  const FAVORITES_STORAGE_KEY = 'values-in-the-wild:favorites';
  const location = useLocation();
  const navigate = useNavigate();

  const [values, setValues] = useState<ValueDefinition[]>([]);
  const [selectedValueName, setSelectedValueName] = useState<string>('');
  const [favoriteValues, setFavoriteValues] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];

    try {
      const storedValue = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsedValue = storedValue ? JSON.parse(storedValue) : [];
      return Array.isArray(parsedValue) ? parsedValue.filter((entry): entry is string => typeof entry === 'string') : [];
    } catch {
      return [];
    }
  });
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [isLoadingValues, setIsLoadingValues] = useState(true);
  const [isLoadingReflections, setIsLoadingReflections] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(isSupabaseConfigured());
  const [valuesError, setValuesError] = useState<string | null>(null);
  const [reflectionsError, setReflectionsError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [claimableGuestReflections, setClaimableGuestReflections] = useState<ReflectionEntry[]>([]);
  const [isClaimingGuestNotes, setIsClaimingGuestNotes] = useState(false);
  const [analyticsDebug, setAnalyticsDebug] = useState<AnalyticsDebugPayload>({ events: [], summary: [], windowHours: 168 });
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isCheckingAdminAccess, setIsCheckingAdminAccess] = useState(false);
  const [anonymousUserId] = useState(() => getOrCreateUserId());
  const [entryMode, setEntryModeState] = useState<EntryMode | null>(() => getEntryMode());
  const previousSessionUserId = useRef<string | null>(null);

  const authEnabled = isSupabaseConfigured();
  const effectiveEntryMode: EntryMode = !authEnabled ? 'guest' : session ? 'account' : entryMode || 'guest';
  const isGuestMode = effectiveEntryMode === 'guest';
  const useAccountPersistence = authEnabled && effectiveEntryMode === 'account' && Boolean(session);
  const userId = session?.user.id || anonymousUserId;
  const accessToken = session?.access_token || null;

  const guideMatch = matchPath('/guide/:valueSlug', location.pathname);
  const practiceMatch = matchPath('/practice/:valueSlug', location.pathname);
  const routeValueSlug = guideMatch?.params.valueSlug || practiceMatch?.params.valueSlug || null;
  const isAnalyticsDebugRoute = location.pathname === '/debug/analytics';

  const currentView = useMemo(() => {
    if (location.pathname === '/') return 'landing';
    if (location.pathname === '/guide' || guideMatch) return guideMatch ? 'value' : 'library';
    if (practiceMatch) return 'practice';
    if (location.pathname === '/notes') return 'history';
    if (isAnalyticsDebugRoute) return 'debug';
    return 'library';
  }, [guideMatch, isAnalyticsDebugRoute, location.pathname, practiceMatch]);
  const shouldLoadValues = currentView !== 'landing';
  const shouldLoadReflections = currentView === 'practice' || currentView === 'history';

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

  const emitEvent = (eventName: string, metadata: Record<string, unknown> = {}) => {
    void trackEvent(eventName, {
      accessToken,
      anonymousId: session ? null : anonymousUserId,
      metadata,
    });
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteValues));
    } catch {
      // Ignore storage failures so the guide still works in restricted browsers.
    }
  }, [favoriteValues]);

  useEffect(() => {
    if (!authEnabled) {
      setIsLoadingAuth(false);
      return;
    }

    let active = true;
    const supabase = getSupabaseClient();

    const bootstrapSession = async () => {
      try {
        const nextSession = await getCurrentSession();
        if (active) {
          setSession(nextSession);
        }
      } catch (error) {
        if (active) {
          pushToast(error instanceof Error ? error.message : 'Unable to load your session.', 'error');
        }
      } finally {
        if (active) {
          setIsLoadingAuth(false);
        }
      }
    };

    void bootstrapSession();

    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsLoadingAuth(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [authEnabled]);

  useEffect(() => {
    const currentUserId = session?.user.id || null;
    if (currentUserId && previousSessionUserId.current !== currentUserId) {
      emitEvent('auth_signed_in');
    }
    previousSessionUserId.current = currentUserId;
  }, [session]);

  useEffect(() => {
    if (!authEnabled) return;

    if (session) {
      setEntryMode('account');
      setEntryModeState('account');
      return;
    }

    if (!entryMode) {
      setEntryMode('guest');
      setEntryModeState('guest');
    }
  }, [authEnabled, entryMode, session]);

  useEffect(() => {
    if (!authEnabled) return;

    if (!session) {
      setClaimableGuestReflections([]);
      return;
    }

    const guestReflections = loadLocalReflections(anonymousUserId);
    setClaimableGuestReflections(guestReflections);
  }, [anonymousUserId, authEnabled, session]);

  useEffect(() => {
    if (currentView === 'landing') {
      emitEvent('screen_view', { screen: 'landing' });
    }
  }, [currentView]);

  const refreshAnalyticsDebug = async () => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);

    try {
      const payload = await loadAnalyticsDebug(accessToken);
      setAnalyticsDebug(payload);
    } catch (error) {
      setAnalyticsError(error instanceof Error ? error.message : 'Failed to load analytics debug data.');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (!isAnalyticsDebugRoute) return;
    if (authEnabled && (!session || !hasAdminAccess)) return;
    void refreshAnalyticsDebug();
  }, [accessToken, authEnabled, hasAdminAccess, isAnalyticsDebugRoute, session]);

  useEffect(() => {
    if (!authEnabled || !session) {
      setHasAdminAccess(false);
      setIsCheckingAdminAccess(false);
      return;
    }

    let active = true;
    setIsCheckingAdminAccess(true);

    void loadAdminAccess(accessToken)
      .then((payload) => {
        if (!active) return;
        setHasAdminAccess(Boolean(payload.admin));
      })
      .catch(() => {
        if (!active) return;
        setHasAdminAccess(false);
      })
      .finally(() => {
        if (active) {
          setIsCheckingAdminAccess(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, authEnabled, session]);

  useEffect(() => {
    if (!shouldLoadValues) {
      setIsLoadingValues(false);
      return;
    }

    if (values.length) {
      setIsLoadingValues(false);
      return;
    }

    let cancelled = false;

    const loadValues = async () => {
      setIsLoadingValues(true);
      setValuesError(null);

      try {
        let loadedValues: ValueDefinition[] = [];
        const shouldTryValuesApi = Boolean(configuredBackendBase) || import.meta.env.DEV || !isLocalPreviewHost;

        if (shouldTryValuesApi) {
          try {
            const valuesEndpoint = configuredBackendBase ? `${configuredBackendBase}/api/v1/values` : '/api/v1/values';
            const response = await fetch(valuesEndpoint);
            if (response.ok) {
              const payload = (await response.json()) as { values?: ValueDefinition[] };
              loadedValues = payload.values || [];
            }
          } catch {
            // Static hosting and local preview fall back to the bundled values file below.
          }
        }

        if (!loadedValues.length) {
          const localValuesModule = await import('./data/Values-en.json');
          const localSiteContentModule = await import('./data/ValueSiteContent.json');
          loadedValues = mergeValueSiteContent(
            (localValuesModule.default.values || []) as ValueDefinition[],
            (localSiteContentModule.default || {}) as Record<string, ValueSiteContent>
          );
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
  }, [selectedValueName, shouldLoadValues, values.length]);

  useEffect(() => {
    if (!shouldLoadReflections) {
      setIsLoadingReflections(false);
      return;
    }

    let cancelled = false;

    const loadSavedReflections = async () => {
      setIsLoadingReflections(true);
      setReflectionsError(null);

      try {
        if (useAccountPersistence && !accessToken) {
          if (!cancelled) {
            setReflections([]);
            setIsLoadingReflections(false);
          }
          return;
        }

        const loaded = await loadReflections({
          accessToken,
          authEnabled: useAccountPersistence,
          localOnly: isGuestMode,
          userId,
        });
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
  }, [accessToken, isGuestMode, shouldLoadReflections, useAccountPersistence, userId]);

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

  useLayoutEffect(() => {
    if (currentView !== 'value') return;

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();
    const frameId = window.requestAnimationFrame(scrollToTop);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [currentView, location.pathname]);

  const enterApp = (href: string) => {
    markLandingSeen();
    navigate(href);
  };

  const chooseEntryMode = (mode: EntryMode) => {
    setEntryMode(mode);
    setEntryModeState(mode);
    markLandingSeen();
  };

  const handleSelectValue = (name: string) => {
    setSelectedValueName(name);
  };

  const handleToggleFavorite = (valueName: string) => {
    setFavoriteValues((currentFavorites) =>
      currentFavorites.includes(valueName)
        ? currentFavorites.filter((name) => name !== valueName)
        : [...currentFavorites, valueName]
    );
  };

  const handleFilterCategory = (category: string) => {
    const params = new URLSearchParams();
    params.set('category', category);
    enterApp(`/guide?${params.toString()}`);
  };

  const handleFilterTag = (tag: string) => {
    const params = new URLSearchParams();
    params.set('tag', tag);
    enterApp(`/guide?${params.toString()}`);
  };

  const handleStartPractice = (valueName: string) => {
    setSelectedValueName(valueName);
    enterApp(`/practice/${slugifyValueName(valueName)}`);
  };

  const handleOpenValue = (valueName: string) => {
    setSelectedValueName(valueName);
    enterApp(`/guide/${slugifyValueName(valueName)}`);
  };

  const requestSignIn = () => {
    if (!authEnabled) {
      pushToast('Authentication is not configured for this environment.', 'error');
      return;
    }

    chooseEntryMode('account');
    setIsAuthDialogOpen(true);
    emitEvent('sign_in_requested', { from: currentView });
  };

  const handleContinueAsGuest = () => {
    chooseEntryMode('guest');
    emitEvent('guest_mode_selected');
    navigate('/guide');
  };

  const handleSendMagicLink = async (email: string) => {
    setIsSendingMagicLink(true);
    try {
      await sendMagicLink(email, `${window.location.origin}/guide`);
      setIsAuthDialogOpen(false);
      emitEvent('magic_link_requested');
      pushToast(`Magic link sent to ${email}.`, 'success');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Unable to send magic link.', 'error');
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      chooseEntryMode('guest');
      navigate('/guide');
      emitEvent('signed_out');
      pushToast('Signed out.', 'success');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Unable to sign out.', 'error');
    }
  };

  const handleAddReflection = (entry: Omit<ReflectionEntry, 'id' | 'date'>) => {
    if (useAccountPersistence && !session) {
      requestSignIn();
      pushToast('Sign in to save account-backed field notes.', 'error');
      return;
    }

    const previous = reflections;
    const isDailyQuickReflection = entry.practiceTitle === DAILY_QUICK_REFLECTION_TITLE;
    let nextReflections: ReflectionEntry[] = [];

    if (isDailyQuickReflection) {
      const dailyEntries = findDailyQuickReflectionEntries(previous, entry.value);
      const latestDailyEntry = dailyEntries[0];
      const dailyEntryIds = new Set(dailyEntries.map((reflection) => reflection.id));
      const nextDailyEntry: ReflectionEntry = {
        id: latestDailyEntry?.id || `reflection_${Date.now()}`,
        date: new Date().toISOString(),
        value: entry.value,
        practiceTitle: DAILY_QUICK_REFLECTION_TITLE,
        note: entry.note,
      };

      const unchanged =
        dailyEntries.length === 1 &&
        latestDailyEntry?.note === nextDailyEntry.note &&
        latestDailyEntry.practiceTitle === nextDailyEntry.practiceTitle;

      if (unchanged) {
        enterApp('/notes');
        return;
      }

      nextReflections = [nextDailyEntry, ...previous.filter((reflection) => !dailyEntryIds.has(reflection.id))];
    } else {
      const newReflection: ReflectionEntry = {
        id: `reflection_${Date.now()}`,
        date: new Date().toISOString(),
        ...entry,
      };
      nextReflections = [newReflection, ...previous];
    }

    nextReflections.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
    setReflections(nextReflections);
    enterApp('/notes');

    void saveReflections({ accessToken, authEnabled: useAccountPersistence, localOnly: isGuestMode, userId }, nextReflections)
      .then(() =>
        emitEvent('reflection_saved', {
          mode: isGuestMode ? 'guest' : 'account',
          value: entry.value,
          practiceTitle: entry.practiceTitle,
        })
      )
      .catch((error) => {
        setReflections(previous);
        pushToast(error instanceof Error ? error.message : 'Unable to save field note.', 'error');
      });
  };

  const handleUpdateReflection = (reflectionId: string, updates: Pick<ReflectionEntry, 'note' | 'practiceTitle'>) => {
    if (useAccountPersistence && !session) {
      requestSignIn();
      pushToast('Sign in to revise account-backed field notes.', 'error');
      return;
    }

    const previous = reflections;
    const nextReflections = previous.map((entry) => (entry.id === reflectionId ? { ...entry, ...updates } : entry));
    setReflections(nextReflections);

    void saveReflections({ accessToken, authEnabled: useAccountPersistence, localOnly: isGuestMode, userId }, nextReflections)
      .then(() => {
        pushToast('Field note updated.', 'success');
        emitEvent('reflection_updated', {
          mode: isGuestMode ? 'guest' : 'account',
          reflectionId,
        });
      })
      .catch((error) => {
        setReflections(previous);
        pushToast(error instanceof Error ? error.message : 'Unable to update field note.', 'error');
      });
  };

  const handleDeleteReflection = (reflectionId: string) => {
    if (useAccountPersistence && !session) {
      requestSignIn();
      pushToast('Sign in to remove account-backed field notes.', 'error');
      return;
    }

    const previous = reflections;
    const nextReflections = previous.filter((entry) => entry.id !== reflectionId);
    setReflections(nextReflections);

    void saveReflections({ accessToken, authEnabled: useAccountPersistence, localOnly: isGuestMode, userId }, nextReflections)
      .then(() => {
        pushToast('Field note removed.', 'success');
        emitEvent('reflection_deleted', {
          mode: isGuestMode ? 'guest' : 'account',
          reflectionId,
        });
      })
      .catch((error) => {
        setReflections(previous);
        pushToast(error instanceof Error ? error.message : 'Unable to remove field note.', 'error');
      });
  };

  const handleDismissClaimableGuestNotes = () => {
    setClaimableGuestReflections([]);
  };

  const handleClaimGuestNotes = async () => {
    if (!session || !claimableGuestReflections.length) return;

    setIsClaimingGuestNotes(true);
    const merged = [...reflections];
    const seenIds = new Set(merged.map((entry) => entry.id));

    for (const guestEntry of claimableGuestReflections) {
      if (!seenIds.has(guestEntry.id)) {
        merged.push(guestEntry);
        seenIds.add(guestEntry.id);
      }
    }

    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    try {
      await saveReflections({ accessToken, authEnabled: true, localOnly: false, userId }, merged);
      clearLocalReflections(anonymousUserId);
      setClaimableGuestReflections([]);
      setReflections(merged);
      emitEvent('guest_notes_claimed', { count: claimableGuestReflections.length });
      pushToast('Guest field notes moved into your account.', 'success');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Unable to claim guest field notes.', 'error');
    } finally {
      setIsClaimingGuestNotes(false);
    }
  };

  const renderRoute = () => {
    if (currentView === 'landing') {
      return (
        <LandingView
          authConfigured={authEnabled}
          valueCount={values.length}
          onContinueAsGuest={handleContinueAsGuest}
          onEnterFieldGuide={() => enterApp('/guide')}
          onSignIn={requestSignIn}
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

    if (isLoadingValues || isLoadingReflections || isLoadingAuth) {
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

    if (currentView === 'value') {
      return selectedValue ? (
        <ValueDetailView
          value={selectedValue}
          values={values}
          favoriteValues={favoriteValues}
          onFilterCategory={handleFilterCategory}
          onFilterTag={handleFilterTag}
          onBack={() => navigate('/guide')}
          onOpenValue={handleOpenValue}
          onStartPractice={handleStartPractice}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : null;
    }

    if (currentView === 'practice') {
      return (
        <PracticeView
          selectedValue={selectedValue}
          values={values}
          reflections={reflections}
          authConfigured={authEnabled}
          isGuestMode={isGuestMode}
          isAuthenticated={Boolean(session)}
          isLoadingReflections={isLoadingReflections}
          userId={userId}
          onSelectValue={(name) => {
            handleSelectValue(name);
            handleStartPractice(name);
          }}
          onAddReflection={handleAddReflection}
          onRequestSignIn={requestSignIn}
        />
      );
    }

    if (currentView === 'history') {
      return (
        <HistoryView
          authConfigured={authEnabled}
          favoriteValues={favoriteValues}
          isGuestMode={isGuestMode}
          isAuthenticated={Boolean(session)}
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
          onRequestSignIn={requestSignIn}
        />
      );
    }

    if (currentView === 'debug') {
      return (
        <AnalyticsDebugView
          error={analyticsError}
          events={analyticsDebug.events}
          hasAdminAccess={!authEnabled ? false : hasAdminAccess}
          isAuthenticated={!authEnabled || Boolean(session)}
          isLoading={isLoadingAnalytics || isCheckingAdminAccess}
          onRefresh={refreshAnalyticsDebug}
          summary={analyticsDebug.summary}
          windowHours={analyticsDebug.windowHours}
        />
      );
    }

    return (
      <ValuesLibraryView
        values={values}
        favoriteValues={favoriteValues}
        onOpenValue={handleOpenValue}
        onStartPractice={handleStartPractice}
        onToggleFavorite={handleToggleFavorite}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] text-[#1e1b18]">
      <header className="sticky top-0 z-50 border-b border-[#efe6df] bg-[rgba(255,248,243,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => enterApp('/guide')}
            className="flex min-w-0 flex-col text-left transition-opacity hover:opacity-80"
            aria-label="Go to Field Guide homepage"
          >
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black tracking-[-0.05em] text-[#35680e]">Values in the Wild</span>
            <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8a7668]">Field guide to lived values</span>
          </button>

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

          {authEnabled ? (
            <div className="flex items-center gap-2">
              {session && hasAdminAccess && (
                <button
                  onClick={() => enterApp('/debug/analytics')}
                  className={`hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors lg:inline-flex ${
                    currentView === 'debug' ? 'bg-[#35680e] text-white' : 'bg-[#f1ebe5] text-[#35680e] hover:bg-[#e5ddd6]'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Debug
                </button>
              )}
              {!session && isGuestMode && (
                <div className="hidden rounded-full bg-[#f1ebe5] px-4 py-2 text-sm font-semibold text-[#85786e] sm:inline-flex">
                  Guest mode
                </div>
              )}
              <button
                onClick={session ? handleSignOut : requestSignIn}
                className="inline-flex items-center gap-2 rounded-full bg-[#f1ebe5] px-4 py-2 text-sm font-semibold text-[#35680e] transition-colors hover:bg-[#e5ddd6]"
              >
                <UserCircle2 className="h-5 w-5" />
                {session ? 'Sign out' : 'Sign in'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f1ebe5] px-4 py-2 text-sm font-semibold text-[#85786e]">
                <UserCircle2 className="h-5 w-5" />
                Local mode
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-28 pt-8 sm:px-6 md:px-8 md:pb-16 md:pt-10">
        <Suspense fallback={<RouteSuspenseFallback />}>{renderRoute()}</Suspense>
      </main>

      {!!session && !!claimableGuestReflections.length && (
        <div className="mx-auto -mt-20 mb-10 max-w-7xl px-5 sm:px-6 md:px-8">
          <section className="rounded-[2rem] border border-[#dce7d2] bg-[#f6fbf2] p-5 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">Claim guest notes</p>
                <p className="mt-2 text-sm leading-6 text-[#4d5b43]">
                  You have {claimableGuestReflections.length} guest field note{claimableGuestReflections.length === 1 ? '' : 's'} on this browser.
                  Move them into your account to keep everything in one history.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDismissClaimableGuestNotes}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#35680e] shadow-[0_14px_30px_rgba(41,33,27,0.04)]"
                >
                  Keep separate
                </button>
                <button
                  onClick={handleClaimGuestNotes}
                  disabled={isClaimingGuestNotes}
                  className="rounded-full bg-[#35680e] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)] disabled:cursor-not-allowed disabled:bg-[#c9d7bc]"
                >
                  {isClaimingGuestNotes ? 'Moving notes…' : 'Move into account'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

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

      <Suspense fallback={null}>
        <AuthDialog
          isOpen={isAuthDialogOpen}
          isSubmitting={isSendingMagicLink}
          onClose={() => setIsAuthDialogOpen(false)}
          onSubmit={handleSendMagicLink}
        />
      </Suspense>
    </div>
  );
};

export default App;
