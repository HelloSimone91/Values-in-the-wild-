
import React, { useState } from 'react';
import { Mode, ValueEntry } from '../types';
import { generateSynthesis } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Sparkles, Loader2, BookOpen, BarChart3, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SynthesisModeProps {
  entries: ValueEntry[];
}

const SynthesisMode: React.FC<SynthesisModeProps> = ({ entries }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const dataMap = entries.reduce((acc, entry) => {
    const key = entry.pillar === 'Wild' ? 'Wild' : entry.pillar;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(dataMap).map(key => ({
    name: key,
    value: dataMap[key]
  }));

  const COLORS = ['#0d9488', '#c084fc', '#f59e0b', '#be123c', '#fb923c', '#8b5cf6', '#ec4899', '#06b6d4'];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSynthesis(entries);
      setInsight(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPlan = () => {
    window.dispatchEvent(new CustomEvent('changeMode', { detail: Mode.ACTION_PLAN }));
  };

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-12 text-center lg:text-left">
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase">Synthesis</h2>
        <p className="text-lg sm:text-xl text-slate-300/80 font-light mt-3">Synthesizing patterns from your behavioral field notes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
        <div className="space-y-6 sm:space-y-10">
          {/* Chart Card */}
          <div className="bg-[#162940]/60 backdrop-blur-sm p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">Living Distribution</h3>
            </div>
            <div className="h-64 sm:h-72 w-full">
               {entries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111d2e', border: 'none', borderRadius: '1rem', color: '#fff' }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-[10px]">
                   No Evidence Collected
                 </div>
               )}
            </div>
          </div>

          {/* List Card */}
          <div className="bg-[#162940]/60 backdrop-blur-sm p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl max-h-[500px] overflow-y-auto">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Field Notes</h3>
                </div>
                <span className="text-[10px] font-black text-teal-400 bg-teal-500/10 px-4 py-1.5 rounded-full border border-teal-500/20 uppercase tracking-widest">{entries.length} SAMPLES</span>
             </div>
             {entries.length === 0 ? (
               <div className="text-center py-10 opacity-30">
                  <Zap className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-xs uppercase font-black tracking-widest">Awaiting Behavioral Data</p>
               </div>
             ) : (
               <ul className="space-y-6">
                 {entries.slice().reverse().map((entry) => (
                   <li key={entry.id} className="bg-white/5 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 hover:border-teal-500/30 transition-all duration-300 group">
                     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                       <span className="font-black text-lg sm:text-xl text-white group-hover:text-teal-400 transition-colors uppercase tracking-tight">{entry.value}</span>
                       <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(entry.timestamp).toLocaleDateString()}</span>
                     </div>
                     <p className="text-sm text-slate-400 italic mb-4">"{entry.sourceAction}"</p>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20">
                       {entry.pillar.toUpperCase()}
                     </span>
                   </li>
                 ))}
               </ul>
             )}
          </div>
        </div>

        {/* AI Synthesis */}
        <div className="flex flex-col h-full">
          <div className="bg-gradient-to-br from-teal-500/20 to-amber-500/20 rounded-[2.5rem] sm:rounded-[3.5rem] p-[1px] h-full shadow-2xl">
            <div className="bg-[#111d2e] rounded-[2.4rem] sm:rounded-[3.4rem] p-5 sm:p-12 h-full flex flex-col">
              <div className="flex flex-col gap-5 mb-8 sm:mb-10">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                    <Sparkles className="w-8 h-8 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">The Report</h3>
                    <p className="text-teal-400/60 text-[10px] font-black uppercase tracking-widest mt-1">Wisdom Engine Synthesis</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || entries.length === 0}
                    className="w-full sm:w-auto px-6 py-3 bg-[#0d9488] text-white rounded-xl font-black uppercase tracking-widest hover:bg-[#0f766e] transition-all disabled:opacity-20 flex items-center justify-center gap-3 text-xs"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Report'}
                  </button>
                  <button
                    onClick={handleOpenPlan}
                    disabled={entries.length < 5}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-500/90 text-[#111d2e] rounded-xl font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-20 text-xs"
                  >
                    Build 7-Day Plan
                  </button>
                </div>
              </div>

              <div className="flex-1 rounded-[1.5rem] sm:rounded-[2rem] overflow-y-auto scrollbar-hide bg-black/10 p-5 sm:p-8 border border-white/5">
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center text-teal-400/50 gap-5">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Deconstructing behavioral nodes...</span>
                  </div>
                ) : insight ? (
                  <div className="prose prose-invert prose-teal prose-sm max-w-none text-slate-300">
                    <ReactMarkdown>{insight}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                    <Sparkles className="w-16 h-16 text-slate-600" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] max-w-[180px] leading-relaxed">
                      A baseline of 3-5 observations is required for full synthesis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynthesisMode;
