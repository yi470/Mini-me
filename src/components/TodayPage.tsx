import React, { useState, useEffect, useRef } from 'react';
import { useDiary } from '../context/DiaryContext';
import { formatEditorialDate } from '../utils/dateUtils';
import { computeEntryColor } from '../utils/colorUtils';
import { SaveConfirmationModal } from './SaveConfirmationModal';
import {
  MiniMeReflectionCard,
  MiniMeReflectionData,
  MiniMeRevisedData,
} from './MiniMeReflectionCard';
import { EvaluationRecordModal } from './EvaluationRecordModal';
import {
  JournalEntry,
  FeedbackType,
  AcceptanceStatus,
  EvaluationRecord,
} from '../types';
import {
  Check,
  SlidersHorizontal,
  AlertCircle,
  Sparkles,
  Loader2,
  RotateCw,
  FileText,
} from 'lucide-react';

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

  // Modal and save feedback states
  const [justSavedEntry, setJustSavedEntry] = useState<JournalEntry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Reflection & Negotiation state (Iteration 03)
  const [isReflecting, setIsReflecting] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [stage, setStage] = useState<'suggestion' | 'feedback' | 'finalized'>('suggestion');
  const [reflectionData, setReflectionData] = useState<MiniMeReflectionData | null>(null);
  const [revisedData, setRevisedData] = useState<MiniMeRevisedData | null>(null);
  const [userFeedback, setUserFeedback] = useState<{
    feedbackType: FeedbackType;
    feedbackLabel: string;
    userNote?: string;
  } | null>(null);
  const [evaluationRecord, setEvaluationRecord] = useState<EvaluationRecord | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);

  const [reflectedText, setReflectedText] = useState<string | null>(null);
  const [reflectedPaletteFingerprint, setReflectedPaletteFingerprint] = useState<string | null>(null);
  const [reflectionError, setReflectionError] = useState<string | null>(null);
  const [reflectionNotice, setReflectionNotice] = useState<string | null>(null);

  // Request race condition & cancellation guards
  const requestSeqRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const emotionsSectionRef = useRef<HTMLDivElement>(null);

  // Fingerprint of current saved palette
  const currentPaletteFingerprint = JSON.stringify(
    palette.map((p) => ({ id: p.id, color: p.color, explanation: (p.explanation || '').trim() }))
  );

  // Initialize form when date or existing entry changes
  useEffect(() => {
    // Abort any inflight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

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
      setEvaluationRecord(existingEntry.evaluationRecord || null);
    } else {
      setSelectedEmotions([]);
      setContent('');
      setCustomColor(null);
      setIsCustomOverrideActive(false);
      setEvaluationRecord(null);
    }

    setErrorMessage(null);
    setReflectionData(null);
    setRevisedData(null);
    setUserFeedback(null);
    setStage('suggestion');
    setReflectedText(null);
    setReflectedPaletteFingerprint(null);
    setReflectionError(null);
    setReflectionNotice(null);
    setIsReflecting(false);
    setIsRevising(false);
  }, [existingEntry, targetDateIso]);

  // Clean up any pending request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Determine if previous reflection is outdated because journal text or palette changed
  const isJournalOutdated = Boolean(
    reflectionData &&
    reflectedText !== null &&
    content.trim() !== reflectedText.trim()
  );

  const isPaletteOutdated = Boolean(
    reflectionData &&
    reflectedPaletteFingerprint !== null &&
    currentPaletteFingerprint !== reflectedPaletteFingerprint
  );

  const isReflectionOutdated = isJournalOutdated || isPaletteOutdated;
  const outdatedReason: 'journal' | 'palette' = isPaletteOutdated ? 'palette' : 'journal';

  // Handle emotion toggle (up to 2)
  const toggleEmotion = (emotionId: string) => {
    setErrorMessage(null);
    setSelectedEmotions((prev) => {
      if (prev.includes(emotionId)) {
        return prev.filter((id) => id !== emotionId);
      }
      if (prev.length >= 2) {
        return [prev[1], emotionId];
      }
      return [...prev, emotionId];
    });
  };

  // Compute live preview color
  const previewColor = computeEntryColor(
    selectedEmotions,
    palette,
    isCustomOverrideActive ? customColor : null
  );

  // AI Reflection Request (Stage 1: Initial Hypothesis)
  const handleReflectWithMiniMe = async () => {
    setErrorMessage(null);
    setReflectionError(null);
    setReflectionNotice(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMessage(
        'Please write your thoughts in the journal above before reflecting with Mini-Me.'
      );
      return;
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentSeq = ++requestSeqRef.current;
    setIsReflecting(true);
    setRevisedData(null);
    setUserFeedback(null);
    setStage('suggestion');

    // Timeout guard: 25 seconds
    const timeoutId = setTimeout(() => {
      if (requestSeqRef.current === currentSeq) {
        controller.abort();
      }
    }, 25000);

    try {
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journalText: trimmed,
          userPalette: palette.map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            explanation: p.explanation || '',
          })),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (currentSeq !== requestSeqRef.current) return;

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to generate reflection at this time.');
      }

      setReflectionData(result);
      setReflectedText(trimmed);
      setReflectedPaletteFingerprint(currentPaletteFingerprint);
      setReflectionError(null);

      // Create initial evaluation record
      const initialRecord: EvaluationRecord = {
        id: `eval-${Date.now()}`,
        timestamp: Date.now(),
        journalInput: trimmed,
        initialSuggestions: {
          reflection: result.reflection,
          question: result.question,
          whyTheseColors: result.whyTheseColors,
          emotions: result.suggestedEmotions,
          moodIds: result.moodIds,
        },
        finalSelection: {
          moodIds: selectedEmotions.length > 0 ? selectedEmotions : result.moodIds,
          colors: (selectedEmotions.length > 0 ? selectedEmotions : result.moodIds).map(
            (id: string) => palette.find((p) => p.id === id)?.color || '#78D6AE'
          ),
        },
        acceptanceStatus: 'Adjusted',
      };
      setEvaluationRecord(initialRecord);
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (currentSeq !== requestSeqRef.current) return;

      console.error('Mini-Me reflection error:', err);
      if (err.name === 'AbortError') {
        setReflectionError(
          'Mini-Me reflection timed out. Please click "Try Again" to re-send your reflection request.'
        );
      } else {
        setReflectionError(
          err?.message || 'Mini-Me could not connect to the reflection service. Please try again.'
        );
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsReflecting(false);
      }
    }
  };

  // Stage 2: Submit User Feedback & Request Revision (Negotiation)
  const handleSendFeedback = async (
    type: FeedbackType,
    label: string,
    note?: string
  ): Promise<void> => {
    if (!reflectionData) return;

    setReflectionError(null);
    setIsRevising(true);

    const feedbackObj = {
      feedbackType: type,
      feedbackLabel: label,
      userNote: note?.trim() || undefined,
    };
    setUserFeedback(feedbackObj);

    try {
      const response = await fetch('/api/reflect/revise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journalText: content.trim(),
          userPalette: palette.map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            explanation: p.explanation || '',
          })),
          initialSuggestions: {
            reflection: reflectionData.reflection,
            question: reflectionData.question,
            whyTheseColors: reflectionData.whyTheseColors,
            emotions: reflectionData.suggestedEmotions,
            moodIds: reflectionData.moodIds,
          },
          feedbackType: type,
          feedbackLabel: label,
          userNote: note?.trim() || '',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to revise reflection at this time.');
      }

      setRevisedData(result);
      setStage('feedback');

      // Update evaluation record with feedback & revision
      setEvaluationRecord((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          userFeedback: feedbackObj,
          revisedSuggestion: {
            revisionResponse: result.revisionResponse,
            clarifyingQuestion: result.clarifyingQuestion,
            whyRevisedColors: result.whyRevisedColors,
            emotions: result.suggestedEmotions,
            moodIds: result.moodIds,
            whatChanged: result.whatChanged,
            originalInference: result.originalInference,
            userExplicitMeaning: result.userExplicitMeaning,
            colorsPreserved: result.colorsPreserved,
            needsClarificationReply: result.needsClarificationReply,
          },
        };
      });
    } catch (err: any) {
      console.error('Error revising reflection:', err);
      setReflectionError(
        err?.message || 'Failed to submit feedback to Mini-Me. Please try again.'
      );
    } finally {
      setIsRevising(false);
    }
  };

  // Stage 3: Confirm Final Colors and build final EvaluationRecord
  const handleApplyFinalColors = (
    moodIds: string[],
    status: AcceptanceStatus,
    explanationNote?: string
  ) => {
    setSelectedEmotions(moodIds);
    setIsCustomOverrideActive(false);
    setStage('finalized');

    // Build or update complete evaluation record
    if (reflectionData) {
      const updatedRecord: EvaluationRecord = {
        id: evaluationRecord?.id || `eval-${Date.now()}`,
        timestamp: Date.now(),
        journalInput: content.trim(),
        initialSuggestions: {
          reflection: reflectionData.reflection,
          question: reflectionData.question,
          whyTheseColors: reflectionData.whyTheseColors,
          emotions: reflectionData.suggestedEmotions,
          moodIds: reflectionData.moodIds,
        },
        userFeedback: userFeedback || undefined,
        revisedSuggestion: revisedData
          ? {
              revisionResponse: revisedData.revisionResponse,
              clarifyingQuestion: revisedData.clarifyingQuestion,
              whyRevisedColors: revisedData.whyRevisedColors,
              emotions: revisedData.suggestedEmotions,
              moodIds: revisedData.moodIds,
              whatChanged: revisedData.whatChanged,
              originalInference: revisedData.originalInference,
              userExplicitMeaning: revisedData.userExplicitMeaning,
              colorsPreserved: revisedData.colorsPreserved,
              needsClarificationReply: revisedData.needsClarificationReply,
            }
          : null,
        finalSelection: {
          moodIds,
          colors: moodIds.map((id) => palette.find((p) => p.id === id)?.color || '#78D6AE'),
          explanationNote: explanationNote || undefined,
        },
        acceptanceStatus: status,
      };
      setEvaluationRecord(updatedRecord);
    }

    setReflectionNotice(
      `Applied final colors to your draft (${status}). Evaluation record updated.`
    );
    setTimeout(() => setReflectionNotice(null), 4500);

    // Scroll up smoothly toward the color canvas
    emotionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleAdjustColors = () => {
    emotionsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDismissReflection = () => {
    setReflectionData(null);
    setRevisedData(null);
    setUserFeedback(null);
    setStage('suggestion');
    setReflectedText(null);
    setReflectionError(null);
    setReflectionNotice(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation check: at least an emotion or written text
    if (!content.trim() && selectedEmotions.length === 0) {
      setErrorMessage('Please choose at least one emotion or write a few words before saving.');
      return;
    }

    try {
      const saved = saveEntry({
        date: targetDateIso,
        content: content.trim(),
        emotions: selectedEmotions,
        customColorOverride: isCustomOverrideActive && customColor ? customColor : null,
        id: existingEntry?.id,
        evaluationRecord: evaluationRecord || existingEntry?.evaluationRecord || undefined,
      });

      if (!saved) {
        throw new Error('Save operation returned undefined');
      }

      // Show confirmation modal with monthly palette preview
      setJustSavedEntry(saved);
    } catch (err) {
      console.error('Error saving entry:', err);
      setErrorMessage('Unable to save your colors to browser storage. Please try again.');
    }
  };

  const selectedEmotionObjects = selectedEmotions
    .map((id) => palette.find((p) => p.id === id))
    .filter(Boolean);

  const isToday = targetDateIso === todayIso;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 md:py-14 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="border-b border-[#EAE3D5] pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 text-stone-500 text-xs tracking-wider uppercase mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF8A65]" />
            <span className="font-medium text-stone-600">
              {isToday ? "Today's Entry" : 'Archived Date Entry'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-serif normal-case text-sm text-stone-700">
              {formatEditorialDate(targetDateIso)}
            </span>
            {!isToday && (
              <button
                type="button"
                onClick={() => setEditingEntryDate(todayIso)}
                className="cursor-pointer text-stone-900 underline hover:text-black transition-colors ml-2 font-medium"
              >
                Return to Today
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-5xl text-[#201D1A] font-normal tracking-tight">
              How are you feeling today?
            </h1>
            <p className="text-stone-600 text-sm mt-3 font-light leading-relaxed max-w-xl">
              Select emotions from your palette to blend your candy-tinted hue, or write your journal
              and reflect with Mini-Me in a collaborative negotiation.
            </p>
          </div>

          {evaluationRecord && (
            <button
              type="button"
              onClick={() => setIsEvalModalOpen(true)}
              className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-800 text-stone-700 hover:text-black text-xs font-medium transition-all shadow-2xs shrink-0 self-start md:self-auto"
            >
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span>Evaluation Record</span>
              <span
                className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded font-semibold ${
                  evaluationRecord.acceptanceStatus === 'Accepted'
                    ? 'bg-emerald-50 text-emerald-800'
                    : evaluationRecord.acceptanceStatus === 'Adjusted'
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {evaluationRecord.acceptanceStatus}
              </span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        {/* Emotion Palette Selection */}
        <section
          ref={emotionsSectionRef}
          id="emotion-selection-section"
          className="bg-white/80 border border-[#EAE3D5] rounded-2xl p-5 sm:p-7 shadow-xs scroll-mt-24"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-stone-600 block">
                Select Emotions (Up to 2)
              </label>
              <span className="text-xs text-stone-500 mt-0.5 block">
                Click any tile to choose or mix two moods
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-stone-200 text-stone-600">
                {selectedEmotions.length === 0 && '0 selected'}
                {selectedEmotions.length === 1 && '1 selected · pick 2nd to blend'}
                {selectedEmotions.length === 2 && '2 emotions blended'}
              </span>
            </div>
          </div>

          {/* 15 Mood Tiles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {palette.map((emotion) => {
              const isSelected = selectedEmotions.includes(emotion.id);
              const selectionIndex = selectedEmotions.indexOf(emotion.id);

              return (
                <button
                  key={emotion.id}
                  type="button"
                  onClick={() => toggleEmotion(emotion.id)}
                  className={`group relative text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-20 transform hover:-translate-y-0.5 ${
                    isSelected
                      ? 'border-stone-900 shadow-md ring-2 ring-stone-900/10 bg-white'
                      : 'border-stone-200 hover:border-stone-400 bg-[#FFFDF9]'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between w-full">
                    {/* Vibrant Candy Color Swatch Circle */}
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-2xs group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: emotion.color }}
                    />
                    {isSelected && (
                      <span className="text-[10px] font-mono text-stone-900 bg-stone-100 font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                        {selectionIndex + 1}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-stone-900 truncate">
                      {emotion.name}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 block truncate">
                      {emotion.color}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Emotion Explanations */}
          {selectedEmotionObjects.length > 0 && !isCustomOverrideActive && (
            <div className="mt-5 pt-4 border-t border-[#EAE3D5]/80 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              {selectedEmotionObjects.map((e) => (
                <div key={e?.id} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shadow-2xs"
                    style={{ backgroundColor: e?.color }}
                  />
                  <span className="font-semibold text-stone-800">{e?.name}:</span>
                  <span className="italic font-serif text-stone-600">
                    "{e?.explanation}"
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live Color Canvas & Manual Override */}
        <section className="bg-white/90 border border-[#EAE3D5] rounded-2xl p-6 transition-all shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 mb-5">
            <div>
              <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold block">
                Visual Color Preview
              </span>
              <p className="text-sm text-stone-700 font-serif italic mt-0.5">
                {isCustomOverrideActive
                  ? 'Manual custom color override active'
                  : selectedEmotions.length === 0
                  ? 'Select emotion tiles above or use Mini-Me below to generate a blend'
                  : selectedEmotions.length === 1
                  ? `Single mood: ${selectedEmotionObjects[0]?.name}`
                  : `Soft gradient blend: ${selectedEmotionObjects[0]?.name} + ${selectedEmotionObjects[1]?.name}`}
              </p>
            </div>

            {/* Manual Override Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCustomOverrideActive(!isCustomOverrideActive)}
                className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                  isCustomOverrideActive
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-[#FAF7F0] text-stone-700 border-stone-300 hover:border-stone-500'
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
                    className="w-7 h-7 rounded-md border border-stone-300 cursor-pointer p-0.5 bg-white shadow-2xs"
                    title="Choose custom color"
                  />
                  <span className="text-xs font-mono text-stone-600">
                    {customColor || previewColor.color1}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Color Canvas Showcase Tile */}
          <div
            className="w-full h-32 md:h-36 rounded-xl transition-all duration-500 flex items-center justify-center relative overflow-hidden shadow-inner border border-stone-200/50"
            style={{
              background: previewColor.cssBackground,
            }}
          >
            <div className="relative z-10 text-center px-4 py-2 bg-white/85 backdrop-blur-md rounded-xl border border-white/60 shadow-sm max-w-xs">
              <span className="font-serif text-sm text-stone-900 font-medium">
                {isCustomOverrideActive
                  ? 'Custom Palette Hue'
                  : selectedEmotions.length > 0
                  ? selectedEmotionObjects.map((e) => e?.name).join(' & ')
                  : 'Unpainted Day'}
              </span>
              <span className="block text-[11px] font-mono text-stone-500 mt-0.5">
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
              className="text-xs font-semibold uppercase tracking-widest text-stone-500"
            >
              Today's Journal
            </label>
            <span className="text-xs text-stone-400 font-light">
              {content.trim() ? `${content.trim().split(/\s+/).length} words` : 'Blank page'}
            </span>
          </div>

          <div className="relative bg-white border border-[#EAE3D5] rounded-2xl focus-within:border-stone-700 focus-within:ring-2 focus-within:ring-stone-700/10 transition-all p-5 shadow-xs">
            <textarea
              id="journal-entry-text"
              rows={7}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="What's on your mind today? Let thoughts unfold at their own pace..."
              className="w-full bg-transparent resize-none border-none outline-none text-stone-900 font-serif text-lg leading-relaxed placeholder:font-serif placeholder:italic placeholder:text-stone-400 focus:ring-0 p-0"
            />
          </div>

          {/* AI Feature Trigger: Reflect with Mini-Me */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReflectWithMiniMe}
              disabled={isReflecting || isRevising}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E0D5BE] bg-[#FFFDF9] hover:bg-stone-50 text-stone-800 hover:text-black font-semibold text-xs transition-all shadow-2xs hover:shadow active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isReflecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>
                    {isReflectionOutdated
                      ? 'Updating reflection...'
                      : 'Mini-Me is reflecting...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition-transform" />
                  <span>
                    {isReflectionOutdated
                      ? 'Reflect Again with Updated Journal'
                      : reflectionData
                      ? 'Re-evaluate with Mini-Me'
                      : 'Reflect with Mini-Me'}
                  </span>
                </>
              )}
            </button>

            {/* Privacy & Scope Disclosure */}
            <p className="text-[11px] text-stone-400 font-light leading-snug max-w-sm">
              Mini-Me offers hypotheses based on your journal and My Palette. Feedback guides the revision to your final color.
            </p>
          </div>
        </section>

        {/* Mini-Me Loading Card */}
        {isReflecting && (
          <div className="bg-[#FFFDF9] border border-[#E8DFC9] rounded-2xl p-6 text-center space-y-3 animate-in fade-in duration-300 shadow-xs">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base text-stone-900 font-medium">
              Mini-Me is reading your thoughts and personal palette...
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto font-light">
              Formulating an initial emotional hypothesis and tentative color suggestion.
            </p>
          </div>
        )}

        {/* Mini-Me Reflection Error Feedback with Retry */}
        {reflectionError && !isReflecting && !isRevising && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-800 animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{reflectionError}</span>
            </div>
            <button
              type="button"
              onClick={handleReflectWithMiniMe}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 rounded-lg hover:bg-rose-100 text-rose-800 font-semibold transition-colors shrink-0 shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {/* Applied Notification Banner */}
        {reflectionNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reflectionNotice}</span>
          </div>
        )}

        {/* Mini-Me Iteration 03 Reflection Card: 3-Stage Negotiation */}
        {reflectionData && !isReflecting && (
          <MiniMeReflectionCard
            initialData={reflectionData}
            revisedData={revisedData}
            palette={palette}
            isOutdated={isReflectionOutdated}
            isReflecting={isReflecting}
            isRevising={isRevising}
            outdatedReason={outdatedReason}
            stage={stage}
            userFeedback={userFeedback}
            currentDraftMoodIds={selectedEmotions}
            evaluationRecord={evaluationRecord}
            onSendFeedback={handleSendFeedback}
            onApplyFinalColors={handleApplyFinalColors}
            onAdjustColors={handleAdjustColors}
            onDismiss={handleDismissReflection}
            onReflectAgain={handleReflectWithMiniMe}
            onViewEvaluationRecord={() => setIsEvalModalOpen(true)}
          />
        )}

        {/* Error Feedback Message if Validation Fails */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#EAE3D5]">
          <div className="text-xs text-stone-500">
            {existingEntry ? (
              <span>Updating existing entry recorded for this date.</span>
            ) : (
              <span>Saving will preserve this color into your monthly palette.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="submit"
              className="cursor-pointer w-full sm:w-auto px-7 py-3 bg-[#201D1A] hover:bg-stone-800 text-stone-50 text-xs uppercase tracking-widest font-semibold rounded-xl transition-all shadow-sm hover:shadow active:scale-98"
            >
              {existingEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </div>
      </form>

      {/* Save Confirmation & Monthly Palette Preview Modal */}
      {justSavedEntry && (
        <SaveConfirmationModal
          savedEntry={justSavedEntry}
          onClose={() => setJustSavedEntry(null)}
          onViewArchive={() => {
            setJustSavedEntry(null);
            setActiveTab('archive');
          }}
        />
      )}

      {/* Evaluation Record Modal */}
      {isEvalModalOpen && evaluationRecord && (
        <EvaluationRecordModal
          record={evaluationRecord}
          onClose={() => setIsEvalModalOpen(false)}
        />
      )}
    </div>
  );
};
