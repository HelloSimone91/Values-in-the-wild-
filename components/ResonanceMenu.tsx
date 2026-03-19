
import React from 'react';
import { ResonanceOption } from '../types';
import { CheckCircle2, Gem } from 'lucide-react';

interface ResonanceMenuProps {
  options: ResonanceOption[];
  onSelect: (option: ResonanceOption) => void;
}

const ResonanceMenu: React.FC<ResonanceMenuProps> = ({ options, onSelect }) => {
  return (
    <div className="mt-8 space-y-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 text-teal-400 font-black uppercase tracking-[0.2em] text-[10px] mb-2 px-2">
        <Gem className="w-4 h-4" />
        <span>Resonance Menu: Select the Core Driver</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(option)}
            className="group relative flex flex-col p-6 bg-[#111d2e] border border-white/5 rounded-[2rem] shadow-xl hover:shadow-teal-900/20 hover:border-teal-500/40 transition-all duration-300 text-left overflow-hidden active:scale-95"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
            </div>
            
            {/* Subtle glow effect on hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
            
            <span className="relative z-10 text-xl font-black text-white mb-3 group-hover:text-teal-400 transition-colors uppercase tracking-tight">
              {option.value}
            </span>
            <p className="relative z-10 text-sm text-slate-400 leading-relaxed font-light group-hover:text-slate-300 transition-colors">
              {option.reason}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ResonanceMenu;