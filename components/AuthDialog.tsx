import React, { useEffect, useState } from 'react';
import { ArrowRight, Mail, X } from 'lucide-react';

interface AuthDialogProps {
  initialEmail?: string;
  isOpen: boolean;
  isOAuthSubmitting?: boolean;
  isSubmitting: boolean;
  rememberedEmail?: string | null;
  onClose: () => void;
  onForgetRememberedEmail?: () => void;
  onGoogleSignIn?: () => Promise<void>;
  onSubmit: (email: string) => Promise<void>;
}

const AuthDialog: React.FC<AuthDialogProps> = ({
  initialEmail = '',
  isOpen,
  isOAuthSubmitting = false,
  isSubmitting,
  rememberedEmail = null,
  onClose,
  onForgetRememberedEmail,
  onGoogleSignIn,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const isReturningUser = Boolean(rememberedEmail);
  const isBusy = isSubmitting || isOAuthSubmitting;

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
    } else {
      setEmail('');
    }
  }, [initialEmail, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    await onSubmit(email.trim());
  };

  const handleGoogleSignIn = async () => {
    if (!onGoogleSignIn) return;
    await onGoogleSignIn();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(30,27,24,0.48)] px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-[#fff8f3] p-6 shadow-[0_24px_60px_rgba(41,33,27,0.22)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">
              {isReturningUser ? 'Welcome back' : 'Values in the Wild sign-in'}
            </p>
            <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#1e1b18]">
              {isReturningUser ? 'Use your saved email' : 'Email me a sign-in link'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#6f6258] transition hover:bg-[#f1ebe5]"
            aria-label="Close sign-in dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#6f6258]">
          {isReturningUser
            ? 'We remembered the email you last used on this browser. We can send a fresh Values in the Wild sign-in link there, or you can edit it below.'
            : 'We’ll send a one-time Values in the Wild login email so your field notes, streaks, and history stay with your account across devices, or you can use Google below.'}
        </p>

        {rememberedEmail && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.2rem] bg-[#eef5e8] px-4 py-3">
            <span className="min-w-0 truncate text-sm font-semibold text-[#35680e]">{rememberedEmail}</span>
            <button
              type="button"
              onClick={onForgetRememberedEmail}
              disabled={isBusy}
              className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#35680e] transition hover:opacity-80"
            >
              Not you?
            </button>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Email</span>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9f948a]" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[1.2rem] border border-[#ece3dc] bg-white py-3 pl-11 pr-4 text-sm text-[#1e1b18] outline-none transition focus:border-[#35680e]"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={isBusy || !email.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#35680e] px-6 py-3.5 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)] transition hover:bg-[#2e5a0c] disabled:cursor-not-allowed disabled:bg-[#c9d7bc]"
          >
            {isSubmitting ? 'Sending sign-in email…' : isReturningUser ? 'Send a fresh sign-in link' : 'Email me a sign-in link'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e4d9d0]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a7668]">or</span>
          <div className="h-px flex-1 bg-[#e4d9d0]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isBusy}
          className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#d8cdc4] bg-white px-6 py-3.5 text-sm font-bold text-[#1e1b18] transition hover:border-[#cbbcaf] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#fff8f3] text-xs font-black text-[#35680e]"
          >
            G
          </span>
          {isOAuthSubmitting ? 'Opening Google…' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
};

export default AuthDialog;
