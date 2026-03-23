import React, { useEffect, useState } from 'react';
import { ArrowRight, Mail, X } from 'lucide-react';

interface AuthDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, isSubmitting, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    await onSubmit(email.trim());
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(30,27,24,0.48)] px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-[#fff8f3] p-6 shadow-[0_24px_60px_rgba(41,33,27,0.22)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Sign in</p>
            <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em] text-[#1e1b18]">
              Save your field notes
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
          Use a magic link so notes, streaks, and history belong to your account across devices.
        </p>

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
            disabled={isSubmitting || !email.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#35680e] px-6 py-3.5 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)] transition hover:bg-[#2e5a0c] disabled:cursor-not-allowed disabled:bg-[#c9d7bc]"
          >
            {isSubmitting ? 'Sending link…' : 'Send magic link'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthDialog;
