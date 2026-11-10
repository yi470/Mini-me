/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DiaryProvider, useDiary } from './context/DiaryContext';
import { Navigation } from './components/Navigation';
import { TodayPage } from './components/TodayPage';
import { ArchivePage } from './components/ArchivePage';
import { PalettePage } from './components/PalettePage';

function DiaryContent() {
  const { activeTab, setActiveTab } = useDiary();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col justify-between selection:bg-amber-100">
      {/* 3-Zone Navigation Header */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Page Area */}
      <main className="flex-1">
        {activeTab === 'today' && <TodayPage />}
        {activeTab === 'archive' && <ArchivePage />}
        {activeTab === 'palette' && <PalettePage />}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#EAE3D5] py-10 mt-16 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFCF55]" />
            <span className="font-serif italic text-sm text-stone-700">
              In My Colors — A personal archive of emotions through color
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-400">
            <span>Client storage</span>
            <span aria-hidden="true">·</span>
            <span>Intimate &amp; Private</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DiaryProvider>
      <DiaryContent />
    </DiaryProvider>
  );
}
