import React, { useState } from 'react';
import { BookOpenText, History, LibraryBig, UserCircle2 } from 'lucide-react';
import HistoryView from './components/HistoryView';
import PracticeView from './components/PracticeView';
import ValuesLibraryView from './components/ValuesLibraryView';
import { AppView } from './stitchData';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('library');

  const navItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'library', label: 'Library', icon: LibraryBig },
    { id: 'practice', label: 'Practice', icon: BookOpenText },
    { id: 'history', label: 'History', icon: History },
  ];

  const renderView = () => {
    switch (view) {
      case 'practice':
        return <PracticeView />;
      case 'history':
        return <HistoryView />;
      case 'library':
      default:
        return <ValuesLibraryView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] text-[#1e1b18]">
      <header className="sticky top-0 z-50 border-b border-[#efe6df] bg-[rgba(255,248,243,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex min-w-0 flex-col">
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black tracking-[-0.05em] text-[#35680e]">Valu</span>
            <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8a7668]">Digital curator</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`font-['Plus_Jakarta_Sans'] text-sm font-bold tracking-tight transition-colors ${active ? 'border-b-2 border-[#35680e] pb-1 text-[#35680e]' : 'text-[#85786e] hover:text-[#35680e]'}`}
                >
                  {item.label}
                  <Icon className="hidden" />
                </button>
              );
            })}
          </nav>

          <button className="rounded-full p-2 text-[#35680e] transition-colors hover:bg-[#f1ebe5]">
            <UserCircle2 className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-28 pt-10 sm:px-6 md:px-8 md:pb-16 md:pt-14">{renderView()}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#efe6df] bg-[rgba(255,248,243,0.88)] px-4 pb-6 pt-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex min-h-[64px] flex-col items-center justify-center rounded-full px-3 py-2 transition-all ${active ? 'bg-[#35680e] text-white shadow-[0_16px_28px_rgba(53,104,14,0.2)]' : 'text-[#85786e]'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 font-['Inter'] text-[10px] font-bold uppercase tracking-[0.18em]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;
