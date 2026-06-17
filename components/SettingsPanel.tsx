import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ExternalLink, Loader2, LogOut, MessageSquareMore, SwatchBook, UserCircle2 } from './icons';

interface PaletteOption {
  id: string;
  label: string;
  shortLabel: string;
  swatches: [string, string, string];
}

interface SettingsPanelProps {
  activePalette: string;
  authEnabled: boolean;
  currentPath: string;
  hasAdminAccess: boolean;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  isLoadingAuth: boolean;
  onNavigateFeedback: () => void;
  onNavigateWhyValues: () => void;
  onOpenDebug: () => void;
  onPaletteChange: (paletteId: string) => void;
  onRequestSignIn: () => void;
  onSignOut: () => void;
  paletteOptions: PaletteOption[];
  rememberedEmail?: string | null;
  sessionEmail?: string | null;
}

type SectionId = 'palette' | 'about' | 'profile';

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  activePalette,
  authEnabled,
  currentPath,
  hasAdminAccess,
  isAuthenticated,
  isGuestMode,
  isLoadingAuth,
  onNavigateFeedback,
  onNavigateWhyValues,
  onOpenDebug,
  onPaletteChange,
  onRequestSignIn,
  onSignOut,
  paletteOptions,
  rememberedEmail,
  sessionEmail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsOpen(false);
    setActiveSection(null);
  }, [currentPath]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSection(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setActiveSection(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCloseSettings = () => {
    setIsOpen(false);
    setActiveSection(null);
  };

  const handleToggleSettings = () => {
    setIsOpen((current) => {
      const nextOpen = !current;
      if (!nextOpen) {
        setActiveSection(null);
      }
      return nextOpen;
    });
  };

  const handleToggleSection = (sectionId: SectionId) => {
    if (!isOpen) {
      setIsOpen(true);
      setActiveSection(sectionId);
      return;
    }

    setActiveSection((current) => (current === sectionId ? null : sectionId));
  };

  const profileStatus = !authEnabled
    ? 'Local mode'
    : isAuthenticated
      ? sessionEmail || 'Signed in'
      : rememberedEmail || (isGuestMode ? 'Guest mode' : 'Signed out');

  const authActionLabel = !authEnabled ? 'Local mode' : isAuthenticated ? 'Sign out' : rememberedEmail ? 'Use saved email' : 'Sign in';
  const authActionIcon = !authEnabled ? UserCircle2 : isAuthenticated ? LogOut : UserCircle2;
  const AuthActionIcon = authActionIcon;

  const renderSectionContent = (tone: 'desktop' | 'mobile') => {
    if (!activeSection) return null;

    const panelClass =
      tone === 'mobile'
        ? 'space-y-3 rounded-[1.6rem] border border-[var(--app-border)] bg-white/90 p-4 shadow-[0_18px_42px_var(--app-shadow-soft-strong)] backdrop-blur-xl'
        : 'w-[min(26rem,calc(100vw-2rem))] rounded-[1.8rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-[0_24px_48px_var(--app-shadow-soft-strong)] backdrop-blur-xl';
    const innerClass =
      tone === 'mobile'
        ? 'space-y-3 rounded-[1.2rem] bg-[var(--app-surface-elevated)] p-3'
        : 'space-y-2 rounded-[1.4rem] bg-[var(--app-surface-elevated)] p-3';

    return (
      <div className={panelClass}>
        {activeSection === 'palette' && (
          <div className={innerClass}>
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-subtle)]">Palette</p>
            {paletteOptions.map((palette) => {
              const isActive = palette.id === activePalette;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => onPaletteChange(palette.id)}
                  className={`flex w-full items-center gap-3 rounded-[1.1rem] border px-3 py-3 text-left transition ${
                    isActive
                      ? 'border-[var(--app-border-accent)] bg-white shadow-[0_12px_24px_var(--app-shadow-accent-soft)]'
                      : 'border-transparent bg-transparent hover:border-[var(--app-border)] hover:bg-white'
                  }`}
                >
                  <span className="flex gap-1.5" aria-hidden="true">
                    {palette.swatches.map((swatch) => (
                      <span
                        key={swatch}
                        className="h-6 w-6 rounded-full border border-white/80 shadow-[0_3px_10px_rgba(0,0,0,0.08)]"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--app-text)]">{palette.label}</span>
                    <span className="block text-xs uppercase tracking-[0.18em] text-[var(--app-text-subtle)]">{palette.shortLabel}</span>
                  </span>
                  <Check className={`h-4 w-4 text-[var(--app-text-accent)] ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>
        )}

        {activeSection === 'about' && (
          <div className={innerClass}>
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-subtle)]">About</p>
            <button
              type="button"
              onClick={onNavigateWhyValues}
              className={`flex w-full items-center justify-between rounded-[1.1rem] border px-3 py-3 text-left transition ${
                currentPath === '/about'
                  ? 'border-[var(--app-border-accent)] bg-white text-[var(--app-text-accent)]'
                  : 'border-transparent bg-transparent text-[var(--app-text)] hover:border-[var(--app-border)] hover:bg-white'
              }`}
            >
              <span>
                <span className="block text-sm font-semibold">Why Values</span>
                <span className="block text-xs text-[var(--app-text-subtle)]">A short page on the point of the project.</span>
              </span>
              <ChevronDown className="-rotate-90 h-4 w-4" />
            </button>

            <a
              href="https://github.com/HelloSimone91/Values-in-the-wild-"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-[1.1rem] border border-transparent px-3 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-border)] hover:bg-white"
            >
              <span>
                <span className="block">GitHub Repo</span>
                <span className="block text-xs font-normal text-[var(--app-text-subtle)]">Source, issues, and change history.</span>
              </span>
              <ExternalLink className="h-4 w-4 text-[var(--app-text-subtle)]" />
            </a>

            <button
              type="button"
              onClick={onNavigateFeedback}
              className={`flex w-full items-center justify-between rounded-[1.1rem] border px-3 py-3 text-left transition ${
                currentPath === '/feedback'
                  ? 'border-[var(--app-border-accent)] bg-white text-[var(--app-text-accent)]'
                  : 'border-transparent bg-transparent text-[var(--app-text)] hover:border-[var(--app-border)] hover:bg-white'
              }`}
            >
              <span>
                <span className="block text-sm font-semibold">Feedback</span>
                <span className="block text-xs text-[var(--app-text-subtle)]">Send a note directly from the app.</span>
              </span>
              <MessageSquareMore className="h-4 w-4 text-[var(--app-text-subtle)]" />
            </button>
          </div>
        )}

        {activeSection === 'profile' && (
          <div className={tone === 'mobile' ? 'space-y-3 rounded-[1.2rem] bg-[var(--app-surface-elevated)] p-3' : 'space-y-3 rounded-[1.4rem] bg-[var(--app-surface-elevated)] p-3'}>
            <div className="rounded-[1.1rem] border border-[var(--app-border)] bg-white px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--app-surface-accent-soft)] text-[var(--app-text-accent)]">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-subtle)]">Current mode</p>
                  <p className="truncate text-sm font-semibold text-[var(--app-text)]">{profileStatus}</p>
                </div>
              </div>
            </div>

            {hasAdminAccess ? (
              <button
                type="button"
                onClick={onOpenDebug}
                className="flex w-full items-center justify-between rounded-[1.1rem] border border-transparent px-3 py-3 text-left text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-border)] hover:bg-white"
              >
                <span>
                  <span className="block">Debug</span>
                  <span className="block text-xs font-normal text-[var(--app-text-subtle)]">Analytics and instrumentation checks.</span>
                </span>
                <SwatchBook className="h-4 w-4 text-[var(--app-text-subtle)]" />
              </button>
            ) : (
              <p className="rounded-[1.1rem] border border-dashed border-[var(--app-border)] px-3 py-3 text-sm leading-6 text-[var(--app-text-muted)]">
                Debug stays here for now. It only appears for signed-in admin accounts.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={panelRef} className="relative">
      {isOpen && <div className="fixed inset-0 z-[65] bg-[rgba(17,24,39,0.08)] backdrop-blur-[2px] md:hidden" onClick={handleCloseSettings} />}

      <div className="absolute right-0 top-0 z-[70] hidden flex-col items-end gap-3 md:flex">
        <div className="flex items-center justify-end gap-2">
          <div
            className={`flex max-w-[calc(100vw-9rem)] items-center gap-2 overflow-hidden transition-all duration-300 ${
              isOpen ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-8 opacity-0 max-w-0'
            }`}
            aria-hidden={!isOpen}
          >
            <button
              type="button"
              onClick={() => handleToggleSection('palette')}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition ${
                activeSection === 'palette'
                  ? 'border-[var(--app-border-accent)] bg-white text-[var(--app-text-accent)] shadow-[0_12px_24px_var(--app-shadow-accent-soft)]'
                  : 'border-[var(--app-border)] bg-white text-[var(--app-text-accent)] hover:border-[var(--app-border-hover)] hover:bg-[var(--app-surface-elevated)]'
              }`}
              aria-expanded={activeSection === 'palette'}
            >
              Palette
              <ChevronDown className={`h-4 w-4 transition-transform ${activeSection === 'palette' ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => handleToggleSection('about')}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition ${
                activeSection === 'about'
                  ? 'border-[var(--app-border-accent)] bg-white text-[var(--app-text-accent)] shadow-[0_12px_24px_var(--app-shadow-accent-soft)]'
                  : 'border-[var(--app-border)] bg-white text-[var(--app-text-accent)] hover:border-[var(--app-border-hover)] hover:bg-[var(--app-surface-elevated)]'
              }`}
              aria-expanded={activeSection === 'about'}
            >
              About
              <ChevronDown className={`h-4 w-4 transition-transform ${activeSection === 'about' ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => handleToggleSection('profile')}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition ${
                activeSection === 'profile'
                  ? 'border-[var(--app-border-accent)] bg-white text-[var(--app-text-accent)] shadow-[0_12px_24px_var(--app-shadow-accent-soft)]'
                  : 'border-[var(--app-border)] bg-white text-[var(--app-text-accent)] hover:border-[var(--app-border-hover)] hover:bg-[var(--app-surface-elevated)]'
              }`}
              aria-expanded={activeSection === 'profile'}
            >
              Profile
              <ChevronDown className={`h-4 w-4 transition-transform ${activeSection === 'profile' ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={isAuthenticated ? onSignOut : onRequestSignIn}
              disabled={isLoadingAuth || !authEnabled}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition ${
                authEnabled
                  ? 'border-[var(--app-border)] bg-white text-[var(--app-text-accent)] hover:border-[var(--app-border-hover)] hover:bg-[var(--app-surface-elevated)] disabled:cursor-wait disabled:opacity-70'
                  : 'border-[var(--app-border)] bg-[var(--app-surface-accent-soft)] text-[var(--app-text-accent)]'
              }`}
            >
              {isLoadingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : <AuthActionIcon className="h-4 w-4" />}
              <span>{authActionLabel}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleSettings}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition ${
              isOpen
                ? 'border-[var(--app-border-accent)] bg-[var(--app-accent)] text-[var(--app-text-on-accent)] shadow-[0_16px_28px_var(--app-shadow-accent)]'
                : 'border-[var(--app-border)] bg-white text-[var(--app-text-accent)] hover:border-[var(--app-border-hover)] hover:bg-[var(--app-surface-elevated)]'
            }`}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
          >
            <span aria-hidden="true">⚙</span>
            <span>Settings</span>
          </button>
        </div>

        {isOpen && renderSectionContent('desktop')}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={handleToggleSettings}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition ${
            isOpen
              ? 'border-[var(--app-border-accent)] bg-[var(--app-accent)] text-[var(--app-text-on-accent)] shadow-[0_16px_28px_var(--app-shadow-accent)]'
              : 'border-[var(--app-border)] bg-white text-[var(--app-text-accent)] hover:border-[var(--app-border-hover)] hover:bg-[var(--app-surface-elevated)]'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <span aria-hidden="true">⚙</span>
          <span>Settings</span>
        </button>

        {isOpen && (
          <div className="fixed inset-x-3 top-[4.9rem] z-[70]">
            <div className="rounded-[1.9rem] border border-[var(--app-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,250,247,0.96))] p-4 shadow-[0_26px_60px_var(--app-shadow-soft-strong)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-accent)]">Settings</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                    Theme, context, and account controls tuned for touch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseSettings}
                  className="rounded-full bg-[var(--app-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-subtle)]"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 rounded-[1.5rem] bg-[var(--app-surface-elevated)] p-2">
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => handleToggleSection('palette')}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      activeSection === 'palette'
                        ? 'bg-[var(--app-accent)] text-[var(--app-text-on-accent)] shadow-[0_12px_24px_var(--app-shadow-accent)]'
                        : 'bg-white text-[var(--app-text-accent)]'
                    }`}
                  >
                    Palette
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSection('about')}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      activeSection === 'about'
                        ? 'bg-[var(--app-accent)] text-[var(--app-text-on-accent)] shadow-[0_12px_24px_var(--app-shadow-accent)]'
                        : 'bg-white text-[var(--app-text-accent)]'
                    }`}
                  >
                    About
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSection('profile')}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      activeSection === 'profile'
                        ? 'bg-[var(--app-accent)] text-[var(--app-text-on-accent)] shadow-[0_12px_24px_var(--app-shadow-accent)]'
                        : 'bg-white text-[var(--app-text-accent)]'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={isAuthenticated ? onSignOut : onRequestSignIn}
                    disabled={isLoadingAuth || !authEnabled}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      authEnabled
                        ? 'bg-white text-[var(--app-text-accent)] disabled:opacity-70'
                        : 'bg-[var(--app-surface-accent-soft)] text-[var(--app-text-accent)]'
                    }`}
                  >
                    {isLoadingAuth ? 'Checking' : authActionLabel}
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-[1.4rem] border border-[var(--app-border)] bg-white/70 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--app-text-subtle)]">Current mode</p>
                <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">{profileStatus}</p>
              </div>

              {activeSection ? <div className="mt-4">{renderSectionContent('mobile')}</div> : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
