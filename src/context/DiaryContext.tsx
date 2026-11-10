import React, { createContext, useContext, useEffect, useState } from 'react';
import { EmotionDefinition, JournalEntry, ViewTab } from '../types';
import { computeEntryColor } from '../utils/colorUtils';
import { formatDateToIso } from '../utils/dateUtils';

export const INITIAL_PALETTE: EmotionDefinition[] = [
  {
    id: 'happy',
    name: 'Happy',
    color: '#F2CB85',
    explanation: 'A warm, radiant glow like morning sunlight warming cedar wood floorboards.',
    isDefault: true,
  },
  {
    id: 'calm',
    name: 'Calm',
    color: '#A6C4B7',
    explanation: 'Gentle eucalyptus and sea glass; deep, steady breaths when the world slows down.',
    isDefault: true,
  },
  {
    id: 'sad',
    name: 'Sad',
    color: '#94ABC9',
    explanation: 'Soft rain against windowpanes; quiet melancholy that asks for time and gentleness.',
    isDefault: true,
  },
  {
    id: 'anxious',
    name: 'Anxious',
    color: '#D6A08E',
    explanation: 'Dusty terracotta and autumn wind; a restless quickening in the chest.',
    isDefault: true,
  },
  {
    id: 'tired',
    name: 'Tired',
    color: '#AEA6BF',
    explanation: 'Dusk settling into lavender shadow; heavy eyelids and drifting thoughts.',
    isDefault: true,
  },
  {
    id: 'uncertain',
    name: 'Uncertain',
    color: '#B5BAB6',
    explanation: 'Weathered river stone; standing in morning mist where the horizon is yet unformed.',
    isDefault: true,
  },
];

const STORAGE_KEY_ENTRIES = 'in_my_colors_entries_v1';
const STORAGE_KEY_PALETTE = 'in_my_colors_palette_v1';

function getSampleEntries(palette: EmotionDefinition[]): JournalEntry[] {
  // Use dates relative to current date (e.g. November 2026)
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
      aiReflection: {
        status: 'none',
      },
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
      aiReflection: {
        status: 'none',
      },
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
      aiReflection: {
        status: 'none',
      },
    },
    {
      id: 'sample-4',
      date: '2026-11-08',
      createdAt: new Date('2026-11-08T18:45:00').getTime(),
      updatedAt: new Date('2026-11-08T18:45:00').getTime(),
      emotions: ['calm'],
      content:
        'Spent the afternoon organizing books by spine tone and dusting ceramics. Simple physical order brings a quiet joy back into the room.',
      computedColor: computeEntryColor(['calm'], palette),
      isSample: true,
      aiReflection: {
        status: 'none',
      },
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

  // Palette State with localStorage
  const [palette, setPalette] = useState<EmotionDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PALETTE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_PALETTE;
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
    return getSampleEntries(INITIAL_PALETTE);
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
  }: {
    date: string;
    content: string;
    emotions: string[];
    customColorOverride?: string | null;
    id?: string;
  }): JournalEntry => {
    const computedColor = computeEntryColor(emotions, palette, customColorOverride);
    const now = Date.now();

    let savedEntry: JournalEntry;

    setEntries((prev) => {
      const existingIndex = prev.findIndex((e) => (id ? e.id === id : e.date === date));

      if (existingIndex >= 0) {
        const updated: JournalEntry = {
          ...prev[existingIndex],
          date,
          content,
          emotions,
          customColorOverride: customColorOverride || null,
          computedColor,
          updatedAt: now,
          isSample: false,
        };
        savedEntry = updated;
        const copy = [...prev];
        copy[existingIndex] = updated;
        return copy;
      } else {
        const created: JournalEntry = {
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
        };
        savedEntry = created;
        return [created, ...prev];
      }
    });

    return savedEntry!;
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
    setPalette(INITIAL_PALETTE);
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
