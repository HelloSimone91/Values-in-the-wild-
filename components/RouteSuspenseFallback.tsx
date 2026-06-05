import React from 'react';
import { Loader2 } from 'lucide-react';

export const RouteSuspenseFallback: React.FC = () => (
  <div className="flex min-h-[50vh] items-center justify-center animate-in fade-in duration-500">
    <div className="flex flex-col items-center gap-4 text-[#8a7668]">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="font-['Plus_Jakarta_Sans'] text-sm font-semibold uppercase tracking-widest">
        Loading...
      </p>
    </div>
  </div>
);
