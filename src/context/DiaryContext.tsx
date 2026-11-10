import React, { createContext, useContext, useEffect, useState } from 'react';
import { EmotionDefinition, JournalEntry, ViewTab } from '../types';
import { computeEntryColor } from '../utils/colorUtils';
import { formatDateToIso } from '../utils/dateUtils';

export const EXPANDED_DEFAULT_PALETTE: EmotionDefinition[] = [
  {
    id: 'happy',
    name: 'Happy',
    color: '#FFCF55',
    explanation: 'Sun-drenched lemon drop; warm morning light flooding the breakfast table.',
    isDefault: true,
  },
  {
    id: 'excited',
    name: 'Excited',
    color: '#FF8A65',
    explanation: 'Warm effervescent tangerine; a spark of anticipation before a new journey.',
    isDefault: true,
  },
  {
    id: 'calm',
    name: 'Calm',
    color: '#78D6AE',
    explanation: 'Cool peppermint and eucalyptus; deep, steady breaths when the world slows down.',
    isDefault: true,
  },
  {
    id: 'peaceful',
    name: 'Peaceful',
    color: '#9FE4CD',
    explanation: 'Still sea foam and clover dew; a tranquil stillness where nothing is missing.',
    isDefault: true,
  },
  {
    id: 'loved',
    name: 'Loved',
    color: '#FF92BC',
    explanation: 'Sweet blossom and spun sugar; the embrace of feeling genuinely seen and held.',
    isDefault: true,
  },
  {
    id: 'hopeful',
    name: 'Hopeful',
    color: '#C9E86D',
    explanation: 'Fresh lime sprout breaking through soil; the quiet belief in gentle tomorrows.',
    isDefault: true,
  },
  {
    id: 'inspired',
    name: 'Inspired',
    color: '#BAA1FF',
    explanation: 'Lilac spark and twilight wonder; ideas coalescing with sudden effortless clarity.',
    isDefault: true,
  },
  {
    id: 'playful',
    name: 'Playful',
    color: '#FFB55C',
    explanation: 'Warm marigold and candied peel; lighthearted laughter and spontaneous joy.',
    isDefault: true,
  },
  {
    id: 'sad',
    name: 'Sad',
    color: '#83B9FA',
    explanation: 'Soft cornflower and summer drizzle; quiet melancholy that asks for time and gentleness.',
    isDefault: true,
  },
  {
    id: 'anxious',
    name: 'Anxious',
    color: '#FFAB82',
    explanation: 'Restless coral and autumn wind; a fluttering quickening in the chest.',
    isDefault: true,
  },
  {
    id: 'tired',
    name: 'Tired',
    color: '#B3A7D5',
    explanation: 'Muted lavender haze; evening shadows stretching softly over tired limbs.',
    isDefault: true,
  },
  {
    id: 'frustrated',
    name: 'Frustrated',
    color: '#F58D99',
    explanation: 'Prickly raspberry and flushed cheeks; energy tangled up waiting for release.',
    isDefault: true,
  },
  {
    id: 'lonely',
    name: 'Lonely',
    color: '#A3B1E5',
    explanation: 'Periwinkle dusk; standing by a quiet window looking out into the blue hour.',
    isDefault: true,
  },
  {
    id: 'confused',
    name: 'Confused',
    color: '#C5B8EF',
    explanation: 'Soft violet fog; thoughts swirling in gentle circles before finding their shore.',
    isDefault: true,
  },
  {
    id: 'uncertain',
    name: 'Uncertain',
    color: '#B6C4BD',
    explanation: 'Polished river pebble in morning mist; pausing at the threshold of what comes next.',
    isDefault: true,
  },
];

export const INITIAL_PALETTE = EXPANDED_DEFAULT_PALETTE;

const STORAGE_KEY_ENTRIES = 'in_my_colors_entries_v1';
const STORAGE_KEY_PALETTE = 'in_my_colors_palette_v1';

