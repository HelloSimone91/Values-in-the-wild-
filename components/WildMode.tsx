
import React, { useState } from 'react';
import { ResonanceOption, ValueEntry } from '../types';
import { analyzeBehavior } from '../services/geminiService';
import ResonanceMenu from './ResonanceMenu';
import { Loader2, Zap, Save } from 'lucide-react';

interface WildModeProps {
  onSaveValue: (entry: ValueEntry) => void;
}

const WildMode: React.FC<WildModeProps> = ({ onSaveValue }) => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<ResonanceOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setOptions(null);
    setSuccessMessage(null);

    try {
      const result = await analyzeBehavior(input, "Wild Observation");
      setOptions(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (option: ResonanceOption) => {
    onSaveValue({
      id: Date.now().toString(),
      value: option.value,
      pillar: 'Wild',
      sourceAction: input,
      timestamp: Date.now()
    });
    setSuccessMessage(`IDENTIFIED: "${option.value}"`);
    setOptions(null);
    setInput('');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto w-full pt-4 sm:pt-10 px-2 sm:px-4">
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase italic">Values Observation Log</h2>
        <p className="text-base sm:text-lg text-slate-300/70 font-light max-w-lg mx-auto leading-relaxed">
          See where your values are showing up in your life in real-time. Log your observations to capture the evidence of who you are becoming.
        </p>
      </div>

      <div className="bg-[#162940]/60 backdrop-blur-sm p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-amber-500 to-rose-500 opacity-50"></div>
        
        <label className="block text-[11px] font-black text-teal-400 mb-5 ml-2 uppercase tracking-[0.4em]">
          Observation Stream
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I noticed that I... (Focus on the physical action)"
          className="w-full h-36 sm:h-40 p-5 sm:p-8 bg-black/20 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] text-slate-100 placeholder:text-slate-600 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/30 resize-none transition-all font-medium text-base sm:text-lg leading-relaxed shadow-inner"
        />
        
        <div className="mt-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="text-[10px] text-slate-500 font-bold italic tracking-wide">
             LOG THE MOMENT. UNCOVER THE VALUE.
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !input.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-4 px-8 sm:px-10 py-4 sm:py-5 bg-[#0d9488] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#0f766e] disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 text-amber-400" />}
            Analyze
          </button>
        </div>
      </div>

      {options && (
        <div className="mt-12 animate-in fade-in zoom-in-95 duration-500">
          <ResonanceMenu options={options} onSelect={handleSelect} />
        </div>
      )}

      {successMessage && (
        <div className="mt-10 p-6 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[2rem] text-center font-black flex items-center justify-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-lg uppercase tracking-[0.2em] text-xs">
          <Save className="w-5 h-5" />
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default WildMode;
