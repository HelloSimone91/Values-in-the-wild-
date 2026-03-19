

import React, { useState, useEffect, useRef } from 'react';
import { Pillar, ChatMessage, ValueEntry, ResonanceOption, Mode } from '../types';
import { PILLAR_DESCRIPTIONS, PILLAR_PROMPTS } from '../constants';
import { analyzeBehavior } from '../services/geminiService';
import ResonanceMenu from './ResonanceMenu';
import { Send, Loader2, ArrowRight, CircleDot, MessageSquare, Sparkles, Zap, LayoutDashboard } from 'lucide-react';

interface AuditModeProps {
  onSaveValue: (entry: ValueEntry) => void;
  entries: ValueEntry[];
}

const AuditMode: React.FC<AuditModeProps> = ({ onSaveValue, entries }) => {
  const [activePillar, setActivePillar] = useState<Pillar | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [behaviorContext, setBehaviorContext] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!activePillar) {
      setBehaviorContext(null);
    }
  }, [activePillar]);

  // Helper to determine next pillar
  const pillars = Object.values(Pillar);
  const getNextPillar = (current: Pillar): Pillar | null => {
    const currentIndex = pillars.indexOf(current);
    return pillars[currentIndex + 1] || null;
  };

  const isPillarComplete = (p: Pillar) => entries.filter(e => e.pillar === p).length >= 4;
  const allPillarsAudited = pillars.every(p => isPillarComplete(p));

  const startPillar = (pillar: Pillar) => {
    setActivePillar(pillar);
    setMessages([
      {
        id: 'sys-1',
        role: 'assistant',
        text: `Let's look at **${pillar}**. ${PILLAR_DESCRIPTIONS[pillar]}`,
        type: 'text'
      },
      {
        id: 'sys-2',
        role: 'assistant',
        text: PILLAR_PROMPTS[pillar],
        type: 'text'
      }
    ]);
  };

  // Fixed handleSend to process ResonanceOption[] correctly and remove invalid arguments
  const handleSend = async () => {
    if (!input.trim() || !activePillar) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText, type: 'text' }]);
    setIsLoading(true);

    // Track context for later attribution
    setBehaviorContext(userText);

    try {
      // Fix: Removed 3rd argument as analyzeBehavior only takes 2
      const result = await analyzeBehavior(userText, activePillar);
      
      // Fix: Aligned with the ResonanceOption[] return type from the service
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: "I've analyzed that observation. Which of these values feels like the underlying driver of that action?",
        type: 'resonance-menu',
        options: result
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', text: "Connection interrupted. Could you try rephrasing?", type: 'text' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelection = (option: ResonanceOption, sourceText: string) => {
    if (!activePillar) return;
    
    // Save value
    onSaveValue({ 
      id: Date.now().toString(), 
      value: option.value, 
      pillar: activePillar, 
      sourceAction: sourceText, 
      timestamp: Date.now() 
    });
    
    // Check pillar progress
    const pillarEntryCount = entries.filter(e => e.pillar === activePillar).length + 1;

    if (pillarEntryCount === 4) {
      const nextPillar = getNextPillar(activePillar);
      
      if (allPillarsAudited) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          text: `You have completed a baseline audit for ALL pillars. You now have a rich dataset of embodied values. What is your next move?`,
          type: 'resonance-menu', // Reusing the menu style for choices
          options: [
            { value: "VIEW SYNTHESIS", reason: "Generate a deep report on patterns and contradictions." },
            { value: "WILD MODE", reason: "Log real-time observations as they happen." },
            { value: "KEEP EXPLORING", reason: "Stay in this chat and dive deeper into this pillar." }
          ]
        }]);
      } else if (nextPillar) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          text: `Significant alignment found in **${activePillar}**. We've reached a baseline for this area. How should we proceed?`,
          type: 'resonance-menu',
          options: [
            { value: `AUDIT ${nextPillar.toUpperCase()}`, reason: `Move to the next focus area: ${nextPillar}.` },
            { value: "CONTINUE HERE", reason: "I have more observations to log for this pillar." },
            { value: "CHANGE PILLAR", reason: "I'd like to pick a different area manually." }
          ]
        }]);
      }
    } else {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        text: `Alignment confirmed: **${option.value}**. What's another action you take in your **${activePillar}**?`, 
        type: 'text' 
      }]);
    }
  };

  const handleBranchingChoice = (choiceValue: string) => {
    if (choiceValue.startsWith("AUDIT ")) {
      const nextPillarName = choiceValue.replace("AUDIT ", "").toLowerCase();
      const nextPillar = pillars.find(p => p.toLowerCase() === nextPillarName);
      if (nextPillar) startPillar(nextPillar);
    } else if (choiceValue === "CONTINUE HERE" || choiceValue === "KEEP EXPLORING") {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: "Excellent. Tell me more about another specific behavior or ritual in this space.",
        type: 'text'
      }]);
    } else if (choiceValue === "CHANGE PILLAR") {
      setActivePillar(null);
    } else if (choiceValue === "VIEW SYNTHESIS") {
      window.dispatchEvent(new CustomEvent('changeMode', { detail: Mode.SYNTHESIS }));
    } else if (choiceValue === "WILD MODE") {
      window.dispatchEvent(new CustomEvent('changeMode', { detail: Mode.WILD }));
    }
  };

  if (!activePillar) {
    return (
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">Discovery Areas</h2>
          <p className="text-slate-300/80 text-lg sm:text-xl font-light">Select a focus to begin extracting lived values from your reality.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.values(Pillar).map((p) => {
            const count = entries.filter(e => e.pillar === p).length;
            const complete = count >= 4;
            
            return (
              <button
                key={p}
                onClick={() => startPillar(p)}
                className={`group p-6 sm:p-10 bg-[#162940]/60 backdrop-blur-sm rounded-[2rem] sm:rounded-[2.5rem] border ${complete ? 'border-teal-500/50' : 'border-white/5'} hover:border-teal-500/40 hover:bg-[#162940]/80 transition-all duration-500 text-left flex flex-col h-full shadow-2xl relative overflow-hidden`}
              >
                {complete && (
                   <div className="absolute top-0 right-0 p-4 opacity-20">
                     <Sparkles className="w-12 h-12 text-teal-400" />
                   </div>
                )}
                <div className="flex items-center justify-between mb-8">
                  <div className={`p-3.5 ${complete ? 'bg-teal-500/20' : 'bg-teal-500/10'} rounded-2xl`}>
                    <CircleDot className={`w-6 h-6 ${complete ? 'text-teal-400' : 'text-teal-600'}`} />
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-amber-500 transition-all group-hover:translate-x-2" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 group-hover:text-teal-400 transition-colors tracking-tight">{p}</h3>
                <p className="text-[15px] text-slate-300 leading-relaxed font-light mb-6">{PILLAR_DESCRIPTIONS[p]}</p>
                <div className="mt-auto flex items-center gap-2">
                   <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${Math.min((count / 4) * 100, 100)}%` }}></div>
                   </div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{count}/4</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)] max-w-4xl mx-auto w-full bg-[#162940]/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
      {/* Session Header */}
      <div className="bg-white/5 px-5 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
          <span className="text-xs font-black text-white uppercase tracking-[0.2em] truncate">Live Session: {activePillar}</span>
        </div>
        <button 
          onClick={() => setActivePillar(null)}
          className="text-[10px] font-black text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-[0.3em] px-5 py-2.5 rounded-full bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 self-start sm:self-auto"
        >
          End Session
        </button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-6 sm:space-y-10 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`max-w-[85%] ${msg.type === 'resonance-menu' ? 'w-full' : ''}`}>
              {msg.type === 'text' && (
                <div className={`px-5 sm:px-8 py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] text-[15px] sm:text-[16px] leading-relaxed shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-[#0d9488] text-white rounded-tr-none font-semibold border-b-2 border-teal-700/50' 
                    : 'bg-white/5 border border-white/10 text-slate-100 rounded-tl-none font-light'
                }`}>
                  {msg.text}
                </div>
              )}
              {msg.type === 'resonance-menu' && msg.options && (
                <ResonanceMenu 
                  options={msg.options} 
                  onSelect={(opt) => {
                    // Check if this is a branching choice or a value selection
                    const isBranching = ["AUDIT ", "CONTINUE ", "CHANGE ", "WILD ", "VIEW ", "KEEP "].some(prefix => opt.value.startsWith(prefix));
                    if (isBranching) {
                      handleBranchingChoice(opt.value);
                    } else {
                      handleSelection(opt, behaviorContext || "Observation");
                    }
                  }} 
                />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 px-8 py-5 rounded-[2rem] rounded-tl-none flex items-center gap-4 text-teal-400 text-xs font-bold uppercase tracking-widest">
              <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
              Syncing Alignment...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 sm:p-10 pt-4 bg-gradient-to-t from-black/20 to-transparent">
        <div className="flex gap-3 sm:gap-4 bg-white/5 p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 focus-within:border-teal-500/50 focus-within:bg-white/10 transition-all shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe an action or observation..."
            className="flex-1 bg-transparent border-none px-4 sm:px-6 py-3 sm:py-4 text-slate-100 placeholder:text-slate-500 focus:outline-none font-medium text-sm sm:text-base min-w-0"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-4 sm:p-5 bg-[#0d9488] text-white rounded-full hover:bg-[#0f766e] disabled:bg-slate-700 disabled:text-slate-500 transition-all shadow-xl hover:scale-105 shrink-0"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditMode;
