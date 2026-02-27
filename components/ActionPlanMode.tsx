import React, { useEffect, useMemo, useState } from 'react';
import { ActionPlanCycle, CheckInStatus, DayCheckIn, ValueEntry } from '../types';
import { deriveTopValues, generateActionPlan } from '../services/actionPlanService';
import { trackEvent } from '../services/analyticsService';
import { CalendarDays, FileDown, Loader2, RotateCcw, Target } from 'lucide-react';

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
      <div className="max-w-4xl mx-auto w-full pt-8 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-5xl font-black text-white tracking-tighter">Values-to-Action Plan</h2>
          <p className="text-slate-300/80 text-lg font-light max-w-2xl mx-auto">
            Convert your synthesis into a focused 7-day behavior loop with quick daily check-ins.
          </p>
        </div>

        <div className="bg-[#162940]/70 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400 mb-4">Step 1: Select 2-3 focus values</p>
            <div className="flex flex-wrap gap-3">
              {recommendedValues.length > 0 ? recommendedValues.map((value) => {
                const active = selectedValues.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleValue(value)}
                    className={`px-5 py-2.5 rounded-full border text-xs font-black uppercase tracking-[0.2em] transition-all ${active ? 'bg-teal-500/20 border-teal-400/60 text-teal-300' : 'bg-white/5 border-white/10 text-slate-300 hover:border-teal-500/40'}`}
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

          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 text-sm text-slate-300 space-y-2">
            <p>Readiness checks:</p>
            <p>Entries: <span className={entries.length >= MIN_ENTRIES ? 'text-teal-300' : 'text-amber-400'}>{entries.length}/{MIN_ENTRIES}</span></p>
            <p>Distinct pillars: <span className={distinctPillars >= MIN_PILLARS ? 'text-teal-300' : 'text-amber-400'}>{distinctPillars}/{MIN_PILLARS}</span></p>
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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pt-8 space-y-8">
      <div className="bg-[#162940]/70 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
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

          <div className="min-w-[220px]">
            <div className="flex justify-between text-xs text-slate-300 mb-2">
              <span>Completion</span>
              <span>{completionRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-teal-500" style={{ width: `${completionRate}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{checkedInDays}/7 check-ins completed</p>
          </div>
        </div>
      </div>

      <div className="bg-[#162940]/70 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap gap-3">
          {plan.days.map((day) => {
            const selected = activeDay === day.day;
            const status = day.checkIn?.status;
            return (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`px-4 py-3 rounded-xl border text-left min-w-[110px] transition-all ${selected ? 'bg-teal-500/20 border-teal-400/60' : 'bg-white/5 border-white/10 hover:border-teal-500/40'}`}
              >
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-300">Day {day.day}</p>
                <p className="text-xs mt-1 text-white truncate">{status ? statusLabels[status] : 'Pending'}</p>
              </button>
            );
          })}
        </div>

        {activePlanDay && (
          <div className="space-y-6">
            <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
              <p className="text-xs text-teal-400 uppercase tracking-[0.2em] font-black mb-2">Day {activePlanDay.day} theme</p>
              <p className="text-white font-semibold">{activePlanDay.theme}</p>
              <ul className="mt-4 space-y-3">
                {activePlanDay.actions.map((action) => (
                  <li key={action.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-white font-medium">{action.title}</p>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-black">{action.durationMinutes}m</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">Value: {action.valueTag} • {action.rationale}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-black/20 border border-white/10 rounded-2xl p-6 space-y-4">
              <p className="text-xs text-teal-400 uppercase tracking-[0.2em] font-black">Daily Check-in</p>
              <div className="flex flex-wrap gap-3">
                {(['done', 'partial', 'skipped'] as CheckInStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusSelection(status)}
                    className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-[0.15em] transition-all ${statusSelection === status ? 'bg-teal-500/20 border-teal-400/60 text-teal-300' : 'bg-white/5 border-white/10 text-slate-300'}`}
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
                placeholder="Optional reflection note (required only when skipped without reason chip)."
                className="w-full h-24 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
              />

              {error && <p className="text-rose-400 text-xs">{error}</p>}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveCheckIn}
                  className="px-5 py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black uppercase tracking-[0.2em]"
                >
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
          </div>
        )}
      </div>

      <div className="bg-[#162940]/70 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-5">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
