import React from 'react';
import { ArrowUpRight, HeartHandshake, Map, NotebookTabs } from './icons';

const WhyValuesView: React.FC = () => {
  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--app-surface-accent-soft)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-accent)]">
          <HeartHandshake className="h-3.5 w-3.5" />
          Why Values
        </div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-black tracking-[-0.05em] text-[var(--app-text)] sm:text-5xl">
          Values matter most when they survive contact with ordinary life.
        </h1>
        <p className="max-w-3xl text-base leading-8 text-[var(--app-text-muted)] sm:text-lg">
          Plenty of apps help people name what they admire. This one is built to notice what they actually practice, avoid, repeat, and protect when the day gets
          messy.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <article className="rounded-[2rem] bg-white p-6 shadow-[0_14px_30px_var(--app-shadow-soft)]">
          <Map className="h-6 w-6 text-[var(--app-text-accent)]" />
          <h2 className="mt-4 font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-[-0.03em] text-[var(--app-text)]">Name the terrain</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
            The field guide gives people language for nuance, not a scorecard. It turns a vague instinct into something you can actually notice.
          </p>
        </article>

        <article className="rounded-[2rem] bg-white p-6 shadow-[0_14px_30px_var(--app-shadow-soft)]">
          <NotebookTabs className="h-6 w-6 text-[var(--app-pop-warm)]" />
          <h2 className="mt-4 font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-[-0.03em] text-[var(--app-text)]">Keep field notes</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
            Reflection gets more honest when it is close to the event. A short note about what happened is often more useful than a polished statement of identity.
          </p>
        </article>

        <article className="rounded-[2rem] bg-white p-6 shadow-[0_14px_30px_var(--app-shadow-soft)]">
          <ArrowUpRight className="h-6 w-6 text-[var(--app-pop-purple)]" />
          <h2 className="mt-4 font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-[-0.03em] text-[var(--app-text)]">Practice forward</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
            The goal is not to freeze a self-image. It is to keep making slightly better choices, with enough evidence to see what is changing.
          </p>
        </article>
      </div>

      <div className="rounded-[2.25rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-subtle)]">The short version</p>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--app-text-muted)]">
          Values become real through repetition, friction, and tradeoffs. This project exists to help people notice those moments, learn from them, and build a
          more grounded picture of who they are becoming.
        </p>
      </div>
    </section>
  );
};

export default WhyValuesView;
