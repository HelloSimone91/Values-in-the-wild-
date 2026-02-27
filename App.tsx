
import React, { useState, useEffect } from 'react';
import { ActionPlanCycle, Mode, ValueEntry } from './types';
import AuditMode from './components/AuditMode';
import WildMode from './components/WildMode';
import SynthesisMode from './components/SynthesisMode';
import ActionPlanMode from './components/ActionPlanMode';
import { Layers, Compass, Zap, Sparkles, CheckCircle2, Target } from 'lucide-react';
import { getOrCreateUserId, loadActionPlan, saveActionPlan } from './services/planPersistenceService';
import { trackEvent } from './services/analyticsService';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.AUDIT);
  const [userId] = useState<string>(() => getOrCreateUserId());
  const [entries, setEntries] = useState<ValueEntry[]>(() => {
    const saved = localStorage.getItem('embodied_evidence');
    return saved ? JSON.parse(saved) : [];
  });
  const [actionPlan, setActionPlan] = useState<ActionPlanCycle | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('embodied_evidence', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    let mounted = true;
    const initializePlan = async () => {
      const loadedPlan = await loadActionPlan(userId);
      if (mounted) {
        setActionPlan(loadedPlan);
        setIsPlanLoading(false);
      }
    };

    initializePlan();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Handle cross-mode navigation from AuditMode components
  useEffect(() => {
    const handleModeChange = (e: any) => setMode(e.detail);
    window.addEventListener('changeMode', handleModeChange);
    return () => window.removeEventListener('changeMode', handleModeChange);
  }, []);

  const handleSaveValue = (entry: ValueEntry) => {
    setEntries((prev) => [...prev, entry]);
  };

  const handlePlanChange = async (nextPlan: ActionPlanCycle | null) => {
    setActionPlan(nextPlan);
    await saveActionPlan(userId, nextPlan);
  };

  useEffect(() => {
    if (mode === Mode.SYNTHESIS) {
      trackEvent('synthesis_viewed', {
        entry_count: entries.length,
        user_segment: 'individual_self_coaching',
      });
    }
  }, [mode, entries.length]);

  const NavButton = ({ targetMode, icon: Icon, label }: { targetMode: Mode; icon: any; label: string }) => (
    <button
      onClick={() => setMode(targetMode)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 relative group ${
        mode === targetMode
          ? 'text-teal-400 font-semibold bg-white/10'
          : 'text-slate-300/70 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 ${mode === targetMode ? 'scale-110 text-teal-400' : 'group-hover:scale-105'}`} />
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
      {mode === targetMode && (
        <span className="absolute bottom-0 left-2 right-2 h-1 bg-amber-500 rounded-full" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#1f3653] flex flex-col font-sans text-slate-100 selection:bg-teal-500/30">
      {/* Top Navigation */}
      <header className="bg-[#162940]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 py-4">
            <div className="bg-[#0d9488] p-2.5 rounded-xl shadow-lg shadow-teal-900/40">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                EMBODIED<span className="text-teal-400 font-light tracking-widest ml-1">ALIGN</span>
              </h1>
              <span className="text-[10px] text-teal-400/80 font-bold uppercase tracking-[0.3em] mt-1">Values Intelligence</span>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <NavButton targetMode={Mode.AUDIT} icon={Compass} label="The Audit" />
            <NavButton targetMode={Mode.WILD} icon={Zap} label="Observation Log" />
            <NavButton targetMode={Mode.SYNTHESIS} icon={Sparkles} label="Synthesis" />
            <NavButton targetMode={Mode.ACTION_PLAN} icon={Target} label="Action Plan" />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-10">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-teal-100 font-bold uppercase tracking-widest bg-teal-500/20 px-4 py-2 rounded-full border border-teal-500/20">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Active Exploration</span>
          </div>
          <div className="flex gap-4">
             <div className="text-[11px] text-slate-300 font-bold uppercase tracking-widest bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
               Observations: <span className="text-amber-400">{entries.length}</span>
             </div>
          </div>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {mode === Mode.AUDIT && <AuditMode onSaveValue={handleSaveValue} entries={entries} />}
          {mode === Mode.WILD && <WildMode onSaveValue={handleSaveValue} />}
          {mode === Mode.SYNTHESIS && <SynthesisMode entries={entries} />}
          {mode === Mode.ACTION_PLAN && !isPlanLoading && (
            <ActionPlanMode
              entries={entries}
              plan={actionPlan}
              userId={userId}
              onPlanChange={handlePlanChange}
            />
          )}
          {mode === Mode.ACTION_PLAN && isPlanLoading && (
            <div className="text-center text-slate-300 text-sm">Loading action plan...</div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 py-12 mt-auto bg-[#162940]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-6 mb-4">
             <div className="w-3 h-3 rounded-full bg-[#0d9488]"></div>
             <div className="w-3 h-3 rounded-full bg-[#c084fc]"></div>
             <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
             <div className="w-3 h-3 rounded-full bg-[#be123c]"></div>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
            Bold Desert Sunset System
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
