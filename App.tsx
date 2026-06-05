import React, { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, CheckCircle2, History, LibraryBig, Loader2, TriangleAlert, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { clearLocalReflections, loadLocalReflections, loadReflections, saveReflections } from './services/reflectionPersistenceService';
import { DAILY_QUICK_REFLECTION_TITLE, findDailyQuickReflectionEntries } from './services/dailyQuickReflectionService';
import { getCurrentSession, getSupabaseClient, isSupabaseConfigured, sendMagicLink, signOutUser, startGoogleSignIn } from './services/supabaseClient';
import {
  clearRememberedAuthEmail,
  EntryMode,
  getEntryMode,
  getOrCreateUserId,
  getRememberedAuthEmail,
  hasSeenLanding,
  markLandingSeen,
  rememberAuthEmail,
  setEntryMode,
} from './services/userSessionService';
import { trackEvent } from './services/analyticsService';
import { loadAdminAccess } from './services/adminAccessService';
import { AnalyticsDebugPayload, loadAnalyticsDebug } from './services/analyticsDebugService';
import SettingsPanel from './components/SettingsPanel';
import { submitFeedback } from './services/feedbackService';
import { loadValueBySlug, loadValueSummaries } from './services/valueCatalogService';
import { findValueBySlug, slugifyValueName } from './valueCore';
import type { ReflectionEntry, ValueDefinition } from './valueTypes';

type ToastTone = 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

type ColorPaletteId = 'field-guide-original' | 'cyber-acid' | 'mocha-mousse' | 'electric-lavender' | 'rosewood-earth';

interface ColorPaletteOption {
  id: ColorPaletteId;
  label: string;
  shortLabel: string;
  swatches: [string, string, string];
}

const LandingView = lazy(() => import('./components/LandingView'));
const ValueDetailView = lazy(() => import('./components/ValueDetailView'));
const PracticeView = lazy(() => import('./components/PracticeView'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const ValuesLibraryView = lazy(() => import('./components/ValuesLibraryView'));
const AnalyticsDebugView = lazy(() => import('./components/AnalyticsDebugView'));
const AuthDialog = lazy(() => import('./components/AuthDialog'));
const WhyValuesView = lazy(() => import('./components/WhyValuesView'));
const FeedbackView = lazy(() => import('./components/FeedbackView'));

const COLOR_PALETTE_STORAGE_KEY = 'values-in-the-wild:color-palette';
const DEFAULT_COLOR_PALETTE: ColorPaletteId = 'field-guide-original';
const COLOR_PALETTES: ColorPaletteOption[] = [
  {
    id: 'field-guide-original',
    label: 'Field Guide Original',
    shortLabel: 'Original',
    swatches: ['#35680e', '#ff8000', '#4f457f'],
  },
  {
    id: 'cyber-acid',
    label: 'Cyber Acid',
    shortLabel: 'Acid',
    swatches: ['#b8bf1a', '#c5f143', '#811672'],
  },
  {
    id: 'mocha-mousse',
    label: 'Mocha Mousse',
    shortLabel: 'Mocha',
    swatches: ['#a47b64', '#9e7a4d', '#d6beeb'],
  },
  {
    id: 'electric-lavender',
    label: 'Electric Lavender',
    shortLabel: 'Lavender',
    swatches: ['#a78bfa', '#4f46e5', '#80ff2a'],
  },
  {
    id: 'rosewood-earth',
    label: 'Rosewood Earth',
    shortLabel: 'Rosewood',
    swatches: ['#8a5071', '#934823', '#636b5f'],
  },
];

const isColorPaletteId = (value: string | null): value is ColorPaletteId =>
  COLOR_PALETTES.some((palette) => palette.id === value);

const RouteSuspenseFallback: React.FC = () => (
  <div className="flex min-h-[50vh] items-center justify-center animate-in fade-in duration-500">
    <div className="inline-flex items-center gap-3 rounded-full bg-[#f1ebe5] px-5 py-3 text-sm font-semibold text-[#6f6258]">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading the Values in the Wild field guide
    </div>
  </div>
);

const App: React.FC = () => {
  const FAVORITES_STORAGE_KEY = 'values-in-the-wild:favorites';
  const location = useLocation();
  const navigate = useNavigate();
  const [activePalette, setActivePalette] = useState<ColorPaletteId>(() => {
    if (typeof window === 'undefined') return DEFAULT_COLOR_PALETTE;

    try {
      const storedPalette = window.localStorage.getItem(COLOR_PALETTE_STORAGE_KEY);
      return isColorPaletteId(storedPalette) ? storedPalette : DEFAULT_COLOR_PALETTE;
    } catch {
      return DEFAULT_COLOR_PALETTE;
    }
  });

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
  const [isLoadingSelectedValue, setIsLoadingSelectedValue] = useState(false);
  const [isLoadingReflections, setIsLoadingReflections] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(isSupabaseConfigured());
  const [valuesError, setValuesError] = useState<string | null>(null);
  const [selectedValueError, setSelectedValueError] = useState<string | null>(null);
  const [reflectionsError, setReflectionsError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [isStartingGoogleSignIn, setIsStartingGoogleSignIn] = useState(false);
  const [claimableGuestReflections, setClaimableGuestReflections] = useState<ReflectionEntry[]>([]);
  const [isClaimingGuestNotes, setIsClaimingGuestNotes] = useState(false);
  const [valueDetailsBySlug, setValueDetailsBySlug] = useState<Record<string, ValueDefinition>>({});
  const [analyticsDebug, setAnalyticsDebug] = useState<AnalyticsDebugPayload>({ events: [], summary: [], windowHours: 168 });
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isCheckingAdminAccess, setIsCheckingAdminAccess] = useState(false);
  const [anonymousUserId] = useState(() => getOrCreateUserId());
  const [entryMode, setEntryModeState] = useState<EntryMode | null>(() => getEntryMode());
  const [rememberedEmail, setRememberedEmailState] = useState<string | null>(() => getRememberedAuthEmail());
  const previousSessionUserId = useRef<string | null>(null);

  const authEnabled = isSupabaseConfigured();
  const effectiveEntryMode: EntryMode = !authEnabled ? 'guest' : session ? 'account' : entryMode || 'guest';
  const isGuestMode = effectiveEntryMode === 'guest';
  const useAccountPersistence = authEnabled && effectiveEntryMode === 'account' && Boolean(session);
  const userId = session?.user.id || anonymousUserId;
  const accessToken = session?.access_token || null;

  const guideMatch = matchPath('/guide/:valueSlug', location.pathname);
  const practiceMatch = matchPath('/practice/:valueSlug', location.pathname);
  const isBlankPracticeRoute = location.pathname === '/practice';
  const routeValueSlug = guideMatch?.params.valueSlug || practiceMatch?.params.valueSlug || null;
  const isAnalyticsDebugRoute = location.pathname === '/debug/analytics';

  const currentView = useMemo(() => {
    if (location.pathname === '/') return 'landing';
    if (location.pathname === '/about') return 'about';
    if (location.pathname === '/feedback') return 'feedback';
    if (location.pathname === '/guide' || guideMatch) return guideMatch ? 'value' : 'library';
    if (practiceMatch || isBlankPracticeRoute) return 'practice';
    if (location.pathname === '/notes') return 'history';
    if (isAnalyticsDebugRoute) return 'debug';
    return 'library';
  }, [guideMatch, isAnalyticsDebugRoute, isBlankPracticeRoute, location.pathname, practiceMatch]);
  const shouldLoadValues = currentView === 'library' || currentView === 'value' || currentView === 'practice' || currentView === 'history';
  const shouldLoadReflections = currentView === 'practice' || currentView === 'history';
  const selectedValueSlug = routeValueSlug || (selectedValueName ? slugifyValueName(selectedValueName) : null);
  const shouldLoadSelectedValue = (currentView === 'value' || currentView === 'practice') && Boolean(selectedValueSlug);

  const selectedValueSummary = useMemo(() => {
    if (routeValueSlug) {
      return findValueBySlug(values, routeValueSlug) || null;
    }
    if (selectedValueName) {
      return values.find((value) => value.name === selectedValueName) || null;
    }
    if (currentView === 'practice' && isBlankPracticeRoute) {
      return null;
    }
    return values[0] || null;
  }, [currentView, isBlankPracticeRoute, routeValueSlug, selectedValueName, values]);
  const selectedValueDetail = selectedValueSlug ? valueDetailsBySlug[selectedValueSlug] || null : null;
  const routeSelectedValue = selectedValueDetail || selectedValueSummary;
  const selectedValue =
    currentView === 'value'
      ? selectedValueDetail
      : currentView === 'practice'
        ? routeSelectedValue
        : selectedValueSummary;

  const navItems: { label: string; icon: React.ComponentType<{ className?: string }>; href: string; active: boolean }[] = [
    { label: 'Field Guide', icon: LibraryBig, href: '/guide', active: currentView === 'library' || currentView === 'value' },
    {
      label: 'Practice',
      icon: BookOpenText,
      href: routeSelectedValue ? `/practice/${slugifyValueName(routeSelectedValue.name)}` : '/practice',
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

  const handlePaletteChange = (nextPalette: ColorPaletteId) => {
    setActivePalette(nextPalette);
    emitEvent('palette_changed', { palette: nextPalette });
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteValues));
    } catch {
      // Ignore storage failures so the guide still works in restricted browsers.
    }
  }, [favoriteValues]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLOR_PALETTE_STORAGE_KEY, activePalette);
    } catch {
      // Ignore storage failures so the theme still works in restricted browsers.
    }
  }, [activePalette]);

  useLayoutEffect(() => {
    document.documentElement.dataset.colorPalette = activePalette;
  }, [activePalette]);

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
    if (typeof window === 'undefined' || !window.location.hash) return;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const authError = hashParams.get('error_description') || hashParams.get('error');
    if (!authError) return;

    pushToast(authError, 'error');
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, []);

  useEffect(() => {
    const currentUserId = session?.user.id || null;
    if (currentUserId && previousSessionUserId.current !== currentUserId) {
      emitEvent('auth_signed_in');
    }
    previousSessionUserId.current = currentUserId;
  }, [session]);

  useEffect(() => {
    const email = session?.user.email?.trim();
    if (!email) return;

    rememberAuthEmail(email);
    setRememberedEmailState(email);
  }, [session?.user.email]);

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
        const loadedValues = await loadValueSummaries();

        if (cancelled) return;
        setValues(loadedValues);

        if (loadedValues.length && !selectedValueName && !isBlankPracticeRoute) {
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
  }, [isBlankPracticeRoute, selectedValueName, shouldLoadValues, values.length]);

  useEffect(() => {
    if (!shouldLoadSelectedValue || !selectedValueSlug) {
      setIsLoadingSelectedValue(false);
      setSelectedValueError(null);
      return;
    }

    if (valueDetailsBySlug[selectedValueSlug]) {
      setIsLoadingSelectedValue(false);
      setSelectedValueError(null);
      return;
    }

    let cancelled = false;

    const loadSelectedValue = async () => {
      setIsLoadingSelectedValue(true);
      setSelectedValueError(null);

      try {
        const loadedValue = await loadValueBySlug(selectedValueSlug);

        if (cancelled) return;

        if (loadedValue) {
          setValueDetailsBySlug((current) => ({
            ...current,
            [selectedValueSlug]: loadedValue,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setSelectedValueError(error instanceof Error ? error.message : 'Failed to load value details.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSelectedValue(false);
        }
      }
    };

    void loadSelectedValue();

    return () => {
      cancelled = true;
    };
  }, [selectedValueSlug, shouldLoadSelectedValue, valueDetailsBySlug]);

  useEffect(() => {
    if (!shouldLoadReflections) {
      setIsLoadingReflections(false);
      return;
    }

    if (authEnabled && isLoadingAuth) {
      setIsLoadingReflections(true);
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
  }, [accessToken, authEnabled, isGuestMode, isLoadingAuth, shouldLoadReflections, useAccountPersistence, userId]);

  useEffect(() => {
    if (location.pathname === '/' && hasSeenLanding()) {
      navigate('/guide', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!isLoadingValues && !isLoadingSelectedValue && routeValueSlug && !routeSelectedValue) {
      navigate('/guide', { replace: true });
    }
  }, [isLoadingSelectedValue, isLoadingValues, navigate, routeSelectedValue, routeValueSlug]);

  useEffect(() => {
    if (routeSelectedValue) {
      setSelectedValueName(routeSelectedValue.name);
    }
  }, [routeSelectedValue]);

  useLayoutEffect(() => {
    if (currentView !== 'value' && currentView !== 'practice') return;

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

  const handleOpenBlankPractice = () => {
    setSelectedValueName('');
    enterApp('/practice');
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
      emitEvent('magic_link_requested', { method: 'email' });
      pushToast(`Check ${email} for your sign-in email. If it takes a minute, check spam too.`, 'success');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Unable to send magic link.', 'error');
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsStartingGoogleSignIn(true);
    try {
      emitEvent('sign_in_requested', { from: currentView, method: 'google' });
      // Use a robust fallback for the redirect URL. Vercel sometimes has issues with window.location.origin on initial paints
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const redirectOrigin = isLocalhost ? window.location.origin : 'https://www.valuesinthewild.com';
      console.log('Starting Google Sign In with redirect to:', `${redirectOrigin}/guide`);
      await startGoogleSignIn(`${redirectOrigin}/guide`);
    } catch (error) {
      setIsStartingGoogleSignIn(false);
      pushToast(error instanceof Error ? error.message : 'Unable to start Google sign-in.', 'error');
    }
  };

  const handleForgetRememberedEmail = () => {
    clearRememberedAuthEmail();
    setRememberedEmailState(null);
    pushToast('Saved sign-in email cleared for this browser.', 'success');
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      chooseEntryMode('guest');
      navigate('/guide');
      emitEvent('signed_out');
      pushToast('Signed out on this browser.', 'success');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Unable to sign out.', 'error');
    }
  };

  const handleSubmitFeedback = async (message: string) => {
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        accessToken,
        anonymousId: session ? null : anonymousUserId,
        currentView,
        message,
        paletteId: activePalette,
        pathname: location.pathname,
        userEmail: session?.user.email || rememberedEmail,
      });
      emitEvent('feedback_submitted', { currentView, palette: activePalette });
      pushToast('Feedback received. Thank you.', 'success');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Unable to send feedback right now.', 'error');
      throw error;
    } finally {
      setIsSubmittingFeedback(false);
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
          rememberedEmail={rememberedEmail}
          valueCount={values.length}
          onContinueAsGuest={handleContinueAsGuest}
          onEnterFieldGuide={() => enterApp('/guide')}
          onSignIn={requestSignIn}
          onStartPractice={() => {
            if (routeSelectedValue) {
              handleStartPractice(routeSelectedValue.name);
            } else {
              enterApp('/guide');
            }
          }}
        />
      );
    }

    if (currentView === 'about') {
      return <WhyValuesView />;
    }

    if (currentView === 'feedback') {
      return (
        <FeedbackView
          isSubmitting={isSubmittingFeedback}
          onSubmit={handleSubmitFeedback}
          sessionEmail={session?.user.email || null}
        />
      );
    }

    const isWaitingForSelectedValue = shouldLoadSelectedValue && !selectedValue && !selectedValueError;
    const isCurrentViewLoading =
      (shouldLoadValues && isLoadingValues) ||
      (shouldLoadReflections && isLoadingReflections) ||
      (shouldLoadSelectedValue && isLoadingSelectedValue) ||
      isWaitingForSelectedValue;

    if (isCurrentViewLoading) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-[#f1ebe5] px-5 py-3 text-sm font-semibold text-[#6f6258]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading the Values in the Wild field guide
          </div>
        </div>
      );
    }

    if (valuesError || selectedValueError || reflectionsError) {
      return (
        <div className="rounded-[2rem] bg-[#fff1ef] p-8 text-[#93000a] shadow-[0_14px_30px_rgba(186,26,26,0.08)]">
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.03em]">Unable to load app data</h1>
          <p className="mt-3 text-sm leading-7">{valuesError || selectedValueError || reflectionsError}</p>
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
          onOpenPractice={(valueName?: string) => {
            if (valueName) {
              handleStartPractice(valueName);
              return;
            }

            handleOpenBlankPractice();
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
            <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8a7668]">Field guide to lived values</span>
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            <SettingsPanel
              activePalette={activePalette}
              authEnabled={authEnabled}
              currentPath={location.pathname}
              hasAdminAccess={Boolean(session) && hasAdminAccess}
              isAuthenticated={Boolean(session)}
              isGuestMode={isGuestMode}
              isLoadingAuth={isLoadingAuth}
              onNavigateFeedback={() => enterApp('/feedback')}
              onNavigateWhyValues={() => enterApp('/about')}
              onOpenDebug={() => enterApp('/debug/analytics')}
              onPaletteChange={(paletteId) => handlePaletteChange(paletteId as ColorPaletteId)}
              onRequestSignIn={requestSignIn}
              onSignOut={handleSignOut}
              paletteOptions={COLOR_PALETTES}
              rememberedEmail={rememberedEmail}
              sessionEmail={session?.user.email || null}
            />
          </div>
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
                <span className="mt-1 font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-[0.18em]">{item.label}</span>
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
          initialEmail={rememberedEmail || ''}
          isOpen={isAuthDialogOpen}
          isOAuthSubmitting={isStartingGoogleSignIn}
          isSubmitting={isSendingMagicLink}
          rememberedEmail={rememberedEmail}
          onClose={() => setIsAuthDialogOpen(false)}
          onForgetRememberedEmail={handleForgetRememberedEmail}
          onGoogleSignIn={handleGoogleSignIn}
          onSubmit={handleSendMagicLink}
        />
      </Suspense>
    </div>
  );
};

export default App;
