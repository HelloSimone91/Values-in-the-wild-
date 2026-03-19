import React, { useEffect, useMemo, useState } from 'react';
import { ActionPlanCycle, CheckInStatus, DayCheckIn, ValueEntry } from '../types';
import { deriveTopValues, generateActionPlan } from '../services/actionPlanService';
import { trackEvent } from '../services/analyticsService';
import { CalendarDays, CheckCircle2, Clock3, FileDown, Flame, Loader2, RotateCcw, Target } from 'lucide-react';

interface ActionPlanModeProps {
  entries: ValueEntry[];
  plan: ActionPlanCycle | null;
  userId: string;
  onPlanChange: (plan: ActionPlanCycle | null) => Promise<void> | void;
}

const MIN_ENTRIES = 5;
const MIN_PILLARS = 3;
const SKIP_REASON_CHIPS = ['No time window', 'Low energy', 'Forgot', 'Competing priority'];

const statusLabels: Record<CheckInStatus, string> = {
  done: 'Done',
  partial: 'Partially Done',
  skipped: 'Skipped',
};

const statusAccent: Record<CheckInStatus, string> = {
  done: 'text-teal-300 border-teal-500/50 bg-teal-500/10',
  partial: 'text-amber-300 border-amber-500/50 bg-amber-500/10',
  skipped: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
};

const dayFromTimestamp = (createdAt: number): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const elapsed = Math.floor((Date.now() - createdAt) / msPerDay) + 1;
  return Math.max(1, Math.min(7, elapsed));
};

