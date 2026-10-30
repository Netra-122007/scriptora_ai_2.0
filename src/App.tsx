/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { NeuralBackground } from './components/NeuralBackground';
import { LandingPage } from './components/LandingPage';
import { LiveDetection } from './components/LiveDetection';
import { SmartCalligrapher } from './components/SmartCalligrapher';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoryView } from './components/HistoryView';
import { ExtraAIFeatures } from './components/ExtraAIFeatures';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { defaultSettings, initialAnalyticsData, initialHistory } from './data/initialData';
import { AppSettings, AnalyticsData, RecognitionResult } from './types';
import { sound } from './utils/sound';
import { Sparkles, Cpu, ShieldCheck, Heart, Github, Terminal } from 'lucide-react';
import {
  clearRecognitionHistory,
  deleteRecognitionResult,
  loadUserData,
  saveRecognitionResult,
  saveUserSettings,
} from './data/supabaseDatabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(initialAnalyticsData);
  const [history, setHistory] = useState<RecognitionResult[]>(initialHistory);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadUserData()
      .then((data) => {
        if (!active) return;
        setSettings(data.settings ?? defaultSettings);
        setHistory(data.history);
        setIsDatabaseReady(true);
        setDatabaseError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unknown database error.';
        setDatabaseError(`Database unavailable: ${message}`);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isDatabaseReady) return;

    const timeout = window.setTimeout(() => {
      saveUserSettings(settings).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown database error.';
        setDatabaseError(`Could not save settings: ${message}`);
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [isDatabaseReady, settings]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
      } else if (e.key === 'm' || e.key === 'M') {
        // Jump to live detection
        if (activeTab !== 'live') setActiveTab('live');
      } else if (e.key === 'c' || e.key === 'C') {
        if (activeTab !== 'calligraphy') setActiveTab('calligraphy');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTab('landing');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const handleUpdateSettings = (newVal: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newVal }));
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
  };

  const handleSaveNote = (note: RecognitionResult) => {
    setHistory((prev) => [note, ...prev]);
    // Update analytics
    setAnalyticsData((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        totalCharacters: prev.metrics.totalCharacters + note.recognizedText.length,
        savedNotesCount: prev.metrics.savedNotesCount + 1,
      },
    }));
    saveRecognitionResult(note)
      .then(() => setDatabaseError(null))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown database error.';
        setDatabaseError(`Could not save recognition history: ${message}`);
      });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    deleteRecognitionResult(id)
      .then(() => setDatabaseError(null))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown database error.';
        setDatabaseError(`Could not delete the history item: ${message}`);
      });
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    clearRecognitionHistory()
      .then(() => setDatabaseError(null))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown database error.';
        setDatabaseError(`Could not clear recognition history: ${message}`);
      });
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {databaseError && (
        <div role="alert" className="relative z-20 border-b border-amber-500/40 bg-amber-950/90 px-4 py-2 text-center text-sm text-amber-100">
          {databaseError}
        </div>
      )}
      
      {/* 3D Neural Network Background Effect */}
      {settings.particleEffects && <NeuralBackground interactive={true} />}

      {/* Top Navbar */}
      <Navbar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onNavigate={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
      />

      {/* Main Container */}
      <div className="flex-1 flex w-full relative z-10">
        
        {/* Sidebar (shown on all pages except Landing Page for clean immersion) */}
        {activeTab !== 'landing' && (
          <Sidebar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />
        )}

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${activeTab === 'landing' ? 'w-full' : ''}`}>
          
          {activeTab === 'landing' && (
            <LandingPage onStart={() => setActiveTab('live')} onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'live' && (
            <LiveDetection settings={settings} onUpdateSettings={handleUpdateSettings} onSaveNote={handleSaveNote} onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'calligraphy' && (
            <SmartCalligrapher settings={settings} onUpdateSettings={handleUpdateSettings} onSaveNote={handleSaveNote} />
          )}

          {activeTab === 'features' && (
            <ExtraAIFeatures onNavigateToLive={() => setActiveTab('live')} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView data={analyticsData} />
          )}

          {activeTab === 'history' && (
            <HistoryView
              history={history}
              onDelete={handleDeleteHistoryItem}
              onClearAll={handleClearAllHistory}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetToDefaults={handleResetSettings}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onNavigateToLive={() => setActiveTab('live')}
            />
          )}

          {/* Animated Footer */}
          <footer className="w-full py-8 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/10 mt-16 bg-black/40 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                <span className="font-bold text-white">SCRIPTORA AI v3.1</span>
                <span>| Air Writing Recognition System</span>
              </div>

              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>60 FPS GPU Acceleration</span>
                </span>
                <span className="hidden md:inline text-cyan-300">Touchless Smart Workspace UX</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsShortcutsOpen(true)}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Shortcuts [?]</span>
                </button>
                <span>© 2026 SCRIPTORA AI</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
