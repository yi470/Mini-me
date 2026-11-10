/**
 * In My Colors — Core Types
 */

export interface EmotionDefinition {
  id: string;
  name: string;
  color: string; // Hex color code
  explanation: string; // Personal meaning of this color
  isDefault?: boolean;
}

export interface EntryComputedColor {
  isGradient: boolean;
  color1: string;
  color2?: string;
  cssBackground: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  emotions: string[]; // up to 2 emotion IDs
  content: string;
  customColorOverride?: string | null;
  computedColor: EntryComputedColor;
  isSample?: boolean; // For demo entries that can be cleared
  aiReflection?: {
    status: 'pending' | 'ready' | 'none';
    interpretation?: string;
    analyzedAt?: number;
  };
  evaluationRecord?: EvaluationRecord;
}

export type ViewTab = 'today' | 'archive' | 'palette';

export type FeedbackType =
  | 'emotion_right_color_wrong'
  | 'emotion_mismatch'
  | 'color_right_different_reason'
  | 'feels_accurate';

export type AcceptanceStatus = 'Accepted' | 'Adjusted' | 'Rejected';

export interface EvaluationRecord {
  id: string;
  timestamp: number;
  journalInput: string;
  initialSuggestions: {
    reflection: string;
    question: string | null;
    whyTheseColors?: string;
    emotions: Array<{ id: string; name: string; color: string; explanation?: string }>;
    moodIds: string[];
  };
  userFeedback?: {
    feedbackType: FeedbackType;
    feedbackLabel: string;
    userNote?: string;
  };
  revisedSuggestion?: {
    revisionResponse: string;
    clarifyingQuestion?: string | null;
    whyRevisedColors?: string;
    emotions: Array<{ id: string; name: string; color: string; explanation?: string }>;
    moodIds: string[];
    whatChanged?: string;
    originalInference?: string;
    userExplicitMeaning?: string;
    colorsPreserved?: boolean;
    needsClarificationReply?: boolean;
  } | null;
  finalSelection: {
    moodIds: string[];
    colors: string[];
    explanationNote?: string;
  };
  acceptanceStatus: AcceptanceStatus;
}
