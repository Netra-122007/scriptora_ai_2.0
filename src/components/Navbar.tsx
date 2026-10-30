import React from 'react';
import { Volume2, VolumeX, Keyboard, ShieldCheck, Zap, Wifi, WifiOff } from 'lucide-react';
import { AppSettings } from '../types';
import { sound } from '../utils/sound';
import { Logo } from './Logo';

interface NavbarProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenShortcuts: () => void;
  onNavigate: (tab: string) => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onUpdateSettings,
  onOpenShortcuts,
  onNavigate,
  activeTab,
}) => {
  const toggleSound = () => {
    const nextVal = !settings.soundEffects;
    onUpdateSettings({ soundEffects: nextVal });
    sound.setEnabled(nextVal);
    if (nextVal) sound.playClick();
  };

  const toggleOffline = () => {
    sound.playClick();
    onUpdateSettings({ offlineMode: !settings.offlineMode });
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-black/40 border-b border-cyan-500/20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => { sound.playClick(); onNavigate('landing'); }}
          className="cursor-pointer group hover:scale-[1.02] transition-transform duration-200"
        >
          <Logo size="md" />
        </div>

        {/* Center Badges (Accuracy & Status) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 hover:border-cyan-400/50 hover:bg-blue-900/50 hover:scale-105 transition-all duration-300 cursor-default">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Character engine:</span>
            <span className="font-mono font-bold text-cyan-400">Local templates</span>
          </div>

          <button
            onClick={toggleOffline}
            onMouseEnter={() => sound.playHover()}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 hover:scale-105 ${
              settings.offlineMode
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:border-amber-400 shadow-sm shadow-amber-500/20'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 shadow-sm shadow-emerald-500/20'
            }`}
            title="Cloud analysis for non-text modes; text recognition remains local"
          >
            {settings.offlineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{settings.offlineMode ? 'Offline (local text)' : 'Cloud mode (non-text)'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            onMouseEnter={() => sound.playHover()}
            className="p-2 rounded-xl bg-gray-900/60 hover:bg-gray-800/90 border border-gray-800 hover:border-cyan-400 text-gray-300 hover:text-cyan-400 hover:scale-105 transition-all duration-200 active:scale-95"
            title={settings.soundEffects ? "Mute Sci-Fi Audio" : "Enable Sci-Fi Audio"}
          >
            {settings.soundEffects ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* Keyboard Shortcuts */}
          <button
            onClick={() => { sound.playClick(); onOpenShortcuts(); }}
            onMouseEnter={() => sound.playHover()}
            className="p-2 rounded-xl bg-gray-900/60 hover:bg-gray-800/90 border border-gray-800 hover:border-cyan-400 text-gray-300 hover:text-cyan-400 hover:scale-105 transition-all duration-200 flex items-center gap-1.5 text-xs active:scale-95"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden lg:inline font-mono text-[11px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">?</span>
          </button>

          {/* CTA Action */}
          {activeTab !== 'live' ? (
            <button
              onClick={() => { sound.playSuccess(); onNavigate('live'); }}
              onMouseEnter={() => sound.playHover()}
              className="hover-btn-shine relative group px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-bounce group-hover:scale-110 transition-transform" />
              <span>Start Air Writing</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-xs font-bold animate-pulse hover:border-cyan-300 transition-colors">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
              <span>LIVE DETECTOR ACTIVE</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