function mergeSavedPalette(saved: EmotionDefinition[]): EmotionDefinition[] {
  const savedMap = new Map(saved.map((e) => [e.id, e]));

  // Start with default list to maintain expanded palette
  const merged: EmotionDefinition[] = EXPANDED_DEFAULT_PALETTE.map((defaultEmotion) => {
    const existing = savedMap.get(defaultEmotion.id);
    if (existing) {
      savedMap.delete(defaultEmotion.id);
      return {
        ...defaultEmotion,
        color: existing.color || defaultEmotion.color,
        explanation: existing.explanation || defaultEmotion.explanation,
      };
    }
    return defaultEmotion;
  });

  // Preserve any additional user-created custom emotions
  savedMap.forEach((customEmotion) => {
    merged.push(customEmotion);
  });

  return merged;
}

function getSampleEntries(palette: EmotionDefinition[]): JournalEntry[] {
  return [
    {
      id: 'sample-1',
      date: '2026-11-04',
      createdAt: new Date('2026-11-04T19:30:00').getTime(),
      updatedAt: new Date('2026-11-04T19:30:00').getTime(),
      emotions: ['calm', 'happy'],
      content:
        'Woke up early to soft mist over the garden. Made a slow pour-over coffee and sat watching sparrows on the wire. No rush, no urgency—just feeling grounded and content with the stillness.',
      computedColor: computeEntryColor(['calm', 'happy'], palette),
      isSample: true,
      aiReflection: { status: 'none' },
    },
    {
      id: 'sample-2',
      date: '2026-11-06',
      createdAt: new Date('2026-11-06T21:15:00').getTime(),
      updatedAt: new Date('2026-11-06T21:15:00').getTime(),
      emotions: ['anxious', 'uncertain'],
      content:
        'A jittery afternoon. Too many open loops at work and waiting on a response that never arrived. Stepped outside at twilight to breathe the cool air and let my shoulders drop.',
      computedColor: computeEntryColor(['anxious', 'uncertain'], palette),
      isSample: true,
      aiReflection: { status: 'none' },
    },
    {
      id: 'sample-3',
      date: '2026-11-07',
      createdAt: new Date('2026-11-07T22:00:00').getTime(),
      updatedAt: new Date('2026-11-07T22:00:00').getTime(),
      emotions: ['tired'],
      content:
        'Bone-weary today. My mind feels like woolen blankets. Left the chores for tomorrow, turned the lamps low, and listened to piano solos. Granting myself permission to rest.',
      computedColor: computeEntryColor(['tired'], palette),
      isSample: true,
      aiReflection: { status: 'none' },
    },
    {
      id: 'sample-4',
      date: '2026-11-08',
      createdAt: new Date('2026-11-08T18:45:00').getTime(),
      updatedAt: new Date('2026-11-08T18:45:00').getTime(),
      emotions: ['peaceful', 'loved'],
      content:
        'Spent the afternoon organizing books by spine tone and dusting ceramics. A call with an old friend brought a quiet, genuine warmth back into the evening.',
      computedColor: computeEntryColor(['peaceful', 'loved'], palette),
      isSample: true,
      aiReflection: { status: 'none' },
    },
  ];
}

interface DiaryContextType {
  entries: JournalEntry[];
  palette: EmotionDefinition[];
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  selectedEntryForView: JournalEntry | null;
  setSelectedEntryForView: (entry: JournalEntry | null) => void;
  editingEntryDate: string | null;
  setEditingEntryDate: (date: string | null) => void;
  saveEntry: (params: {
    date: string;
    content: string;
    emotions: string[];
    customColorOverride?: string | null;
    id?: string;
    evaluationRecord?: import('../types').EvaluationRecord;
  }) => JournalEntry;
  deleteEntry: (id: string) => void;
  removeSampleEntries: () => void;
  hasSampleEntries: boolean;
  getEntryForDate: (dateStr: string) => JournalEntry | undefined;
  updateEmotion: (id: string, color: string, explanation: string) => void;
  resetPalette: () => void;
  todayIso: string;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<ViewTab>('today');
  const [todayIso] = useState<string>(() => formatDateToIso(new Date()));
  const [selectedEntryForView, setSelectedEntryForView] = useState<JournalEntry | null>(null);
  const [editingEntryDate, setEditingEntryDate] = useState<string | null>(null);

