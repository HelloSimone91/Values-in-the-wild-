import React, { useState } from 'react';
import { Loader2, MessageSquareHeart } from './icons';

interface FeedbackViewProps {
  initialMessage?: string;
  isSubmitting: boolean;
  onSubmit: (message: string) => Promise<void>;
  sessionEmail?: string | null;
}

const FeedbackView: React.FC<FeedbackViewProps> = ({ initialMessage = '', isSubmitting, onSubmit, sessionEmail }) => {
  const [message, setMessage] = useState(initialMessage);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    await onSubmit(trimmedMessage);
    setMessage('');
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--app-surface-accent-soft)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-accent)]">
          <MessageSquareHeart className="h-3.5 w-3.5" />
          Feedback
        </div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-black tracking-[-0.05em] text-[var(--app-text)] sm:text-5xl">Tell me what feels off, useful, confusing, or missing.</h1>
        <p className="max-w-2xl text-base leading-8 text-[var(--app-text-muted)] sm:text-lg">
          Keep it simple. One sentence is enough. Longer notes are welcome too.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[2.25rem] bg-white p-6 shadow-[0_14px_30px_var(--app-shadow-soft)] sm:p-8">
        <label htmlFor="feedback-message" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-subtle)]">
          Your note
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Example: The settings drawer feels right, but I want profile actions grouped more clearly."
          rows={8}
          maxLength={4000}
          className="mt-3 w-full rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] px-4 py-4 text-base leading-7 text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-placeholder)] focus:border-[var(--app-border-accent)] focus:bg-white focus:ring-4 focus:ring-[var(--app-shadow-accent-soft)]"
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm leading-6 text-[var(--app-text-muted)]">
            <p>Feedback is stored by the app backend and can also forward to a Google Sheet webhook when configured.</p>
            <p>{sessionEmail ? `Signed in as ${sessionEmail}.` : 'If you are browsing as a guest, the note is still accepted.'}</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--app-accent)] px-6 py-3 text-sm font-bold text-[var(--app-text-on-accent)] shadow-[0_16px_28px_var(--app-shadow-accent)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--app-accent-disabled)]"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Sending…' : 'Send feedback'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default FeedbackView;
