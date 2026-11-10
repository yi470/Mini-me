import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { EmotionDefinition } from '../types';
import { RotateCcw, Plus, Check, Info, Sparkles } from 'lucide-react';

export const PalettePage: React.FC = () => {
  const { palette, updateEmotion, resetPalette } = useDiary();

  // Local editing state for real-time responsiveness
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

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

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      {/* Header */}
      <div className="border-b border-[#EAE5DC] pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-stone-400 block mb-1">
            Personal Semantics
          </span>
          <h1 className="font-serif text-3xl md:text-5xl text-[#201D1A] font-normal tracking-tight">
            My Palette
          </h1>
          <p className="text-stone-600 text-sm mt-2 font-light max-w-xl leading-relaxed">
            Emotions are personal. Tailor what each hue represents in your inner vocabulary.
            Your definitions are saved and will guide future AI reflection to honor your personal associations.
          </p>
        </div>

        <button
          type="button"
          onClick={resetPalette}
          className="cursor-pointer inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900 border border-stone-300 hover:border-stone-600 px-3.5 py-2 rounded transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
      </div>

      {/* Emotion Color Cards */}
      <div className="space-y-6">
        {palette.map((emotion) => {
          return (
            <div
              key={emotion.id}
              className="bg-white border border-[#EAE5DC] rounded-xl p-5 sm:p-6 transition-all hover:border-stone-400 shadow-2xs group"
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
                      className="w-14 h-14 rounded-lg border border-black/10 shadow-xs flex items-center justify-center transition-transform group-hover:scale-105 cursor-pointer"
                      style={{ backgroundColor: emotion.color }}
                    >
                      <span className="text-[10px] font-mono uppercase font-semibold text-black/60 bg-white/70 px-1 py-0.5 rounded backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity">
                        Pick
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl text-[#201D1A] font-medium">
                      {emotion.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <label
                        htmlFor={`hex-input-${emotion.id}`}
                        className="text-xs font-mono text-stone-500 uppercase"
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
                        className="text-xs font-mono bg-stone-50 border border-stone-200 px-2 py-0.5 rounded w-20 text-stone-800 uppercase focus:outline-none focus:border-stone-500"
                        maxLength={7}
                      />
                      {savedNotification === emotion.id && (
                        <span className="text-[11px] text-emerald-700 inline-flex items-center gap-1 font-medium animate-in fade-in">
                          <Check className="w-3 h-3" /> Saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Personal Explanation */}
                <div className="flex-1 max-w-lg">
                  <label
                    htmlFor={`explanation-${emotion.id}`}
                    className="block text-xs uppercase tracking-wider text-stone-400 font-medium mb-1.5"
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
                    placeholder={`What does ${emotion.name.toLowerCase()} feel like to you? e.g. "Morning sun through blinds..."`}
                    className="w-full text-sm font-serif italic text-stone-800 bg-stone-50/60 border border-stone-200 rounded-lg p-3 leading-relaxed placeholder:font-serif placeholder:italic placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-500 transition-colors resize-none"
                  />
                  <span className="block text-[11px] text-stone-400 mt-1">
                    Stored locally. Used to personalize future reflections.
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Future AI Personalization Architecture Note */}
      <div className="mt-12 p-6 bg-[#F5F2EA] border border-[#E5DEC9] rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-stone-200/60 rounded-md shrink-0 text-stone-700">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-2">
            <h4 className="font-serif text-base text-stone-900 font-medium">
              Prepared for AI Reflection Integration
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              This application is structured so that when the Gemini AI Reflection feature is enabled,
              it will ingest your personal palette explanations rather than generic psychological tropes.
              You will always maintain ultimate authority over your journal text and color choices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
