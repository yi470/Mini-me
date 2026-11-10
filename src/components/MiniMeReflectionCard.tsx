import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  SlidersHorizontal,
  RotateCw,
  Clock,
  Palette,
  MessageSquare,
  ArrowRight,
  FileText,
  HelpCircle,
  ThumbsUp,
  RefreshCw,
  Eye,
  Send,
  MessageCircle,
  BookmarkCheck,
  Layers,
} from 'lucide-react';
import { computeEntryColor } from '../utils/colorUtils';
import { EmotionDefinition, FeedbackType, AcceptanceStatus, EvaluationRecord } from '../types';

export interface MiniMeReflectionData {
  reflection: string;
  question: string | null;
  whyTheseColors?: string;
  suggestedEmotions: Array<{
    id: string;
    name: string;
    color: string;
    explanation?: string;
    isPersonalAssociation?: boolean;
    reason?: string;
  }>;
  moodIds: string[];
}

export interface MiniMeRevisedData {
  revisionResponse: string;
  clarifyingQuestion: string | null;
  whyRevisedColors?: string;
  suggestedEmotions: Array<{
    id: string;
    name: string;
    color: string;
    explanation?: string;
    isPersonalAssociation?: boolean;
    reason?: string;
  }>;
  moodIds: string[];
  whatChanged?: string;
  originalInference?: string;
  userExplicitMeaning?: string;
  colorsPreserved?: boolean;
  needsClarificationReply?: boolean;
}

interface MiniMeReflectionCardProps {
  initialData: MiniMeReflectionData;
  revisedData: MiniMeRevisedData | null;
  palette: EmotionDefinition[];
  isOutdated: boolean;
  isReflecting: boolean;
  isRevising: boolean;
  outdatedReason?: 'journal' | 'palette';
  stage: 'suggestion' | 'feedback' | 'finalized';
  userFeedback: {
    feedbackType: FeedbackType;
    feedbackLabel: string;
    userNote?: string;
  } | null;
  currentDraftMoodIds: string[];
  evaluationRecord: EvaluationRecord | null;
  onSendFeedback: (type: FeedbackType, label: string, note?: string) => Promise<void>;
  onApplyFinalColors: (moodIds: string[], status: AcceptanceStatus, explanationNote?: string) => void;
  onAdjustColors: () => void;
  onDismiss: () => void;
  onReflectAgain: () => void;
  onViewEvaluationRecord: () => void;
}

const FEEDBACK_OPTIONS: Array<{
  type: FeedbackType;
  label: string;
  description: string;
  hintWithoutExplanation: string;
}> = [
  {
    type: 'color_right_different_reason',
    label: 'The color feels right, but for a different reason.',
    description: 'You resonate with this color combination, but your personal meaning is different from Mini-Me’s hypothesis.',
    hintWithoutExplanation: 'Mini-Me will preserve these exact colors and ask what they mean to you.',
  },
  {
    type: 'emotion_right_color_wrong',
    label: 'The emotion feels right, but the color doesn’t.',
    description: 'Mini-Me captured your emotional state, but the color association does not match your inner palette.',
    hintWithoutExplanation: 'Mini-Me will ask which color from your palette better reflects this feeling.',
  },
  {
    type: 'emotion_mismatch',
    label: 'The emotion doesn’t quite match.',
    description: 'The suggested mood overlooks a different nuance or layer in what you experienced today.',
    hintWithoutExplanation: 'Mini-Me will ask what emotions were actually present for you.',
  },
  {
    type: 'feels_accurate',
    label: 'This feels accurate.',
    description: 'Both the emotion and the color align with how today feels to you.',
    hintWithoutExplanation: 'Accepts these colors as your final choice.',
  },
];

