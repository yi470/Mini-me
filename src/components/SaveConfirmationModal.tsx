import React from 'react';
import { JournalEntry } from '../types';
import { useDiary } from '../context/DiaryContext';
import {
  getMonthCalendarGrid,
  formatShortMonthYear,
  formatEditorialDate,
  parseIsoDate,
} from '../utils/dateUtils';
import { getOptimalTextColor } from '../utils/colorUtils';
import { Check, Sparkles, ArrowRight, BookOpen, X } from 'lucide-react';

interface SaveConfirmationModalProps {
  savedEntry: JournalEntry;
  onClose: () => void;
  onViewArchive: () => void;
}

export const SaveConfirmationModal: React.FC<SaveConfirmationModalProps> = ({
  savedEntry,
  onClose,
  onViewArchive,
}) => {
  const { entries, palette } = useDiary();

  const entryDate = parseIsoDate(savedEntry.date);
  const year = entryDate.getFullYear();
  const month = entryDate.getMonth();

  // Get calendar grid for the month of the saved entry
  const grid = getMonthCalendarGrid(year, month, new Date());
  
  // Make sure savedEntry is included in the map
  const entriesByIso = new Map(entries.map((e) => [e.date, e]));
  entriesByIso.set(savedEntry.date, savedEntry);

  const monthEntries = entries.filter((e) => {
    const d = parseIsoDate(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const emotionObjects = savedEntry.emotions
    .map((id) => palette.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFDF9] border border-[#EAE3D5] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 sm:p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success Icon & Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>

          <h2 className="font-serif text-2xl text-stone-900 font-medium tracking-tight">
            Your colors have been saved.
          </h2>

          <p className="text-xs text-stone-500 mt-1">
            {formatEditorialDate(savedEntry.date)}
          </p>

          {/* Newly saved color preview pill */}
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
              style={{ background: savedEntry.computedColor.cssBackground }}
            />
            <span className="font-medium text-stone-700">
              {emotionObjects.map((e) => e?.name).join(' & ') || 'Custom Color'}
            </span>
          </div>
        </div>

        {/* Monthly Palette Preview */}
        <div className="bg-[#FAF7F0] border border-[#EBE4D6] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-serif font-medium text-stone-800 text-sm">
              {formatShortMonthYear(entryDate)} Palette
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              {monthEntries.length} {monthEntries.length === 1 ? 'color' : 'colors'} recorded
            </span>
          </div>

          {/* Mini Calendar Grid of Colored Squares */}
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((cell) => {
              const entry = entriesByIso.get(cell.iso);
              const isNewlySaved = cell.iso === savedEntry.date;

              if (entry) {
                const textColor = getOptimalTextColor(entry.computedColor.color1);
                return (
                  <div
                    key={cell.iso}
                    className={`aspect-square rounded-md relative flex items-center justify-center transition-all ${
                      isNewlySaved
                        ? 'ring-2 ring-stone-900 ring-offset-2 scale-105 z-10 shadow-sm animate-pulse'
                        : 'opacity-95'
                    }`}
                    style={{ background: entry.computedColor.cssBackground }}
                    title={`${cell.iso}: ${entry.emotions.join(', ')}`}
                  >
                    <span
                      className="text-[9px] font-mono font-medium opacity-70"
                      style={{ color: textColor }}
                    >
                      {cell.dayNumber}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={cell.iso}
                  className={`aspect-square rounded-md border border-stone-200/50 flex items-center justify-center ${
                    cell.isCurrentMonth ? 'bg-white/60' : 'bg-stone-100/30 opacity-40'
                  }`}
                >
                  <span className="text-[9px] font-mono text-stone-300">
                    {cell.dayNumber}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-stone-500 italic">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
            <span>Outlined square marks your newly preserved entry</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={onViewArchive}
            className="cursor-pointer w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs uppercase tracking-wider font-medium inline-flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            View My Color Archive
          </button>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:border-stone-800 text-stone-700 hover:text-stone-950 text-xs uppercase tracking-wider font-medium transition-colors"
          >
            Continue Journaling
          </button>
        </div>
      </div>
    </div>
  );
};
