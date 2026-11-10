import React from 'react';
import { ViewTab } from '../types';
import { useDiary } from '../context/DiaryContext';

interface NavigationProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const { entries, todayIso, setEditingEntryDate } = useDiary();
  const todayEntry = entries.find((e) => e.date === todayIso);

  const handleWriteToday = () => {
    setEditingEntryDate(todayIso);
    onSelectTab('today');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-[#EAE3D5]/80 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab('today')}
          className="text-left group cursor-pointer flex items-center gap-2.5"
          aria-label="In My Colors Home"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#FFCF55] via-[#FF8A65] to-[#78D6AE] shadow-2xs group-hover:scale-125 transition-transform" />
          <span className="font-serif text-2xl tracking-normal text-[#201D1A] group-hover:text-stone-600 transition-colors whitespace-nowrap shrink-0">
            In My Colors
          </span>
        </button>

        {/* Zone 2: Editorial Navigation Links */}
        <nav className="flex items-center gap-7 text-sm">
          <button
            onClick={() => onSelectTab('today')}
            className={`cursor-pointer whitespace-nowrap shrink-0 py-1 transition-all relative ${
              activeTab === 'today'
                ? 'text-[#201D1A] font-semibold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
          >
            Today
            {activeTab === 'today' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#201D1A] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('archive')}
            className={`cursor-pointer whitespace-nowrap shrink-0 py-1 transition-all relative ${
              activeTab === 'archive'
                ? 'text-[#201D1A] font-semibold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
          >
            Color Archive
            {activeTab === 'archive' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#201D1A] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('palette')}
            className={`cursor-pointer whitespace-nowrap shrink-0 py-1 transition-all relative ${
              activeTab === 'palette'
                ? 'text-[#201D1A] font-semibold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
          >
            My Palette
            {activeTab === 'palette' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#201D1A] rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={handleWriteToday}
            className="cursor-pointer text-xs uppercase tracking-wider px-4 py-2 border border-stone-300 rounded-xl hover:border-stone-900 text-stone-800 hover:text-black bg-white hover:bg-stone-50 transition-all font-semibold shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
          >
            {todayEntry ? 'Review Today' : 'Write Today'}
          </button>
        </div>
      </div>
    </header>
  );
};
