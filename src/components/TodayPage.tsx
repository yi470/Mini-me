import React, { useState, useEffect } from 'react';
import { useDiary } from '../context/DiaryContext';
import { formatEditorialDate } from '../utils/dateUtils';
import { computeEntryColor, getOptimalTextColor } from '../utils/colorUtils';
import { Check, Sparkles, RefreshCw, SlidersHorizontal, ArrowRight } from 'lucide-react';

export const TodayPage: React.FC = () => {
  const {
    palette,
    entries,
    saveEntry,
    todayIso,
    editingEntryDate,
    setEditingEntryDate,
    setActiveTab,
  } = useDiary();

  const targetDateIso = editingEntryDate || todayIso;
  const existingEntry = entries.find((e) => e.date === targetDateIso);

  // Form state
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [isCustomOverrideActive, setIsCustomOverrideActive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form when date or existing entry changes
  useEffect(() => {
    if (existingEntry) {
      setSelectedEmotions(existingEntry.emotions);
      setContent(existingEntry.content);
      if (existingEntry.customColorOverride) {
        setCustomColor(existingEntry.customColorOverride);
        setIsCustomOverrideActive(true);
      } else {
        setCustomColor(null);
        setIsCustomOverrideActive(false);
      }
    } else {
      setSelectedEmotions([]);
      setContent('');
      setCustomColor(null);
      setIsCustomOverrideActive(false);
    }
    setSaveSuccess(false);
  }, [existingEntry, targetDateIso]);

  // Handle emotion toggle (up to 2)
  const toggleEmotion = (emotionId: string) => {
    setSelectedEmotions((prev) => {
      if (prev.includes(emotionId)) {
        return prev.filter((id) => id !== emotionId);
      }
      if (prev.length >= 2) {
        // Replace the oldest selection (keep the 2nd and add the new one)
        return [prev[1], emotionId];
      }
      return [...prev, emotionId];
    });
  };

  // Compute the preview color
  const previewColor = computeEntryColor(
    selectedEmotions,
    palette,
    isCustomOverrideActive ? customColor : null
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedEmotions.length === 0) return;

    saveEntry({
      date: targetDateIso,
      content: content.trim(),
      emotions: selectedEmotions,
      customColorOverride: isCustomOverrideActive && customColor ? customColor : null,
      id: existingEntry?.id,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const selectedEmotionObjects = selectedEmotions
    .map((id) => palette.find((p) => p.id === id))
    .filter(Boolean);

  const isToday = targetDateIso === todayIso;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      {/* Editorial Header */}
      <div className="border-b border-[#EAE5DC] pb-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 text-stone-500 text-xs tracking-wider uppercase mb-3">
          <span>{isToday ? "Today's Entry" : 'Archival Entry'}</span>
          <div className="flex items-center gap-2">
            <span>{formatEditorialDate(targetDateIso)}</span>
            {!isToday && (
              <button
                type="button"
                onClick={() => setEditingEntryDate(todayIso)}
                className="cursor-pointer text-stone-800 underline hover:text-stone-900 transition-colors ml-2"
              >
                Return to Today
              </button>
            )}
          </div>
        </div>

        <h1 className="font-serif text-3xl md:text-5xl text-[#201D1A] font-normal tracking-tight">
          How are you feeling today?
        </h1>
        <p className="text-stone-600 text-sm mt-3 font-light leading-relaxed max-w-xl">
          Choose up to two emotions to blend your daily color, or customize your own shade.
          Every day adds a new square to your growing archive.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        {/* Emotion Palette Selection */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-medium uppercase tracking-widest text-stone-500">
              Select Emotions (Max 2)
            </label>
            <span className="text-xs text-stone-400">
              {selectedEmotions.length === 0 && 'Select 1 or 2 emotions'}
              {selectedEmotions.length === 1 && '1 selected · Select another to blend'}
              {selectedEmotions.length === 2 && '2 emotions blended'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {palette.map((emotion) => {
              const isSelected = selectedEmotions.includes(emotion.id);
              const selectionIndex = selectedEmotions.indexOf(emotion.id);
              const textColor = getOptimalTextColor(emotion.color);

              return (
                <button
                  key={emotion.id}
                  type="button"
                  onClick={() => toggleEmotion(emotion.id)}
                  className={`group relative text-left p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    isSelected
                      ? 'border-stone-800 shadow-sm ring-1 ring-stone-800 bg-white'
                      : 'border-[#EAE5DC] hover:border-stone-400 bg-white/70'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between w-full">
                    {/* Color Swatch Circle */}
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                      style={{ backgroundColor: emotion.color }}
                    />
                    {isSelected && (
                      <span className="text-[10px] font-mono text-stone-600 bg-stone-100 rounded-full w-4 h-4 flex items-center justify-center">
                        {selectionIndex + 1}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-stone-900">
                      {emotion.name}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400 block truncate">
                      {emotion.color}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Emotion Explanations (personal vocabulary) */}
          {selectedEmotionObjects.length > 0 && !isCustomOverrideActive && (
            <div className="mt-4 pt-3 border-t border-[#EAE5DC]/60 flex flex-wrap gap-x-6 gap-y-2 text-xs text-stone-500">
              {selectedEmotionObjects.map((e) => (
                <div key={e?.id} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: e?.color }}
                  />
                  <span className="font-medium text-stone-700">{e?.name}:</span>
                  <span className="italic font-serif text-stone-600">
                    "{e?.explanation}"
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live Color Canvas & Manual Override */}
        <section className="bg-white/90 border border-[#EAE5DC] rounded-xl p-6 transition-all shadow-2xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-stone-100 mb-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-stone-400 font-medium block">
                Visual Color Preview
              </span>
              <p className="text-sm text-stone-700 font-serif italic mt-0.5">
                {isCustomOverrideActive
                  ? 'Manual color override active'
                  : selectedEmotions.length === 0
                  ? 'Select emotion swatches above to see the blend'
                  : selectedEmotions.length === 1
                  ? `Single hue: ${selectedEmotionObjects[0]?.name}`
                  : `Soft gradient blend: ${selectedEmotionObjects[0]?.name} + ${selectedEmotionObjects[1]?.name}`}
              </p>
            </div>

            {/* Manual Override Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCustomOverrideActive(!isCustomOverrideActive)}
                className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${
                  isCustomOverrideActive
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {isCustomOverrideActive ? 'Using Custom Color' : 'Override Color Manually'}
              </button>

              {isCustomOverrideActive && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor || previewColor.color1}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-7 h-7 rounded border border-stone-300 cursor-pointer p-0.5 bg-white"
                    title="Choose custom color"
                  />
                  <span className="text-xs font-mono text-stone-600">
                    {customColor || previewColor.color1}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Color Canvas Showcase */}
          <div
            className="w-full h-32 md:h-40 rounded-lg transition-all duration-500 flex items-center justify-center relative overflow-hidden shadow-inner border border-stone-200/40"
            style={{
              background: previewColor.cssBackground,
            }}
          >
            {/* Subtle textured overlay */}
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/5 pointer-events-none" />

            <div className="relative z-10 text-center px-4 py-2 bg-white/75 backdrop-blur-md rounded-md border border-white/50 shadow-xs max-w-xs">
              <span className="font-serif text-xs md:text-sm text-stone-800 font-medium">
                {isCustomOverrideActive
                  ? 'Custom Hue'
                  : selectedEmotions.length > 0
                  ? selectedEmotionObjects.map((e) => e?.name).join(' & ')
                  : 'Unpainted Day'}
              </span>
              <span className="block text-[10px] font-mono text-stone-500 mt-0.5">
                {isCustomOverrideActive
                  ? customColor || previewColor.color1
                  : selectedEmotions.length === 2
                  ? `${selectedEmotionObjects[0]?.color} → ${selectedEmotionObjects[1]?.color}`
                  : previewColor.color1}
              </span>
            </div>
          </div>
        </section>

        {/* Large Journal Writing Area */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="journal-entry-text"
              className="text-xs font-medium uppercase tracking-widest text-stone-500"
            >
              Today's Journal
            </label>
            <span className="text-xs text-stone-400 font-light">
              {content.trim() ? `${content.trim().split(/\s+/).length} words` : 'Blank page'}
            </span>
          </div>

          <div className="relative bg-white border border-[#EAE5DC] rounded-xl focus-within:border-stone-600 focus-within:ring-1 focus-within:ring-stone-600 transition-all p-5 shadow-2xs">
            <textarea
              id="journal-entry-text"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind today? Let thoughts unfold at their own pace..."
              className="w-full bg-transparent resize-none border-none outline-none text-stone-800 font-serif text-lg leading-relaxed placeholder:font-serif placeholder:italic placeholder:text-stone-400 focus:ring-0 p-0"
            />
          </div>
        </section>

        {/* Save Bar & Feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#EAE5DC]">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-stone-800 font-medium py-1">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                Preserved in your color archive.
              </span>
            )}
            {existingEntry && !saveSuccess && (
              <span className="text-xs text-stone-500">
                Editing existing entry from this date.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {saveSuccess && (
              <button
                type="button"
                onClick={() => setActiveTab('archive')}
                className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors px-3 py-2"
              >
                View in Archive
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              disabled={!content.trim() && selectedEmotions.length === 0}
              className="cursor-pointer w-full sm:w-auto px-6 py-2.5 bg-[#201D1A] text-stone-100 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-widest font-medium rounded transition-all shadow-xs"
            >
              {existingEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