const ActionPlanMode: React.FC<ActionPlanModeProps> = ({ entries, plan, userId, onPlanChange }) => {
  const recommendedValues = useMemo(() => deriveTopValues(entries, 3), [entries]);
  const distinctPillars = useMemo(() => new Set(entries.map((entry) => entry.pillar)).size, [entries]);
  const canGenerate = entries.length >= MIN_ENTRIES && distinctPillars >= MIN_PILLARS;

  const [selectedValues, setSelectedValues] = useState<string[]>(recommendedValues.slice(0, 3));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [statusSelection, setStatusSelection] = useState<CheckInStatus>('done');
  const [skipReason, setSkipReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    if (!selectedValues.length && recommendedValues.length) {
      setSelectedValues(recommendedValues.slice(0, 3));
    }
  }, [recommendedValues, selectedValues.length]);

  useEffect(() => {
    if (!plan) {
      setActiveDay(1);
      return;
    }

    const inferredDay = dayFromTimestamp(plan.createdAt);
    const firstUnchecked = plan.days.find((day) => !day.checkIn)?.day;
    setActiveDay(firstUnchecked || inferredDay);
  }, [plan]);

  const activePlanDay = plan?.days.find((day) => day.day === activeDay);

  useEffect(() => {
    if (!activePlanDay?.checkIn) {
      setStatusSelection('done');
      setSkipReason('');
      setNote('');
      setError(null);
      return;
    }

    setStatusSelection(activePlanDay.checkIn.status);
    setSkipReason(activePlanDay.checkIn.reasonChip || '');
    setNote(activePlanDay.checkIn.note || '');
    setError(null);
  }, [activePlanDay?.checkIn, activeDay]);

  const checkedInDays = plan?.days.filter((day) => day.checkIn).length || 0;
  const doneDays = plan?.days.filter((day) => day.checkIn?.status === 'done').length || 0;
  const partialDays = plan?.days.filter((day) => day.checkIn?.status === 'partial').length || 0;
  const skippedDays = plan?.days.filter((day) => day.checkIn?.status === 'skipped').length || 0;
  const completionRate = plan ? Math.round((checkedInDays / plan.days.length) * 100) : 0;
  const activeStreak = plan?.days.reduce((streak, day) => {
    if (day.checkIn?.status === 'done') return streak + 1;
    return streak;
  }, 0) || 0;
  const nextUncheckedDay = plan?.days.find((day) => !day.checkIn)?.day;

  const toggleValue = (value: string) => {
    setSelectedValues((prev) => {
      if (prev.includes(value)) {
        if (prev.length <= 2) return prev;
        return prev.filter((item) => item !== value);
      }

      if (prev.length >= 3) {
        return [prev[1], prev[2], value];
      }

      return [...prev, value];
    });
  };

  const handleGeneratePlan = async () => {
    if (!canGenerate || selectedValues.length < 2) return;

    setIsGenerating(true);
    trackEvent('plan_generate_clicked', {
      source: 'action_plan_mode',
      entry_count: entries.length,
      selected_values_count: selectedValues.length,
      user_segment: 'individual_self_coaching',
    });

    try {
      const days = await generateActionPlan(entries, selectedValues);
      const nextPlan: ActionPlanCycle = {
        id: `cycle_${Date.now()}`,
        userId,
        selectedValues,
        sourceEntryIds: entries.map((entry) => entry.id),
        days,
        status: 'active',
        createdAt: Date.now(),
      };

      await onPlanChange(nextPlan);

      trackEvent('plan_generated', {
        cycle_id: nextPlan.id,
        days: nextPlan.days.length,
        selected_values_count: selectedValues.length,
        user_segment: 'individual_self_coaching',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCheckIn = async () => {
    if (!plan || !activePlanDay) return;

    const trimmedNote = note.trim();

    if (statusSelection === 'skipped' && !skipReason && !trimmedNote) {
      setError('Add a skip reason chip or a short note before saving.');
      return;
    }

    const checkIn: DayCheckIn = {
      status: statusSelection,
      note: trimmedNote || undefined,
      reasonChip: statusSelection === 'skipped' ? (skipReason || undefined) : undefined,
      timestamp: Date.now(),
    };

    const updatedDays = plan.days.map((day) => (day.day === activePlanDay.day ? { ...day, checkIn } : day));
    const allChecked = updatedDays.every((day) => day.checkIn);

    const updatedPlan: ActionPlanCycle = {
      ...plan,
      days: updatedDays,
      status: allChecked ? 'completed' : plan.status,
      completedAt: allChecked ? Date.now() : plan.completedAt,
    };

    await onPlanChange(updatedPlan);
    setError(null);
    setNote('');
    setSkipReason('');

    trackEvent('checkin_submitted', {
      cycle_id: plan.id,
      day_index: activeDay,
      status: statusSelection,
      user_segment: 'individual_self_coaching',
    });

    if (allChecked) {
      trackEvent('cycle_completed', {
        cycle_id: plan.id,
        completion_rate: 100,
        user_segment: 'individual_self_coaching',
      });
      return;
    }

    const followingUncheckedDay = updatedDays.find((day) => !day.checkIn)?.day;
    if (followingUncheckedDay) {
      setActiveDay(followingUncheckedDay);
    }
  };

  const handleReplanRemaining = async () => {
    if (!plan) return;

    const fromDay = Math.max(activeDay, 1);
    const priorCheckIns = plan.days.reduce((acc, day) => {
      acc[day.day] = day.checkIn;
      return acc;
    }, {} as Record<number, DayCheckIn | undefined>);

    setIsReplanning(true);
    try {
      const regenerated = await generateActionPlan(entries, plan.selectedValues, {
        fromDay,
        priorCheckIns,
      });

      const regeneratedMap = regenerated.reduce((acc, day) => {
        acc[day.day] = day;
        return acc;
      }, {} as Record<number, (typeof regenerated)[number]>);

      const mergedDays = plan.days.map((day) => {
        if (day.day < fromDay || day.checkIn) return day;
        return regeneratedMap[day.day] ? { ...regeneratedMap[day.day], checkIn: day.checkIn } : day;
      });

      const updatedPlan: ActionPlanCycle = { ...plan, days: mergedDays };
      await onPlanChange(updatedPlan);

      trackEvent('replan_requested', {
        cycle_id: plan.id,
        from_day: fromDay,
        user_segment: 'individual_self_coaching',
      });
    } finally {
      setIsReplanning(false);
    }
  };

  const handleCompleteCycle = async () => {
    if (!plan) return;

    const updatedPlan: ActionPlanCycle = {
      ...plan,
      status: 'completed',
      completedAt: Date.now(),
    };

    await onPlanChange(updatedPlan);

    trackEvent('cycle_completed', {
      cycle_id: plan.id,
      completion_rate: completionRate,
      user_segment: 'individual_self_coaching',
    });
  };

  const buildSummaryMarkdown = (planToExport: ActionPlanCycle): string => {
    const rows = planToExport.days
      .map((day) => {
        const status = day.checkIn ? statusLabels[day.checkIn.status] : 'No check-in';
        const notePart = day.checkIn?.note ? ` | Note: ${day.checkIn.note}` : '';
        const reasonPart = day.checkIn?.reasonChip ? ` | Reason: ${day.checkIn.reasonChip}` : '';
        return `- Day ${day.day}: ${status}${reasonPart}${notePart}`;
      })
      .join('\n');

    return `# Weekly Values-to-Action Summary\n\n- Cycle ID: ${planToExport.id}\n- Created: ${new Date(planToExport.createdAt).toLocaleString()}\n- Completion Rate: ${completionRate}%\n- Done: ${doneDays}\n- Partial: ${partialDays}\n- Skipped: ${skippedDays}\n\n## Selected Values\n${planToExport.selectedValues.map((value) => `- ${value}`).join('\n')}\n\n## Daily Check-ins\n${rows}\n`;
  };

  const handleExportSummary = () => {
    if (!plan || !consentChecked) return;

    const markdown = buildSummaryMarkdown(plan);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `values-summary-${plan.id}.md`;
    link.click();
    URL.revokeObjectURL(url);

    trackEvent('summary_exported', {
      cycle_id: plan.id,
      format: 'markdown',
      consent_acknowledged: true,
      user_segment: 'coach_led',
    });

    setShowExportModal(false);
    setConsentChecked(false);
  };

  if (!plan) {
    return (
      <div className="max-w-5xl mx-auto w-full pt-8 space-y-8">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(25,194,179,0.18),rgba(242,178,79,0.16),rgba(239,106,135,0.14))] border border-white/10 rounded-[2.8rem] p-10 md:p-12 shadow-2xl">
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-30 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)]" />
          <div className="relative space-y-5 max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-teal-300">7-Day Implementation Sprint</p>
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">Values-to-Action Plan</h2>
            <p className="text-slate-200/90 text-lg font-light leading-relaxed max-w-2xl">
              Convert your synthesis into a one-week behavior loop. Generate a practical plan, check in in under a minute, and finish with a sharable weekly summary.
            </p>
            <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.2em]">
              <span className="px-4 py-2 rounded-full border border-white/10 bg-black/20 text-slate-200">1-2 actions per day</span>
              <span className="px-4 py-2 rounded-full border border-white/10 bg-black/20 text-slate-200">Cross-device persistence</span>
              <span className="px-4 py-2 rounded-full border border-white/10 bg-black/20 text-slate-200">Coach-shareable recap</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-8">
          <div className="bg-[#162940]/70 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400 mb-4">Step 1: Select 2-3 focus values</p>
              <p className="text-sm text-slate-300 mb-5 max-w-2xl">
                Start with the values you are already living most consistently. These become the anchors for the next seven days.
              </p>
              <div className="flex flex-wrap gap-3">
                {recommendedValues.length > 0 ? recommendedValues.map((value) => {
                  const active = selectedValues.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleValue(value)}
                      className={`px-5 py-2.5 rounded-full border text-xs font-black uppercase tracking-[0.2em] transition-all ${active ? 'bg-teal-500/20 border-teal-400/60 text-teal-300 shadow-lg shadow-teal-950/20' : 'bg-white/5 border-white/10 text-slate-300 hover:border-teal-500/40'}`}
                    >
                      {value}
                    </button>
                  );
                }) : (
                  <p className="text-slate-400 text-sm">Log more observations to generate recommended values.</p>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-4">Keep at least 2 values selected to build a meaningful weekly loop.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Input data</p>
                <p className="text-3xl font-black text-white mt-2">{entries.length}</p>
                <p className="text-xs text-slate-400 mt-2">Behavior observations available for plan generation.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Pillar spread</p>
                <p className="text-3xl font-black text-white mt-2">{distinctPillars}</p>
                <p className="text-xs text-slate-400 mt-2">Distinct areas represented in your recent evidence.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Weekly shape</p>
                <p className="text-3xl font-black text-white mt-2">7</p>
                <p className="text-xs text-slate-400 mt-2">Days of focused action with quick daily reflection.</p>
              </div>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={!canGenerate || selectedValues.length < 2 || isGenerating}
              className="w-full md:w-auto px-8 py-4 bg-[#0d9488] rounded-2xl text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-[#0f766e] disabled:opacity-30 transition-all flex items-center gap-3"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
              Generate 7-Day Plan
            </button>
          </div>

          <div className="bg-[#162940]/70 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400 mb-3">Readiness checks</p>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 border border-white/10">
                  <span>Entries</span>
                  <span className={entries.length >= MIN_ENTRIES ? 'text-teal-300' : 'text-amber-400'}>{entries.length}/{MIN_ENTRIES}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 border border-white/10">
                  <span>Distinct pillars</span>
                  <span className={distinctPillars >= MIN_PILLARS ? 'text-teal-300' : 'text-amber-400'}>{distinctPillars}/{MIN_PILLARS}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 border border-white/10">
                  <span>Selected values</span>
                  <span className={selectedValues.length >= 2 ? 'text-teal-300' : 'text-amber-400'}>{selectedValues.length}/3</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">What v1 gives you</p>
              <ul className="mt-3 space-y-3 text-sm text-slate-200">
                <li>Concrete actions tied to values you already embody.</li>
                <li>One-tap check-ins designed for sub-60-second completion.</li>
                <li>A weekly summary you can keep private or export for a coach.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pt-8 space-y-8">
      <div className="bg-[linear-gradient(135deg,rgba(25,194,179,0.14),rgba(18,37,58,0.78),rgba(242,178,79,0.12))] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">7-Day Action Plan</h2>
            <p className="text-slate-300/80 text-sm mt-2">Cycle {plan.id} • {new Date(plan.createdAt).toLocaleDateString()}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {plan.selectedValues.map((value) => (
                <span key={value} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300">
                  {value}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 min-w-[280px]">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Complete</p>
              <p className="text-2xl text-white font-black mt-1">{completionRate}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Streak</p>
              <p className="text-2xl text-white font-black mt-1">{activeStreak}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Next</p>
              <p className="text-2xl text-white font-black mt-1">{nextUncheckedDay || 7}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-300 mb-2">
            <span>Weekly completion arc</span>
            <span>{checkedInDays}/7 check-ins completed</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-teal-500" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Cross-device persistence is active when the backend is running.</p>
        </div>
      </div>

      {activePlanDay && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-8">
          <div className="bg-[#162940]/70 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <div className="flex flex-wrap gap-3">
              {plan.days.map((day) => {
                const selected = activeDay === day.day;
                const status = day.checkIn?.status;
                return (
                  <button
                    key={day.day}
                    onClick={() => setActiveDay(day.day)}
                    className={`px-4 py-3 rounded-xl border text-left min-w-[110px] transition-all ${selected ? 'bg-teal-500/20 border-teal-400/60 shadow-lg shadow-teal-950/20' : 'bg-white/5 border-white/10 hover:border-teal-500/40'}`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-300">Day {day.day}</p>
                    <p className="text-xs mt-1 text-white truncate">{status ? statusLabels[status] : 'Pending'}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[2rem] border border-teal-500/20 bg-[linear-gradient(135deg,rgba(25,194,179,0.16),rgba(6,14,24,0.25))] p-6">
              <div className="flex items-center gap-3 text-teal-300">
                <Flame className="w-5 h-5" />
                <p className="text-[11px] uppercase tracking-[0.25em] font-black">Today&apos;s focus</p>
              </div>
              <p className="text-white text-2xl font-black mt-4">{activePlanDay.theme}</p>
              <p className="text-sm text-slate-300 mt-3 max-w-2xl">
                Keep today narrow. Finish the smallest meaningful action first, then use the check-in to capture what actually happened.
              </p>
            </div>

            <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
              <p className="text-xs text-teal-400 uppercase tracking-[0.2em] font-black mb-2">Day {activePlanDay.day} actions</p>
              <ul className="mt-4 space-y-3">
                {activePlanDay.actions.map((action) => (
                  <li key={action.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-white font-medium">{action.title}</p>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-black flex items-center gap-1">
                        <Clock3 className="w-3.5 h-3.5" />
                        {action.durationMinutes}m
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] border border-teal-500/20 bg-teal-500/10 text-teal-300 font-black">
                        {action.valueTag}
                      </span>
                      <p className="text-xs text-slate-300">{action.rationale}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#162940]/70 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-4">
              <p className="text-xs text-teal-400 uppercase tracking-[0.2em] font-black">Daily Check-in</p>
              <div className="flex flex-wrap gap-3">
                {(['done', 'partial', 'skipped'] as CheckInStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusSelection(status)}
                    className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-[0.15em] transition-all ${statusSelection === status ? statusAccent[status] : 'bg-white/5 border-white/10 text-slate-300'}`}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>

              {statusSelection === 'skipped' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">Skip reason (required if no note):</p>
                  <div className="flex flex-wrap gap-2">
                    {SKIP_REASON_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setSkipReason((prev) => (prev === chip ? '' : chip))}
                        className={`px-3 py-1.5 rounded-full border text-[11px] transition-all ${skipReason === chip ? 'border-amber-500/60 bg-amber-500/10 text-amber-300' : 'border-white/10 bg-white/5 text-slate-300'}`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional reflection note. Capture the blocker, surprise, or win."
                className="w-full h-24 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
              />

              {error && <p className="text-rose-400 text-xs">{error}</p>}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveCheckIn}
                  className="px-5 py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Check-in
                </button>
                <button
                  onClick={handleReplanRemaining}
                  disabled={isReplanning}
                  className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-200 text-xs font-black uppercase tracking-[0.2em] disabled:opacity-30 flex items-center gap-2"
                >
                  {isReplanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Replan Remaining Days
                </button>
              </div>
            </div>

            <div className="bg-[#162940]/70 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-2xl font-black text-white tracking-tight">Weekly Reflection</h3>
                {plan.status !== 'completed' && (
                  <button
                    onClick={handleCompleteCycle}
                    className="px-5 py-3 rounded-xl border border-teal-500/40 bg-teal-500/10 text-teal-200 text-xs font-black uppercase tracking-[0.2em]"
                  >
                    Mark Cycle Complete
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Done</p>
                  <p className="text-white text-xl font-black mt-1">{doneDays}</p>
                </div>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Partial</p>
                  <p className="text-white text-xl font-black mt-1">{partialDays}</p>
                </div>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Skipped</p>
                  <p className="text-white text-xl font-black mt-1">{skippedDays}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-slate-200">
                <p className="text-[10px] uppercase tracking-[0.25em] font-black text-amber-300 mb-2">Interpretation</p>
                <p>
                  {doneDays >= 5
                    ? 'The pattern is holding. Your values are turning into repeated behavior.'
                    : partialDays + skippedDays > doneDays
                      ? 'Friction is visible. Use replan to reduce ambition, not commitment.'
                      : 'Momentum is forming. Keep the actions small enough to repeat tomorrow.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-200 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Export Weekly Summary
                </button>
                <button
                  onClick={() => onPlanChange(null)}
                  className="px-5 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-black uppercase tracking-[0.2em]"
                >
                  Start New Cycle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#111d2e] border border-white/10 rounded-3xl p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <CalendarDays className="w-5 h-5" />
              <p className="font-black text-sm uppercase tracking-[0.2em]">Consent Required</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              This export may include personal behavior reflections and value-related notes. Confirm consent before sharing with a coach or third party.
            </p>
            <label className="flex items-start gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(event) => setConsentChecked(event.target.checked)}
                className="mt-1"
              />
              <span>I understand this export contains personal reflection data and I choose to share it.</span>
            </label>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setConsentChecked(false);
                }}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleExportSummary}
                disabled={!consentChecked}
                className="px-4 py-2 rounded-lg bg-[#0d9488] text-white text-sm font-semibold disabled:opacity-30"
              >
                Export Markdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionPlanMode;