export const MiniMeReflectionCard: React.FC<MiniMeReflectionCardProps> = ({
  initialData,
  revisedData,
  palette,
  isOutdated,
  isReflecting,
  isRevising,
  outdatedReason = 'journal',
  stage,
  userFeedback,
  currentDraftMoodIds,
  evaluationRecord,
  onSendFeedback,
  onApplyFinalColors,
  onAdjustColors,
  onDismiss,
  onReflectAgain,
  onViewEvaluationRecord,
}) => {
  // Local feedback editing state
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<FeedbackType>(
    userFeedback?.feedbackType || 'color_right_different_reason'
  );
  const [userNote, setUserNote] = useState<string>(userFeedback?.userNote || '');
  const [clarificationReply, setClarificationReply] = useState<string>('');
  const [finalChoiceNote, setFinalChoiceNote] = useState<string>(
    evaluationRecord?.finalSelection.explanationNote || ''
  );
  const [activeTab, setActiveTab] = useState<'suggestion' | 'feedback' | 'finalized'>(stage);

  // Sync stage changes if parent advances
  useEffect(() => {
    setActiveTab(stage);
  }, [stage]);

  // Sync user note if parent updates
  useEffect(() => {
    if (userFeedback?.userNote !== undefined) {
      setUserNote(userFeedback.userNote);
    }
  }, [userFeedback]);

  // Compute color previews
  const initialPreview = computeEntryColor(initialData.moodIds, palette);
  const revisedPreview = revisedData
    ? computeEntryColor(revisedData.moodIds, palette)
    : null;
  const draftPreview = computeEntryColor(currentDraftMoodIds, palette);

  const selectedOption = FEEDBACK_OPTIONS.find((opt) => opt.type === selectedFeedbackType);

  const handleSubmitFeedback = async () => {
    if (!selectedOption) return;
    await onSendFeedback(selectedOption.type, selectedOption.label, userNote);
  };

  const handleSendClarificationReply = async () => {
    if (!clarificationReply.trim()) return;
    const currentType = userFeedback?.feedbackType || selectedFeedbackType;
    const currentLabel = userFeedback?.feedbackLabel || selectedOption?.label || '';
    // Append or use clarification reply as user's explanation
    const fullNote = userNote.trim()
      ? `${userNote.trim()} | Follow-up clarification: ${clarificationReply.trim()}`
      : clarificationReply.trim();

    setUserNote(fullNote);
    setClarificationReply('');
    await onSendFeedback(currentType, currentLabel, fullNote);
  };

  return (
    <div
      className={`border rounded-2xl p-6 sm:p-7 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 space-y-6 ${
        isOutdated
          ? 'bg-[#FAF8F3] border-[#E8DFC9] ring-1 ring-amber-300/40'
          : 'bg-[#FFFDF9] border-[#E8DFC9]'
      }`}
    >
      {/* Outdated Notice Banner */}
      {isOutdated && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">
              {outdatedReason === 'palette'
                ? 'Your personal palette has changed. Reflect again to update suggestions with your new associations.'
                : 'Your journal has changed. Reflect again to update the suggestions.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onReflectAgain}
            disabled={isReflecting || isRevising}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs whitespace-nowrap self-end sm:self-auto disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReflecting ? 'animate-spin' : ''}`} />
            <span>Reflect Again</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAE3D5]/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-2xs ${
              isOutdated
                ? 'bg-stone-400'
                : 'bg-gradient-to-tr from-[#FFCF55] via-[#FF8A65] to-[#BAA1FF]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Reflect with Mini-Me
              </h3>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Iteration 03 · Collaborative Sensemaking
              </span>
              {revisedData?.colorsPreserved && (
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  Colors Preserved
                </span>
              )}
              {evaluationRecord && (
                <span
                  className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                    evaluationRecord.acceptanceStatus === 'Accepted'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : evaluationRecord.acceptanceStatus === 'Adjusted'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  Status: {evaluationRecord.acceptanceStatus}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 font-light">
              Mini-Me offers hypotheses and asks for clarification. Your lived experience is the ground truth.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {evaluationRecord && (
            <button
              type="button"
              onClick={onViewEvaluationRecord}
              className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-400 bg-white rounded-lg transition-colors font-medium shadow-2xs"
              title="View and export the evaluation record"
            >
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Evaluation Record</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="cursor-pointer p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Dismiss reflection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Stage Process Timeline Navigation */}
      <div className="bg-[#FAF7F0] border border-[#EAE3D5] rounded-xl p-2 flex items-center justify-between text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('suggestion')}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
            activeTab === 'suggestion'
              ? 'bg-white text-stone-900 shadow-2xs font-semibold border border-stone-200'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-stone-100 border border-stone-300 text-[10px] flex items-center justify-center font-mono">
            1
          </span>
          <span className="truncate">AI Suggestion</span>
        </button>

        <ArrowRight className="w-3.5 h-3.5 text-stone-300 mx-1 shrink-0" />

        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
            activeTab === 'feedback'
              ? 'bg-white text-stone-900 shadow-2xs font-semibold border border-stone-200'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-stone-100 border border-stone-300 text-[10px] flex items-center justify-center font-mono">
            2
          </span>
          <span className="truncate">User Feedback & Clarification</span>
          {revisedData && (
            <span
              className={`w-2 h-2 rounded-full ${
                revisedData.needsClarificationReply ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}
              title={revisedData.needsClarificationReply ? 'Awaiting your answer' : 'Revised'}
            />
          )}
        </button>

        <ArrowRight className="w-3.5 h-3.5 text-stone-300 mx-1 shrink-0" />

        <button
          type="button"
          onClick={() => setActiveTab('finalized')}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
            activeTab === 'finalized'
              ? 'bg-white text-stone-900 shadow-2xs font-semibold border border-stone-200'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-stone-100 border border-stone-300 text-[10px] flex items-center justify-center font-mono">
            3
          </span>
          <span className="truncate">Final Color & Comparison</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* STAGE 1: AI SUGGESTION (HYPOTHESIS) */}
      {/* ========================================================================= */}
      {activeTab === 'suggestion' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
                Initial Emotional Hypothesis
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                Tentative Suggestion
              </span>
            </div>

            <p className="font-serif text-base sm:text-lg text-stone-800 leading-relaxed italic">
              "{initialData.reflection}"
            </p>

            {initialData.question && (
              <div className="bg-[#FAF7F0] border-l-2 border-[#FF8A65] p-3.5 rounded-r-xl">
                <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block mb-0.5">
                  Clarifying Thought
                </span>
                <p className="font-serif text-sm text-stone-800 font-medium leading-relaxed">
                  {initialData.question}
                </p>
              </div>
            )}
          </div>

          {/* Why these colors? */}
          <div className="bg-[#FAF7F0] border border-[#EAE3D5] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-stone-600" />
              <h4 className="font-serif text-sm font-semibold text-stone-800">
                Hypothesized Colors & Associations
              </h4>
            </div>

            {initialData.whyTheseColors && (
              <p className="font-serif text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                {initialData.whyTheseColors}
              </p>
            )}

            <div className="pt-2 border-t border-stone-200/60 space-y-2">
              {initialData.suggestedEmotions.map((emo) => (
                <div
                  key={emo.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0 shadow-2xs"
                      style={{ backgroundColor: emo.color }}
                    />
                    <span className="font-semibold text-stone-900">{emo.name}</span>
                    <span className="text-[10px] font-mono text-stone-400">
                      ({emo.color})
                    </span>

                    {emo.isPersonalAssociation ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                        Personal association
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-medium">
                        General suggestion
                      </span>
                    )}
                  </div>

                  {emo.explanation && (
                    <span className="text-[11px] font-serif italic text-stone-500 sm:max-w-xs truncate">
                      "{emo.explanation}"
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick preview tile */}
          <div className="p-4 bg-[#FAF7F0] border border-[#EAE3D5] rounded-xl flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block mb-1">
                Hypothesized Blend
              </span>
              <div className="flex flex-wrap gap-2">
                {initialData.suggestedEmotions.map((emo) => (
                  <span
                    key={emo.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs font-medium text-stone-800 shadow-2xs"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: emo.color }}
                    />
                    <span>{emo.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div
              className="w-16 h-10 rounded-lg border border-black/10 shadow-2xs shrink-0"
              style={{ background: initialPreview.cssBackground }}
              title="Hypothesized swatch blend"
            />
          </div>

          {/* Navigation to Feedback step or Direct Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-stone-500 font-light">
              Do these colors match your inner experience?
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFeedbackType('feels_accurate');
                  onApplyFinalColors(initialData.moodIds, 'Accepted', 'Felt accurate on initial reflection');
                }}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                This Feels Accurate
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('feedback')}
                className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-xs"
              >
                <span>Provide Feedback & Negotiate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: USER FEEDBACK & REVISION (NEGOTIATION & CLARIFICATION) */}
      {/* ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <h4 className="font-serif text-base font-medium text-stone-900">
              How does Mini-Me’s suggestion feel to you?
            </h4>
            <p className="text-xs text-stone-500 font-light">
              Emotions are deeply personal. You can agree with colors while sharing your own meaning, or adjust moods.
            </p>
          </div>

          {/* Feedback Choices (4 options specified by user brief) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FEEDBACK_OPTIONS.map((opt) => {
              const isSelected = selectedFeedbackType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedFeedbackType(opt.type)}
                  className={`cursor-pointer text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/10 shadow-2xs'
                      : 'bg-[#FFFDF9] border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-serif text-sm font-medium text-stone-900">
                      "{opt.label}"
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-3" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-light mt-1.5 leading-normal">
                    {opt.description}
                  </p>
                  <span className="text-[10px] text-amber-800/80 font-medium block mt-1">
                    ↳ {opt.hintWithoutExplanation}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Optional Initial Explanation Note */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-feedback-note"
              className="text-xs font-semibold uppercase tracking-widest text-stone-600 flex items-center justify-between"
            >
              <span>Explain your personal reasoning (Optional)</span>
              <span className="text-[10px] normal-case text-stone-400 font-light">
                {selectedFeedbackType === 'color_right_different_reason'
                  ? 'If left blank, Mini-Me will preserve the colors and ask for your reasoning'
                  : 'Share your nuance or what you felt'}
              </span>
            </label>
            <textarea
              id="user-feedback-note"
              rows={2}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder={
                selectedFeedbackType === 'color_right_different_reason'
                  ? 'Why did this color combination feel right today? (e.g., "Lavender wasn’t fatigue to me, it felt like quiet creative thinking.")'
                  : 'Tell Mini-Me what you felt, why this color was off, or what nuance was missed...'
              }
              className="w-full bg-[#FAF7F0] border border-stone-200 rounded-xl p-3 text-xs sm:text-sm font-serif text-stone-800 placeholder:italic placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600 transition-all resize-none"
            />
          </div>

          {/* Submit Feedback / Revise CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span className="text-xs text-stone-400 font-light">
              {selectedFeedbackType === 'color_right_different_reason' && !userNote.trim()
                ? 'Mini-Me will keep the colors and ask for your personal reasoning before updating.'
                : 'Mini-Me will adapt without insisting on its original hypothesis.'}
            </span>

            <div className="flex items-center gap-2">
              {selectedFeedbackType === 'feels_accurate' ? (
                <button
                  type="button"
                  onClick={() => {
                    onApplyFinalColors(initialData.moodIds, 'Accepted', userNote || 'Felt accurate');
                  }}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Initial Colors</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  disabled={isRevising}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold text-white bg-amber-800 hover:bg-amber-900 transition-all shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRevising ? 'animate-spin' : ''}`} />
                  <span>{isRevising ? 'Mini-Me is Reflecting...' : 'Submit Feedback & Revise'}</span>
                </button>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* REVISED SUGGESTION & CLARIFICATION DIALOGUE */}
          {/* ===================================================================== */}
          {revisedData && (
            <div className="mt-6 pt-5 border-t border-[#EAE3D5] space-y-5 animate-in fade-in">
              {/* Revision Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h4 className="font-serif text-base font-semibold text-stone-900">
                    Mini-Me’s Revised Understanding
                  </h4>
                  {revisedData.colorsPreserved ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      Colors Preserved
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                      Adapted Colors
                    </span>
                  )}
                </div>

                {revisedData.needsClarificationReply && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold animate-pulse">
                    Awaiting Your Clarification
                  </span>
                )}
              </div>

              {/* Revision Reflection Text */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-2">
                <p className="font-serif text-sm sm:text-base text-stone-800 italic leading-relaxed">
                  "{revisedData.revisionResponse}"
                </p>

                {revisedData.colorsPreserved && (
                  <p className="text-xs text-stone-500 font-light border-t border-stone-100 pt-2">
                    <strong className="text-stone-700 font-medium">Preserved Colors:</strong>{' '}
                    {revisedData.suggestedEmotions.map((e) => `${e.name} (${e.color})`).join(' & ')}
                    {' — '}Kept because they resonated with your feeling today.
                  </p>
                )}
              </div>

              {/* Focused Clarification Question & Interactive Reply Box */}
              {revisedData.clarifyingQuestion && (
                <div className="bg-amber-50/70 border border-amber-300/80 p-4 sm:p-5 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                      Mini-Me's Clarifying Question
                    </span>
                  </div>

                  <p className="font-serif text-sm sm:text-base text-stone-900 font-medium leading-relaxed">
                    "{revisedData.clarifyingQuestion}"
                  </p>

                  <p className="text-[11px] text-amber-900/80 font-light">
                    Answering this helps Mini-Me incorporate your true personal meaning rather than guessing or claiming to understand.
                  </p>

                  {/* Interactive Reply Input */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={clarificationReply}
                      onChange={(e) => setClarificationReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendClarificationReply();
                        }
                      }}
                      placeholder="Type your explanation (e.g. 'To me, this color represents quiet rest rather than sadness...')"
                      className="flex-1 bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-serif text-stone-800 placeholder:italic placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleSendClarificationReply}
                      disabled={isRevising || !clarificationReply.trim()}
                      className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 disabled:opacity-50 transition-colors shadow-2xs shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isRevising ? 'Updating...' : 'Send Clarification'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Clearly Distinguish: Mini-Me Inferred vs. User Stated Meaning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Left: What Mini-Me Originally Inferred */}
                <div className="bg-[#FAF7F0] border border-stone-200/80 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-stone-500 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-stone-300" />
                    Originally Inferred by Mini-Me
                  </div>
                  <p className="font-serif text-xs text-stone-700 italic">
                    "{revisedData.originalInference || initialData.whyTheseColors || initialData.reflection}"
                  </p>
                </div>

                {/* Right: What the User Explicitly Stated */}
                <div className="bg-white border border-amber-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-amber-900 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Your Stated Meaning (Authoritative)
                  </div>
                  <p className="font-serif text-xs text-stone-800 font-medium">
                    "{revisedData.userExplicitMeaning || userNote || '(Awaiting your explanation)'}"
                  </p>
                </div>
              </div>

              {/* What Changed Summary Box */}
              {revisedData.whatChanged && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900 block font-medium mb-0.5">
                      What Changed in This Revision:
                    </strong>
                    <p className="font-serif italic text-stone-600 leading-relaxed">
                      {revisedData.whatChanged}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-stone-500 font-light">
                  {revisedData.colorsPreserved
                    ? 'Colors are preserved. Proceed to finalize or adjust in mood grid.'
                    : 'Review the revised suggestion or compare side-by-side.'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('finalized')}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-stone-700 hover:text-black border border-stone-300 hover:border-stone-800 bg-white transition-colors font-medium shadow-2xs"
                  >
                    <span>View Side-by-Side</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onApplyFinalColors(
                        revisedData.moodIds,
                        revisedData.colorsPreserved ? 'Adjusted' : 'Adjusted',
                        userNote || 'Refined with personal meaning'
                      );
                    }}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Use These Final Colors</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: FINAL COLOR & SIDE-BY-SIDE COMPARISON */}
      {/* ========================================================================= */}
      {activeTab === 'finalized' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-serif text-base font-medium text-stone-900">
                Side-by-Side Comparison & Final Color Choice
              </h4>
              <span className="text-xs text-stone-400 font-light">
                Human judgment is the sole ground truth
              </span>
            </div>
            <p className="text-xs text-stone-500 font-light mt-0.5">
              Review what Mini-Me initially hypothesized versus what you arrived at through conversation.
            </p>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Initial AI Suggestion */}
            <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-semibold">
                  1. Initial AI Hypothesis
                </span>
                <span className="text-[11px] text-stone-400 font-mono">Stage 1</span>
              </div>

              {/* Swatch blend tile */}
              <div
                className="w-full h-16 rounded-lg border border-black/10 shadow-inner flex items-center justify-center"
                style={{ background: initialPreview.cssBackground }}
              >
                <span className="text-[11px] font-serif bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded shadow-2xs text-stone-900">
                  {initialData.suggestedEmotions.map((e) => e.name).join(' & ')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {initialData.suggestedEmotions.map((e) => (
                    <span
                      key={e.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-50 border border-stone-200 text-[11px]"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: e.color }}
                      />
                      <span>{e.name}</span>
                    </span>
                  ))}
                </div>

                <div className="pt-1 border-t border-stone-100">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                    Inferred Meaning:
                  </span>
                  <p className="text-[11px] font-serif text-stone-600 italic line-clamp-3">
                    "{initialData.whyTheseColors || initialData.reflection}"
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onApplyFinalColors(initialData.moodIds, 'Accepted', 'Selected initial suggestion');
                }}
                className="cursor-pointer w-full py-1.5 rounded-lg border border-stone-300 hover:border-stone-800 text-stone-800 text-xs font-medium transition-colors bg-white hover:bg-stone-50 shadow-2xs"
              >
                Use Initial Suggestion
              </button>
            </div>

            {/* Column 2: Final Selection (Revised or Current Draft Selection) */}
            <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  {revisedData?.colorsPreserved
                    ? 'Colors Preserved · Meaning Updated'
                    : revisedData
                    ? 'Revised & Clarified'
                    : 'Your Final Selection'}
                </span>
                <span className="text-[11px] text-stone-400 font-mono">Stage 3</span>
              </div>

              {/* Swatch blend tile */}
              <div
                className="w-full h-16 rounded-lg border border-black/10 shadow-inner flex items-center justify-center"
                style={{
                  background: revisedData ? revisedPreview?.cssBackground : draftPreview.cssBackground,
                }}
              >
                <span className="text-[11px] font-serif bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded shadow-2xs text-stone-900">
                  {revisedData
                    ? revisedData.suggestedEmotions.map((e) => e.name).join(' & ')
                    : currentDraftMoodIds.length > 0
                    ? currentDraftMoodIds
                        .map((id) => palette.find((p) => p.id === id)?.name || id)
                        .join(' & ')
                    : 'Current Selection'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {(revisedData ? revisedData.suggestedEmotions : currentDraftMoodIds.map(id => palette.find(p => p.id === id)).filter(Boolean) as any[]).map((e: any) => (
                    <span
                      key={e.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-50 border border-stone-200 text-[11px]"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: e.color }}
                      />
                      <span>{e.name}</span>
                    </span>
                  ))}
                </div>

                <div className="pt-1 border-t border-stone-100">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                    Your Stated Ground Truth:
                  </span>
                  <p className="text-[11px] font-serif text-stone-800 font-medium line-clamp-3">
                    {revisedData?.userExplicitMeaning && revisedData.userExplicitMeaning !== '(Awaiting your explanation)'
                      ? `"${revisedData.userExplicitMeaning}"`
                      : userNote
                      ? `"${userNote}"`
                      : 'Personal color choice determined by your lived experience.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const targetMoods = revisedData ? revisedData.moodIds : currentDraftMoodIds;
                  onApplyFinalColors(
                    targetMoods,
                    revisedData?.colorsPreserved ? 'Adjusted' : revisedData ? 'Adjusted' : 'Rejected',
                    finalChoiceNote || userNote || 'Final user chosen colors'
                  );
                }}
                className="cursor-pointer w-full py-1.5 rounded-lg border border-stone-900 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-xs"
              >
                Use These Final Colors
              </button>
            </div>
          </div>

          {/* Optional: Why this final color was chosen */}
          <div className="p-4 bg-[#FAF7F0] border border-[#EAE3D5] rounded-xl space-y-2">
            <label
              htmlFor="final-choice-explanation"
              className="text-xs font-semibold uppercase tracking-widest text-stone-600 block"
            >
              Optional: Why did you choose this final color?
            </label>
            <input
              id="final-choice-explanation"
              type="text"
              value={finalChoiceNote}
              onChange={(e) => setFinalChoiceNote(e.target.value)}
              placeholder="e.g., Felt calmer than what Mini-Me thought; needed warm yellow instead of pink."
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-serif text-stone-800 placeholder:italic placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
            <p className="text-[10px] text-stone-400 font-light">
              This explanation is stored in the Evaluation Record to analyze how human intuition interacts with AI suggestions.
            </p>
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onAdjustColors}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-stone-800 hover:text-black border border-stone-300 hover:border-stone-800 bg-white transition-colors font-medium shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Fine-Tune in Mood Grid Above</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onViewEvaluationRecord}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-700 hover:text-stone-900 bg-white border border-stone-300 hover:border-stone-500 shadow-2xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-stone-600" />
                <span>View Evaluation Record</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetMoods = revisedData ? revisedData.moodIds : currentDraftMoodIds.length ? currentDraftMoodIds : initialData.moodIds;
                  onApplyFinalColors(
                    targetMoods,
                    revisedData?.colorsPreserved
                      ? 'Adjusted'
                      : revisedData
                      ? 'Adjusted'
                      : currentDraftMoodIds.length && JSON.stringify(currentDraftMoodIds) !== JSON.stringify(initialData.moodIds)
                      ? 'Rejected'
                      : 'Accepted',
                    finalChoiceNote
                  );
                }}
                className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Final Colors</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
