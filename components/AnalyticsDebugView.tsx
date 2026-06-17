import React from 'react';
import { Activity, BarChart3, Bug, Clock3, RefreshCcw } from './icons';

interface AnalyticsEvent {
  id: number;
  eventName: string;
  userId: string | null;
  anonymousId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface AnalyticsSummaryItem {
  eventName: string;
  count: number;
}

interface AnalyticsDebugViewProps {
  error: string | null;
  events: AnalyticsEvent[];
  hasAdminAccess: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  summary: AnalyticsSummaryItem[];
  windowHours: number;
}

const AnalyticsDebugView: React.FC<AnalyticsDebugViewProps> = ({
  error,
  events,
  hasAdminAccess,
  isAuthenticated,
  isLoading,
  onRefresh,
  summary,
  windowHours,
}) => {
  if (!isAuthenticated) {
    return (
      <section className="rounded-[2.6rem] bg-[#f9f2ed] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5e8] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">
            <Bug className="h-3.5 w-3.5" />
            Analytics debug
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e] sm:text-5xl">
            Sign in to inspect analytics.
          </h1>
          <p className="text-base leading-7 text-[#6f6258] sm:text-lg">
            This route is intentionally limited to signed-in sessions when auth is enabled.
          </p>
        </div>
      </section>
    );
  }

  if (!hasAdminAccess) {
    return (
      <section className="rounded-[2.6rem] bg-[#f9f2ed] p-8 shadow-[0_14px_30px_rgba(41,33,27,0.04)]">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5e8] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">
            <Bug className="h-3.5 w-3.5" />
            Analytics debug
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e] sm:text-5xl">
            Admin access required.
          </h1>
          <p className="text-base leading-7 text-[#6f6258] sm:text-lg">
            This route is limited to the configured admin allowlist.
          </p>
        </div>
      </section>
    );
  }

  const summaryMap: Record<string, number> = summary.reduce((acc: Record<string, number>, item: AnalyticsSummaryItem) => {
    acc[item.eventName] = item.count;
    return acc;
  }, {});

  const guestSessions = summaryMap.guest_mode_selected || 0;
  const signInRequests = summaryMap.sign_in_requested || 0;
  const successfulSignIns = summaryMap.auth_signed_in || 0;
  const guestNotesClaimed = summaryMap.guest_notes_claimed || 0;

  const signInRequestRate = guestSessions > 0 ? Math.round((signInRequests / guestSessions) * 100) : 0;
  const signInSuccessRate = signInRequests > 0 ? Math.round((successfulSignIns / signInRequests) * 100) : 0;
  const claimRate = successfulSignIns > 0 ? Math.round((guestNotesClaimed / successfulSignIns) * 100) : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5e8] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#35680e]">
            <Bug className="h-3.5 w-3.5" />
            Analytics debug
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e] sm:text-5xl">
            Recent product signal
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#6f6258] sm:text-lg">
            Quick read on guest mode, sign-ins, note creation, and guest-note claiming over the last {windowHours} hours.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-[#35680e] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(53,104,14,0.18)] disabled:cursor-not-allowed disabled:bg-[#c9d7bc]"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error && (
        <section className="rounded-[2rem] bg-[#fff1ef] p-6 text-[#93000a] shadow-[0_14px_30px_rgba(186,26,26,0.08)]">
          <p className="font-semibold">Unable to load analytics</p>
          <p className="mt-2 text-sm leading-6">{error}</p>
        </section>
      )}

      <section className="rounded-[2.4rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#f1ebe5] p-2 text-[#35680e]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Guest to account conversion</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] bg-[#fff8f3] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Guest sessions</p>
            <p className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e]">{guestSessions}</p>
          </div>
          <div className="rounded-[1.5rem] bg-[#fff8f3] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Sign-in requests</p>
            <p className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e]">{signInRequests}</p>
            <p className="mt-2 text-xs leading-5 text-[#6f6258]">{signInRequestRate}% of guest sessions</p>
          </div>
          <div className="rounded-[1.5rem] bg-[#fff8f3] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Successful sign-ins</p>
            <p className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e]">{successfulSignIns}</p>
            <p className="mt-2 text-xs leading-5 text-[#6f6258]">{signInSuccessRate}% of sign-in requests</p>
          </div>
          <div className="rounded-[1.5rem] bg-[#fff8f3] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">Guest notes claimed</p>
            <p className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-[-0.05em] text-[#35680e]">{guestNotesClaimed}</p>
            <p className="mt-2 text-xs leading-5 text-[#6f6258]">{claimRate}% of successful sign-ins</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[2.4rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#f1ebe5] p-2 text-[#35680e]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Event counts</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {summary.length ? (
              summary.map((item) => (
                <div key={item.eventName} className="flex items-center justify-between rounded-[1.2rem] bg-[#fff8f3] px-4 py-3">
                  <span className="text-sm font-semibold text-[#1e1b18]">{item.eventName}</span>
                  <span className="rounded-full bg-[#eef5e8] px-3 py-1 text-xs font-bold text-[#35680e]">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6f6258]">No events recorded in the selected window yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-[2.4rem] bg-white p-6 shadow-[0_14px_30px_rgba(41,33,27,0.04)] sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#f1ebe5] p-2 text-[#35680e]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7668]">Recent events</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {events.length ? (
              events.map((event) => (
                <article key={event.id} className="rounded-[1.4rem] border border-[#ece3dc] bg-[#fff8f3] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-[-0.03em] text-[#1e1b18]">{event.eventName}</span>
                      {event.userId ? (
                        <span className="rounded-full bg-[#eef5e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#35680e]">
                          account
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f1ebe5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7668]">
                          guest
                        </span>
                      )}
                    </div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7668]">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#6f6258]">
                    {event.userId ? `user ${event.userId}` : `anon ${event.anonymousId || 'n/a'}`}
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-[1rem] bg-white p-3 text-xs leading-5 text-[#4d5b43]">
                    {JSON.stringify(event.metadata || {}, null, 2)}
                  </pre>
                </article>
              ))
            ) : (
              <p className="text-sm text-[#6f6258]">No recent events yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsDebugView;
