import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ExternalLink, Loader2, LogOut, MessageSquareMore, SwatchBook, UserCircle2 } from 'lucide-react';

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

interface SectionToggleProps {
  id: SectionId;
  isExpanded: boolean;
  label: string;
  onToggle: (id: SectionId) => void;
}

const SectionToggle: React.FC<SectionToggleProps> = ({ id, isExpanded, label, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(id)}
    className="flex w-full items-center justify-between rounded-[1.2rem] border border-[var(--app-border)] bg-white px-4 py-3 text-left transition hover:border-[var(--app-border-hover)] hover:bg-[var(--app-surface-elevated)]"
    aria-expanded={isExpanded}
  >
    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-accent)]">{label}</span>
    <ChevronDown className={`h-4 w-4 text-[var(--app-text-subtle)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
  </button>
);

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
  const [expandedSections, setExpandedSections] = useState<Record<SectionId, boolean>>({
    palette: true,
    about: false,
    profile: false,
  });
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  const profileStatus = !authEnabled
    ? 'Local mode'
    : isAuthenticated
      ? sessionEmail || 'Signed in'
      : rememberedEmail || (isGuestMode ? 'Guest mode' : 'Signed out');

  const authActionLabel = !authEnabled ? 'Local mode' : isAuthenticated ? 'Sign out' : rememberedEmail ? 'Use saved email' : 'Sign in';
  const authActionIcon = !authEnabled ? UserCircle2 : isAuthenticated ? LogOut : UserCircle2;
  const AuthActionIcon = authActionIcon;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
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

      <div
        className={`absolute right-0 top-full z-[70] mt-3 w-[min(25rem,calc(100vw-2rem))] origin-top-right transition duration-200 ${
          isOpen ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_24px_48px_var(--app-shadow-soft-strong)] backdrop-blur-xl">
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-[var(--app-border-muted)] pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-accent)]">Settings</p>
              <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">Slide through theme, context, and account tools from one place.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-[var(--app-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-subtle)] transition hover:bg-[var(--app-surface-muted-hover)]"
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-3">
              <SectionToggle id="palette" isExpanded={expandedSections.palette} label="Palette" onToggle={toggleSection} />
              {expandedSections.palette && (
                <div className="space-y-2 rounded-[1.4rem] bg-[var(--app-surface-elevated)] p-3">
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
            </div>

            <div className="space-y-3">
              <SectionToggle id="about" isExpanded={expandedSections.about} label="About" onToggle={toggleSection} />
              {expandedSections.about && (
                <div className="space-y-2 rounded-[1.4rem] bg-[var(--app-surface-elevated)] p-3">
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
            </div>

            <div className="space-y-3">
              <SectionToggle id="profile" isExpanded={expandedSections.profile} label="Profile" onToggle={toggleSection} />
              {expandedSections.profile && (
                <div className="space-y-3 rounded-[1.4rem] bg-[var(--app-surface-elevated)] p-3">
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
          </div>

          <div className="mt-4 border-t border-[var(--app-border-muted)] pt-4">
            <button
              type="button"
              onClick={isAuthenticated ? onSignOut : onRequestSignIn}
              disabled={isLoadingAuth || !authEnabled}
              className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                authEnabled
                  ? 'bg-[var(--app-surface-muted)] text-[var(--app-text-accent)] hover:bg-[var(--app-surface-muted-hover)] disabled:cursor-wait disabled:opacity-70'
                  : 'cursor-default bg-[var(--app-surface-accent-soft)] text-[var(--app-text-accent)]'
              }`}
            >
              {isLoadingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : <AuthActionIcon className="h-4 w-4" />}
              {isLoadingAuth ? 'Checking…' : authActionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
