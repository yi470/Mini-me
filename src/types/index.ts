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
}

export type ViewTab = 'today' | 'archive' | 'palette';
