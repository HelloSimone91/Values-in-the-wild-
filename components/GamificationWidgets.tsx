import React from 'react';
import { Flame, Medal, Trophy, Star } from 'lucide-react';
import type { ReflectionEntry } from '../valueTypes';
import { calculateStreak } from "../stitchData";

export const getBadges = (reflections: ReflectionEntry[]) => {
  const badges = [];
  const streak = calculateStreak(reflections);
  const uniqueValues = new Set(reflections.map(r => r.value)).size;

  if (reflections.length >= 1) {
    badges.push({ id: 'first-step', name: 'First Step', icon: Star, description: 'Wrote your first field note', color: 'text-yellow-500', bg: 'bg-yellow-50' });
  }
  if (reflections.length >= 5) {
    badges.push({ id: 'consistent', name: 'Consistent', icon: Medal, description: 'Wrote 5 field notes', color: 'text-blue-500', bg: 'bg-blue-50' });
  }
  if (uniqueValues >= 3) {
    badges.push({ id: 'explorer', name: 'Value Explorer', icon: Trophy, description: 'Explored 3 different values', color: 'text-purple-500', bg: 'bg-purple-50' });
  }
  if (streak >= 3) {
    badges.push({ id: 'streak-3', name: 'On Fire', icon: Flame, description: '3 day streak', color: 'text-orange-500', bg: 'bg-orange-50' });
  }

  return badges;
};

interface GamificationProps {
  reflections: ReflectionEntry[];
}

export const GamificationWidgets: React.FC<GamificationProps> = ({ reflections }) => {
  const streak = calculateStreak(reflections);
  const badges = getBadges(reflections);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#efe6df] flex items-center justify-between">
        <div>
          <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#1e1b18]">Current Streak</h3>
          <p className="text-xs text-[#6f6258] mt-1">Keep it up to build a habit!</p>
        </div>
        <div className="flex items-center gap-2 bg-[#fff8f3] px-4 py-2 rounded-full border border-[#f1ebe5]">
          <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-500' : 'text-[#cbbcaf]'}`} />
          <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1e1b18]">{streak}</span>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#efe6df]">
          <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#1e1b18] mb-4">Badges Earned</h3>
          <div className="grid grid-cols-2 gap-3">
            {badges.map(badge => {
              const Icon = badge.icon;
              return (
                <div key={badge.id} className={`flex items-start gap-3 p-3 rounded-xl ${badge.bg} border border-[#efe6df]/50`}>
                  <div className={`p-2 bg-white rounded-lg shadow-sm ${badge.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#1e1b18]">{badge.name}</p>
                    <p className="text-[10px] text-[#6f6258] mt-0.5 leading-tight">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