  // Palette State with localStorage + merge preserving user customizations
  const [palette, setPalette] = useState<EmotionDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PALETTE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeSavedPalette(parsed);
        }
      }
    } catch {
      // Fallback
    }
    return EXPANDED_DEFAULT_PALETTE;
  });

  // Entries State with localStorage
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return getSampleEntries(EXPANDED_DEFAULT_PALETTE);
  });

  // Save palette changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PALETTE, JSON.stringify(palette));
    } catch {
      // Ignore quota errors
    }
  }, [palette]);

  // Save entries changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    } catch {
      // Ignore quota errors
    }
  }, [entries]);

  // Re-compute colors when palette changes
  useEffect(() => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) => ({
        ...entry,
        computedColor: computeEntryColor(entry.emotions, palette, entry.customColorOverride),
      }))
    );
  }, [palette]);

  const saveEntry = ({
    date,
    content,
    emotions,
    customColorOverride,
    id,
    evaluationRecord,
  }: {
    date: string;
    content: string;
    emotions: string[];
    customColorOverride?: string | null;
    id?: string;
    evaluationRecord?: import('../types').EvaluationRecord;
  }): JournalEntry => {
    const computedColor = computeEntryColor(emotions, palette, customColorOverride);
    const now = Date.now();

    const existingIndex = entries.findIndex((e) => (id ? e.id === id : e.date === date));
    let savedEntry: JournalEntry;

    if (existingIndex >= 0) {
      savedEntry = {
        ...entries[existingIndex],
        date,
        content,
        emotions,
        customColorOverride: customColorOverride || null,
        computedColor,
        updatedAt: now,
        isSample: false,
        evaluationRecord: evaluationRecord !== undefined ? evaluationRecord : entries[existingIndex].evaluationRecord,
      };
      const copy = [...entries];
      copy[existingIndex] = savedEntry;
      setEntries(copy);
    } else {
      savedEntry = {
        id: id || `entry-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        date,
        createdAt: now,
        updatedAt: now,
        content,
        emotions,
        customColorOverride: customColorOverride || null,
        computedColor,
        isSample: false,
        aiReflection: { status: 'none' },
        evaluationRecord,
      };
      setEntries([savedEntry, ...entries]);
    }

    return savedEntry;
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntryForView?.id === id) {
      setSelectedEntryForView(null);
    }
  };

  const removeSampleEntries = () => {
    setEntries((prev) => prev.filter((e) => !e.isSample));
  };

  const hasSampleEntries = entries.some((e) => e.isSample);

  const getEntryForDate = (dateStr: string) => {
    return entries.find((e) => e.date === dateStr);
  };

  const updateEmotion = (id: string, color: string, explanation: string) => {
    setPalette((prev) =>
      prev.map((e) => (e.id === id ? { ...e, color, explanation } : e))
    );
  };

  const resetPalette = () => {
    setPalette(EXPANDED_DEFAULT_PALETTE);
  };

  return (
    <DiaryContext.Provider
      value={{
        entries,
        palette,
        activeTab,
        setActiveTab,
        selectedEntryForView,
        setSelectedEntryForView,
        editingEntryDate,
        setEditingEntryDate,
        saveEntry,
        deleteEntry,
        removeSampleEntries,
        hasSampleEntries,
        getEntryForDate,
        updateEmotion,
        resetPalette,
        todayIso,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
}

export function useDiary() {
  const context = useContext(DiaryContext);
  if (!context) {
    throw new Error('useDiary must be used within a DiaryProvider');
  }
  return context;
}
