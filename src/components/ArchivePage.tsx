import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import {
  getMonthCalendarGrid,
  formatShortMonthYear,
  formatEditorialDate,
  formatDateToIso,
  parseIsoDate,
} from '../utils/dateUtils';
import { getOptimalTextColor } from '../utils/colorUtils';
import { EntryModal } from './EntryModal';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar as CalendarIcon,
  LayoutGrid,
  Info,
  PenLine,
} from 'lucide-react';

export const ArchivePage: React.FC = () => {
  const {
    entries,
    palette,
    selectedEntryForView,
    setSelectedEntryForView,
    setEditingEntryDate,
    setActiveTab,
    removeSampleEntries,
    hasSampleEntries,
    todayIso,
  } = useDiary();

  // Navigation state for month viewing
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedFilterEmotion, setSelectedFilterEmotion] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'stream'>('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const grid = getMonthCalendarGrid(year, month, new Date());

  // Map entries by date ISO for O(1) lookup
  const entriesByIso = new Map(entries.map((e) => [e.date, e]));

  // Count painted days in current month
  const currentMonthEntries = entries.filter((e) => {
    const d = parseIsoDate(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const handleEditEntry = (date: string) => {
    setEditingEntryDate(date);
    setActiveTab('today');
  };

  const handleDayClick = (iso: string) => {
    const existing = entriesByIso.get(iso);
    if (existing) {
      setSelectedEntryForView(existing);
    } else {
      // Prompt to create an entry for that date
      setEditingEntryDate(iso);
      setActiveTab('today');
    }
  };

  const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      {/* Sample entries banner if present */}
      {hasSampleEntries && (
        <div className="mb-8 p-3.5 bg-[#F5F1E8] border border-[#E5DEC9] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-700">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-stone-500 shrink-0" />
            <span>
              Sample entries are currently displayed in the calendar. You can remove them at any time to start completely fresh.
            </span>
          </div>
          <button
            type="button"
            onClick={removeSampleEntries}
            className="cursor-pointer font-medium underline text-stone-800 hover:text-stone-950 whitespace-nowrap shrink-0"
          >
            Remove Sample Entries
          </button>
        </div>
      )}

      {/* Header & Month Navigator */}
      <div className="border-b border-[#EAE5DC] pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-medium uppercase tracking-widest text-stone-400 block mb-1">
              Visual Archive
            </span>
            <h1 className="font-serif text-3xl md:text-5xl text-[#201D1A] font-normal tracking-tight">
              Color Archive
            </h1>
            <p className="text-stone-600 text-sm mt-2 font-light max-w-xl">
              A monthly mosaic where each day is rendered in the color of your emotions.
              Click any square to read or edit past reflections.
            </p>
          </div>

          {/* Month Stepper & Today button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToToday}
              className="cursor-pointer text-xs uppercase tracking-wider px-3 py-1.5 border border-stone-300 rounded hover:border-stone-800 text-stone-700 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center border border-stone-300 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={prevMonth}
                className="cursor-pointer p-2 text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-serif font-medium text-stone-800 min-w-[140px] text-center">
                {formatShortMonthYear(currentDate)}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="cursor-pointer p-2 text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters & View switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-[#EAE5DC]/60 text-xs">
          {/* Emotion Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-stone-400 uppercase tracking-wider shrink-0 text-[11px]">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setSelectedFilterEmotion('all')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 ${
                selectedFilterEmotion === 'all'
                  ? 'bg-stone-900 text-white font-medium'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100'
              }`}
            >
              All Colors
            </button>
            {palette.map((emo) => {
              const isActive = selectedFilterEmotion === emo.id;
              return (
                <button
                  key={emo.id}
                  type="button"
                  onClick={() => setSelectedFilterEmotion(emo.id)}
                  className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-stone-900 text-white font-medium'
                      : 'text-stone-600 hover:text-stone-900 bg-stone-100'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: emo.color }}
                  />
                  <span>{emo.name}</span>
                </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`cursor-pointer px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                viewMode === 'calendar' ? 'bg-white shadow-2xs text-stone-900 font-medium' : 'text-stone-500'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Calendar Mosaic
            </button>
            <button
              type="button"
              onClick={() => setViewMode('stream')}
              className={`cursor-pointer px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                viewMode === 'stream' ? 'bg-white shadow-2xs text-stone-900 font-medium' : 'text-stone-500'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              Chronicle Stream
            </button>
          </div>
        </div>
      </div>

      {/* Main Artwork Grid */}
      {viewMode === 'calendar' ? (
        <div className="space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 md:gap-3 text-center">
            {weekdayNames.map((name) => (
              <span
                key={name}
                className="text-[11px] font-medium tracking-wider uppercase text-stone-400 py-1"
              >
                {name}
              </span>
            ))}
          </div>

          {/* 7-column Calendar Matrix of Squares */}
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {grid.map((cell) => {
              const entry = entriesByIso.get(cell.iso);
              const matchesFilter =
                selectedFilterEmotion === 'all' ||
                (entry && entry.emotions.includes(selectedFilterEmotion));

              const isDimmed = selectedFilterEmotion !== 'all' && entry && !matchesFilter;

              if (entry) {
                // Colored square for day with entry
                const isSingle = !entry.computedColor.isGradient;
                const textColor = getOptimalTextColor(entry.computedColor.color1);

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => handleDayClick(cell.iso)}
                    className={`cursor-pointer group relative aspect-square rounded-md overflow-hidden transition-all duration-300 transform hover:scale-[1.03] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-stone-600 ${
                      isDimmed ? 'opacity-25' : 'opacity-100'
                    } ${cell.isToday ? 'ring-2 ring-stone-900 ring-offset-2' : ''}`}
                    style={{
                      background: entry.computedColor.cssBackground,
                    }}
                    title={`${formatEditorialDate(cell.iso)} — Click to read reflection`}
                  >
                    {/* Subtle internal gradient shade */}
                    <div className="absolute inset-0 bg-radial from-transparent to-black/10 opacity-40 group-hover:opacity-10 transition-opacity" />

                    {/* Day number */}
                    <span
                      className="absolute top-2 left-2 text-[11px] md:text-xs font-mono font-medium drop-shadow-2xs opacity-80 group-hover:opacity-100"
                      style={{ color: textColor }}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Today indicator label if current day */}
                    {cell.isToday && (
                      <span
                        className="absolute bottom-1.5 right-1.5 text-[9px] uppercase tracking-wider font-mono px-1 py-0.5 rounded bg-black/30 text-white backdrop-blur-2xs"
                      >
                        Today
                      </span>
                    )}
                  </button>
                );
              }

              // Empty neutral square for day without entry
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => handleDayClick(cell.iso)}
                  className={`group relative aspect-square rounded-md border border-[#EAE5DC] transition-all duration-200 hover:border-stone-400 hover:bg-stone-50/80 flex flex-col justify-between p-2 text-left cursor-pointer ${
                    cell.isCurrentMonth ? 'bg-white/40' : 'bg-stone-100/40 opacity-40'
                  } ${cell.isToday ? 'ring-2 ring-stone-900 ring-offset-2' : ''}`}
                  title={`${formatEditorialDate(cell.iso)} — Click to write an entry`}
                >
                  <span className="text-[11px] md:text-xs font-mono text-stone-400 group-hover:text-stone-700 transition-colors">
                    {cell.dayNumber}
                  </span>

                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-stone-400 italic">
                    + write
                  </span>
                </button>
              );
            })}
          </div>

          {/* Catalog Caption & Summary */}
          <div className="pt-8 border-t border-[#EAE5DC]/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <span className="font-serif italic text-sm text-stone-600">
              {currentMonthEntries.length === 0
                ? `No entries recorded in ${formatShortMonthYear(currentDate)} yet.`
                : `${currentMonthEntries.length} reflection${
                    currentMonthEntries.length > 1 ? 's' : ''
                  } preserved in ${formatShortMonthYear(currentDate)}.`}
            </span>
            <div className="flex items-center gap-4 text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs border border-stone-300 bg-white" />
                Empty Canvas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-gradient-to-br from-[#F2CB85] to-[#A6C4B7]" />
                Preserved Day
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Chronicle Stream View (chronological entries list) */
        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="text-center py-16 bg-white/60 border border-dashed border-[#EAE5DC] rounded-xl">
              <p className="font-serif text-lg text-stone-500 italic">
                Your archive is quiet. Begin by writing today's first reflection.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('today')}
                className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs uppercase tracking-wider rounded"
              >
                Write First Entry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entries
                .filter(
                  (e) =>
                    selectedFilterEmotion === 'all' ||
                    e.emotions.includes(selectedFilterEmotion)
                )
                .map((entry) => {
                  const emotionObjs = entry.emotions
                    .map((id) => palette.find((p) => p.id === id))
                    .filter(Boolean);

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntryForView(entry)}
                      className="bg-white border border-[#EAE5DC] hover:border-stone-400 rounded-xl p-5 cursor-pointer transition-all hover:shadow-xs group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className="text-xs font-serif text-stone-500">
                            {formatEditorialDate(entry.date)}
                          </span>
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ background: entry.computedColor.cssBackground }}
                          />
                        </div>

                        <p className="font-serif text-stone-800 text-sm line-clamp-3 leading-relaxed">
                          {entry.content || (
                            <span className="italic text-stone-400">
                              (Color expression without words)
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          {emotionObjs.map((emo) => (
                            <span
                              key={emo?.id}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700"
                            >
                              {emo?.name}
                            </span>
                          ))}
                        </div>
                        <span className="text-stone-400 group-hover:text-stone-800 font-serif italic text-xs transition-colors">
                          Read reflection →
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Selected Entry Detail Modal */}
      {selectedEntryForView && (
        <EntryModal
          entry={selectedEntryForView}
          onClose={() => setSelectedEntryForView(null)}
          onEdit={handleEditEntry}
        />
      )}
    </div>
  );
};
