import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import {
  getMonthCalendarGrid,
  getWeekDays,
  formatShortMonthYear,
  formatEditorialDate,
  formatWeekRange,
  parseIsoDate,
} from '../utils/dateUtils';
import { getOptimalTextColor } from '../utils/colorUtils';
import { EntryModal } from './EntryModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Columns3,
  Info,
  CalendarDays,
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

  // Primary toggle: 'week' or 'month'
  const [paletteView, setPaletteView] = useState<'week' | 'month'>('month');

  // Navigation dates
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedFilterEmotion, setSelectedFilterEmotion] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    if (paletteView === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNext = () => {
    if (paletteView === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleResetCurrent = () => {
    setCurrentDate(new Date());
  };

  // Map entries by date ISO for fast lookup
  const entriesByIso = new Map(entries.map((e) => [e.date, e]));

  // Month data
  const monthGrid = getMonthCalendarGrid(year, month, new Date());
  const currentMonthEntries = entries.filter((e) => {
    const d = parseIsoDate(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Week data
  const weekDays = getWeekDays(currentDate, todayIso);
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[6].date;
  const currentWeekEntries = weekDays
    .map((day) => entriesByIso.get(day.iso))
    .filter(Boolean);

  const handleEditEntry = (date: string) => {
    setEditingEntryDate(date);
    setActiveTab('today');
  };

  const handleDayClick = (iso: string) => {
    const existing = entriesByIso.get(iso);
    if (existing) {
      setSelectedEntryForView(existing);
    } else {
      setEditingEntryDate(iso);
      setActiveTab('today');
    }
  };

  const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 md:py-14 animate-in fade-in duration-300">
      {/* Sample entries banner if present */}
      {hasSampleEntries && (
        <div className="mb-8 p-4 bg-[#FFF9EE] border border-[#F0E4C9] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-700 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Sample entries are currently displayed in your archive. You can remove them at any time to start completely fresh.
            </span>
          </div>
          <button
            type="button"
            onClick={removeSampleEntries}
            className="cursor-pointer font-semibold underline text-stone-900 hover:text-black whitespace-nowrap shrink-0"
          >
            Remove Sample Entries
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="border-b border-[#EAE3D5] pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#78D6AE]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Visual Archive
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl text-[#201D1A] font-normal tracking-tight">
              Color Archive
            </h1>
            <p className="text-stone-600 text-sm mt-2 font-light max-w-xl">
              An evolving mosaic where each day is painted in your chosen mood hues.
              Inspect any square to read or edit past reflections.
            </p>
          </div>

          {/* Stepper Navigator */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetCurrent}
              className="cursor-pointer text-xs uppercase tracking-wider px-3.5 py-2 border border-stone-300 rounded-xl hover:border-stone-800 text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs font-medium"
            >
              {paletteView === 'week' ? 'This Week' : 'This Month'}
            </button>

            <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={handlePrev}
                className="cursor-pointer p-2 text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label={paletteView === 'week' ? 'Previous Week' : 'Previous Month'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-serif font-medium text-stone-900 min-w-[160px] text-center">
                {paletteView === 'week'
                  ? formatWeekRange(weekStart, weekEnd)
                  : formatShortMonthYear(currentDate)}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="cursor-pointer p-2 text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label={paletteView === 'week' ? 'Next Week' : 'Next Month'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Segmented View Switcher & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-[#EAE3D5]/80 text-xs">
          {/* Segmented Control: Week vs Month */}
          <div className="flex items-center p-1 bg-[#F5EFE6] rounded-xl border border-stone-200/60 shadow-inner">
            <button
              type="button"
              onClick={() => setPaletteView('week')}
              className={`cursor-pointer px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                paletteView === 'week'
                  ? 'bg-white shadow-xs text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5 text-stone-600" />
              This Week
            </button>

            <button
              type="button"
              onClick={() => setPaletteView('month')}
              className={`cursor-pointer px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                paletteView === 'month'
                  ? 'bg-white shadow-xs text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-stone-600" />
              This Month
            </button>
          </div>

          {/* Emotion Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-stone-400 uppercase tracking-wider shrink-0 text-[11px] mr-1">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setSelectedFilterEmotion('all')}
              className={`cursor-pointer px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 text-xs ${
                selectedFilterEmotion === 'all'
                  ? 'bg-stone-900 text-white font-medium shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
              }`}
            >
              All Colors
            </button>
            {palette.slice(0, 8).map((emo) => {
              const isActive = selectedFilterEmotion === emo.id;
              return (
                <button
                  key={emo.id}
                  type="button"
                  onClick={() => setSelectedFilterEmotion(emo.id)}
                  className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 text-xs ${
                    isActive
                      ? 'bg-stone-900 text-white font-medium shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: emo.color }}
                  />
                  <span>{emo.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIEW 1: THIS WEEK VIEW */}
      {paletteView === 'week' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const entry = entriesByIso.get(day.iso);
              const matchesFilter =
                selectedFilterEmotion === 'all' ||
                (entry && entry.emotions.includes(selectedFilterEmotion));
              const isDimmed = selectedFilterEmotion !== 'all' && entry && !matchesFilter;

              if (entry) {
                const textColor = getOptimalTextColor(entry.computedColor.color1);
                const emotionObjs = entry.emotions
                  .map((id) => palette.find((p) => p.id === id))
                  .filter(Boolean);

                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => handleDayClick(day.iso)}
                    className={`cursor-pointer group relative rounded-2xl p-4 text-left flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-black/5 overflow-hidden min-h-[220px] sm:min-h-[260px] ${
                      isDimmed ? 'opacity-30' : 'opacity-100'
                    } ${day.isToday ? 'ring-2 ring-stone-900 ring-offset-2' : ''}`}
                    style={{ background: entry.computedColor.cssBackground }}
                  >
                    {/* Subtle contrast gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 opacity-70 group-hover:opacity-40 transition-opacity pointer-events-none" />

                    {/* Top Day Info */}
                    <div className="relative z-10 flex items-start justify-between w-full">
                      <div>
                        <span
                          className="text-xs uppercase tracking-wider font-semibold block"
                          style={{ color: textColor }}
                        >
                          {day.dayShort}
                        </span>
                        <span
                          className="font-serif text-2xl font-medium block"
                          style={{ color: textColor }}
                        >
                          {day.dayNumber}
                        </span>
                      </div>

                      {day.isToday && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-xs uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Bottom Preview Snippet & Emotions */}
                    <div className="relative z-10 pt-4">
                      {entry.content && (
                        <p
                          className="font-serif text-xs line-clamp-3 leading-relaxed mb-3 opacity-90 drop-shadow-2xs"
                          style={{ color: textColor }}
                        >
                          "{entry.content}"
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {emotionObjs.map((emo) => (
                          <span
                            key={emo?.id}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/80 text-stone-900 backdrop-blur-2xs shadow-2xs"
                          >
                            {emo?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              }

              // Empty day in week
              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => handleDayClick(day.iso)}
                  className={`group relative rounded-2xl border border-[#EAE3D5] bg-white/70 hover:bg-white hover:border-stone-400 p-4 text-left flex flex-col justify-between transition-all duration-200 cursor-pointer min-h-[220px] sm:min-h-[260px] shadow-2xs ${
                    day.isToday ? 'ring-2 ring-stone-900 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 group-hover:text-stone-700 transition-colors block">
                        {day.dayShort}
                      </span>
                      <span className="font-serif text-2xl text-stone-500 font-medium block">
                        {day.dayNumber}
                      </span>
                    </div>

                    {day.isToday && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="text-center py-6">
                    <span className="text-xs text-stone-400 group-hover:text-stone-800 transition-colors font-medium">
                      + Write Entry
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-300 font-serif italic text-right">
                    Unpainted
                  </div>
                </button>
              );
            })}
          </div>

          {/* Week Summary */}
          <div className="pt-6 border-t border-[#EAE3D5]/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <span className="font-serif italic text-sm text-stone-700">
              {currentWeekEntries.length === 0
                ? 'No colors preserved for this week yet.'
                : `${currentWeekEntries.length} of 7 days preserved in this week’s palette.`}
            </span>
            <span className="text-stone-400">
              Click any square to open its journal reflection or write for that date.
            </span>
          </div>
        </div>
      ) : (
        /* VIEW 2: THIS MONTH VIEW (Existing Calendar-style Layout) */
        <div className="space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 md:gap-3 text-center">
            {weekdayNames.map((name) => (
              <span
                key={name}
                className="text-[11px] font-semibold tracking-wider uppercase text-stone-400 py-1"
              >
                {name}
              </span>
            ))}
          </div>

          {/* 7-column Calendar Matrix of Squares */}
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {monthGrid.map((cell) => {
              const entry = entriesByIso.get(cell.iso);
              const matchesFilter =
                selectedFilterEmotion === 'all' ||
                (entry && entry.emotions.includes(selectedFilterEmotion));
              const isDimmed = selectedFilterEmotion !== 'all' && entry && !matchesFilter;

              if (entry) {
                const textColor = getOptimalTextColor(entry.computedColor.color1);

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => handleDayClick(cell.iso)}
                    className={`cursor-pointer group relative aspect-square rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.04] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-stone-600 ${
                      isDimmed ? 'opacity-25' : 'opacity-100'
                    } ${cell.isToday ? 'ring-2 ring-stone-900 ring-offset-2' : ''}`}
                    style={{
                      background: entry.computedColor.cssBackground,
                    }}
                    title={`${formatEditorialDate(cell.iso)} — Click to read reflection`}
                  >
                    <div className="absolute inset-0 bg-radial from-transparent to-black/10 opacity-30 group-hover:opacity-10 transition-opacity" />

                    {/* Day number */}
                    <span
                      className="absolute top-2 left-2 text-[11px] md:text-xs font-mono font-bold drop-shadow-2xs opacity-85 group-hover:opacity-100"
                      style={{ color: textColor }}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Today badge if current day */}
                    {cell.isToday && (
                      <span className="absolute bottom-1.5 right-1.5 text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-2xs">
                        Today
                      </span>
                    )}
                  </button>
                );
              }

              // Empty neutral square
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => handleDayClick(cell.iso)}
                  className={`group relative aspect-square rounded-xl border border-[#EAE3D5] transition-all duration-200 hover:border-stone-400 hover:bg-stone-50 flex flex-col justify-between p-2 text-left cursor-pointer ${
                    cell.isCurrentMonth ? 'bg-white/60' : 'bg-stone-100/40 opacity-40'
                  } ${cell.isToday ? 'ring-2 ring-stone-900 ring-offset-2' : ''}`}
                  title={`${formatEditorialDate(cell.iso)} — Click to write an entry`}
                >
                  <span className="text-[11px] md:text-xs font-mono text-stone-400 group-hover:text-stone-700 transition-colors">
                    {cell.dayNumber}
                  </span>

                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-stone-500 font-medium">
                    + write
                  </span>
                </button>
              );
            })}
          </div>

          {/* Month Summary Caption */}
          <div className="pt-8 border-t border-[#EAE3D5]/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <span className="font-serif italic text-sm text-stone-700">
              {currentMonthEntries.length === 0
                ? `No entries recorded in ${formatShortMonthYear(currentDate)} yet.`
                : `${currentMonthEntries.length} reflection${
                    currentMonthEntries.length > 1 ? 's' : ''
                  } preserved in ${formatShortMonthYear(currentDate)}.`}
            </span>
            <div className="flex items-center gap-4 text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md border border-stone-300 bg-white" />
                Empty Canvas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-gradient-to-br from-[#FFCF55] to-[#78D6AE]" />
                Preserved Day
              </span>
            </div>
          </div>
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
