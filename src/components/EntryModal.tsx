import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { useDiary } from '../context/DiaryContext';
import { formatEditorialDate } from '../utils/dateUtils';
import { getOptimalTextColor } from '../utils/colorUtils';
import { X, Trash2, Edit3, ArrowUpRight } from 'lucide-react';

interface EntryModalProps {
  entry: JournalEntry;
  onClose: () => void;
  onEdit: (date: string) => void;
}

export const EntryModal: React.FC<EntryModalProps> = ({ entry, onClose, onEdit }) => {
  const { deleteEntry, palette } = useDiary();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const emotionObjects = entry.emotions
    .map((id) => palette.find((p) => p.id === id))
    .filter(Boolean);

  const handleDelete = () => {
    deleteEntry(entry.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#FBF9F5] border border-[#EAE5DC] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color Header Banner */}
        <div
          className="w-full h-28 sm:h-36 relative transition-all flex items-end p-5"
          style={{ background: entry.computedColor.cssBackground }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/70 hover:bg-white text-stone-800 transition-colors shadow-xs cursor-pointer"
            aria-label="Close entry modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Emotion labels on the banner */}
          <div className="relative z-10 flex flex-wrap items-center gap-2">
            {emotionObjects.map((emotion) => (
              <span
                key={emotion?.id}
                className="text-xs px-2.5 py-1 rounded bg-white/90 text-stone-900 font-medium backdrop-blur-xs shadow-2xs"
              >
                {emotion?.name}
              </span>
            ))}
            {entry.customColorOverride && (
              <span className="text-xs px-2.5 py-1 rounded bg-stone-900/80 text-white font-mono">
                Override {entry.customColorOverride}
              </span>
            )}
            {entry.isSample && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium border border-amber-200">
                Sample Entry
              </span>
            )}
          </div>
        </div>

        {/* Entry Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Date & Metadata */}
          <div className="border-b border-[#EAE5DC] pb-4">
            <span className="text-xs uppercase tracking-widest text-stone-400 block mb-1">
              Recorded Date
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#201D1A]">
              {formatEditorialDate(entry.date)}
            </h2>
          </div>

          {/* Journal Reflection Text */}
          <div className="prose prose-stone max-w-none">
            {entry.content ? (
              <p className="font-serif text-lg leading-relaxed text-stone-800 whitespace-pre-wrap first-letter:text-3xl first-letter:font-serif first-letter:font-normal first-letter:float-left first-letter:mr-2">
                {entry.content}
              </p>
            ) : (
              <p className="text-stone-400 italic font-serif">
                A day recorded through color alone, without written words.
              </p>
            )}
          </div>

          {/* Personal Emotion Explanations for this day */}
          {emotionObjects.length > 0 && (
            <div className="bg-stone-50 border border-stone-200/60 rounded-lg p-4 space-y-2 text-xs text-stone-600">
              <span className="font-medium text-stone-700 block uppercase tracking-wider text-[10px]">
                Emotional Meaning
              </span>
              {emotionObjects.map((emo) => (
                <div key={emo?.id} className="flex items-start gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: emo?.color }}
                  />
                  <span>
                    <strong className="text-stone-800">{emo?.name}:</strong>{' '}
                    <span className="italic font-serif">{emo?.explanation}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 bg-stone-100/60 border-t border-[#EAE5DC] flex items-center justify-between">
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-700 font-medium">Delete this entry?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="cursor-pointer text-xs font-semibold px-2.5 py-1 bg-rose-700 text-white rounded hover:bg-rose-800 transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="cursor-pointer text-xs text-stone-600 hover:text-stone-900 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-rose-700 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onEdit(entry.date);
                onClose();
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider font-medium text-stone-800 border border-stone-300 hover:border-stone-800 rounded bg-white transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
