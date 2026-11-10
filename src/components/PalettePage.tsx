import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { RotateCcw, Check, Info, Search, Sparkles } from 'lucide-react';

export const PalettePage: React.FC = () => {
  const { palette, updateEmotion, resetPalette } = useDiary();

  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleColorChange = (id: string, color: string, currentExplanation: string) => {
    updateEmotion(id, color, currentExplanation);
    notifySaved(id);
  };

  const handleExplanationChange = (id: string, currentColor: string, explanation: string) => {
    updateEmotion(id, currentColor, explanation);
  };

  const notifySaved = (id: string) => {
    setSavedNotification(id);
    setTimeout(() => {
      setSavedNotification((current) => (current === id ? null : current));
    }, 2000);
  };

  const filteredPalette = palette.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 md:py-14 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-[#EAE3D5] pb-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#BAA1FF]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Personal Semantics
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-[#201D1A] font-normal tracking-tight">
            My Palette
          </h1>
          <p className="text-stone-600 text-sm mt-2 font-light max-w-xl leading-relaxed">
            Emotions are personal. Tailor what each candy hue represents in your emotional vocabulary.
            Your definitions are saved and guide future AI reflection to honor your personal associations.
          </p>
        </div>

        <button
          type="button"
          onClick={resetPalette}
          className="cursor-pointer inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-700 hover:text-stone-950 border border-stone-300 hover:border-stone-800 bg-white hover:bg-stone-50 px-4 py-2.5 rounded-xl transition-all shadow-2xs whitespace-nowrap self-start md:self-auto font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
      </div>

      {/* Overview Swatch Strip */}
      <div className="bg-white/80 border border-[#EAE3D5] rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-3">
          15 Mood Swatch Overview
        </span>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-2">
          {palette.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center group relative cursor-pointer"
              title={`${item.name} (${item.color})`}
            >
              <span
                className="w-full aspect-square rounded-lg border border-black/10 shadow-2xs group-hover:scale-110 transition-transform"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-stone-600 mt-1 truncate max-w-full font-medium">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search moods..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#EAE3D5] rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-700 shadow-2xs"
          />
        </div>
        <span className="text-xs text-stone-400 font-mono">
          Showing {filteredPalette.length} of {palette.length} moods
        </span>
      </div>

      {/* Emotion Color Cards */}
      <div className="space-y-4">
        {filteredPalette.map((emotion) => {
          return (
            <div
              key={emotion.id}
              className="bg-white border border-[#EAE3D5] rounded-2xl p-5 sm:p-6 transition-all hover:border-stone-400 shadow-xs group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                {/* Left: Swatch & Name */}
                <div className="flex items-center sm:items-start gap-4">
                  {/* Color Picker trigger */}
                  <div className="relative">
                    <input
                      type="color"
                      id={`color-picker-${emotion.id}`}
                      value={emotion.color}
                      onChange={(e) =>
                        handleColorChange(emotion.id, e.target.value, emotion.explanation)
                      }
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      title={`Change color for ${emotion.name}`}
                    />
                    <div
                      className="w-14 h-14 rounded-xl border border-black/10 shadow-xs flex items-center justify-center transition-transform group-hover:scale-105 cursor-pointer relative overflow-hidden"
                      style={{ backgroundColor: emotion.color }}
                    >
                      <span className="text-[10px] font-mono uppercase font-semibold text-stone-800 bg-white/80 px-1 py-0.5 rounded backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity">
                        Pick
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl text-[#201D1A] font-medium">
                      {emotion.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <label
                        htmlFor={`hex-input-${emotion.id}`}
                        className="text-xs font-mono text-stone-400 uppercase font-semibold"
                      >
                        Hex:
                      </label>
                      <input
                        id={`hex-input-${emotion.id}`}
                        type="text"
                        value={emotion.color}
                        onChange={(e) =>
                          handleColorChange(emotion.id, e.target.value, emotion.explanation)
                        }
                        className="text-xs font-mono bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-lg w-22 text-stone-800 uppercase focus:outline-none focus:border-stone-500 font-semibold"
                        maxLength={7}
                      />
                      {savedNotification === emotion.id && (
                        <span className="text-[11px] text-emerald-700 inline-flex items-center gap-1 font-semibold animate-in fade-in">
                          <Check className="w-3.5 h-3.5" /> Saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Personal Explanation */}
                <div className="flex-1 max-w-lg">
                  <label
                    htmlFor={`explanation-${emotion.id}`}
                    className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1.5"
                  >
                    Personal Meaning &amp; Associations
                  </label>
                  <textarea
                    id={`explanation-${emotion.id}`}
                    rows={2}
                    value={emotion.explanation}
                    onChange={(e) =>
                      handleExplanationChange(emotion.id, emotion.color, e.target.value)
                    }
                    placeholder={`What does ${emotion.name.toLowerCase()} feel like to you?`}
                    className="w-full text-sm font-serif italic text-stone-800 bg-[#FAF7F0] border border-stone-200 rounded-xl p-3 leading-relaxed placeholder:font-serif placeholder:italic placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-500 transition-colors resize-none"
                  />
                  <span className="block text-[11px] text-stone-400 mt-1">
                    Stored locally. Will be honored by future AI reflections.
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Personalization Connection Note */}
      <div className="mt-12 p-6 bg-[#FAF7F0] border border-[#EAE3D5] rounded-2xl">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-emerald-100/70 rounded-xl shrink-0 text-emerald-800">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-base text-stone-900 font-medium">
                Active in Mini-Me (Iteration 02 · Personal Color Language)
              </h4>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Connected
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Your customized colors and written meanings above are sent to Mini-Me when you reflect on your journal.
              Mini-Me checks your personal definitions first to propose colors that honor your individual associations rather than universal tropes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
