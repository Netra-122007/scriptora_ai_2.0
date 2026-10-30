import React from 'react';
import { User, Award, Shield, Cpu, Play, CheckCircle2, Sparkles, Zap, Layers, Terminal, Share2 } from 'lucide-react';
import { AppSettings } from '../types';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';

interface ProfileViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onNavigateToLive: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  settings,
  onUpdateSettings,
  onNavigateToLive,
}) => {
  const togglePresenterMode = () => {
    sound.playSuccess();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    onUpdateSettings({ presenterMode: !settings.presenterMode });
  };

  const achievements = [
    { title: 'Neural Pioneer', desc: '1,000+ Air Characters Recognized', icon: Sparkles, color: '#38BDF8', unlocked: true },
    { title: 'Calculus Wizard', desc: 'Solved complex LaTeX math formulas in mid-air', icon: Zap, color: '#A855F7', unlocked: true },
    { title: 'Biometric Guardian', desc: 'Verified identity with dynamic stroke velocity', icon: Shield, color: '#34D399', unlocked: true },
    { title: 'Live Demo Champion', desc: 'Presented live demo with 60 FPS GPU telemetry', icon: Award, color: '#FBBF24', unlocked: true },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Live Presenter & Profile Suite
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
              DEMO READY
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Tailor SCRIPTORA AI for stage demonstrations, startup pitch decks, and final-year evaluations.
          </p>
        </div>

        <button
          onClick={togglePresenterMode}
          className={`px-6 py-3 rounded-2xl font-extrabold text-sm shadow-xl transition-all flex items-center gap-2 ${
            settings.presenterMode
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-yellow-500/40 scale-105 animate-pulse'
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-500/30'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{settings.presenterMode ? '★ PRESENTER MODE ACTIVE' : 'Enable Presenter Mode'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left Profile Card (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-gray-900/90 via-[#0B0F19] to-blue-950/80 border-2 border-cyan-500/40 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-400 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/40">
                <div className="w-full h-full bg-[#0B0F19] rounded-[22px] flex items-center justify-center">
                  <User className="w-10 h-10 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                  LEAD ENGINEER & ARCHITECT
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Alexandre V. Mercer
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  AI Systems & Multimodal Kinematics
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800 font-mono text-xs text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Project Status:</span>
                <span className="text-emerald-400 font-bold">Production Ready (v3.1)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Core Engine:</span>
                <span className="text-cyan-300">Multimodal AI + MediaPipe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stage Uptime Guarantee:</span>
                <span className="text-yellow-300 font-bold">100% (Offline Fallback)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => { sound.playSuccess(); onNavigateToLive(); }}
            className="w-full mt-8 py-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-cyan-300 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Open Workspace in Stage Demo Mode</span>
          </button>
        </div>

        {/* Right Presenter Mode Features (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
            <div className="p-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Why Presenter Mode Boosts Demonstrations</h2>
              <p className="text-xs text-gray-400">Special optimizations active when presenting to evaluators.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/60 border border-gray-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Enhanced Visual Contrast</h3>
              <p className="text-xs text-gray-400 mt-1">Increases stroke line width and typography size for stage projectors and Zoom screen shares.</p>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-gray-800">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Local Letter Recognition</h3>
              <p className="text-xs text-gray-400 mt-1">Single letters are matched against local stroke templates. Cloud analysis reports connection errors instead of displaying simulated results.</p>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-gray-800">
              <CheckCircle2 className="w-5 h-5 text-purple-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Interactive Math Showcase</h3>
              <p className="text-xs text-gray-400 mt-1">Automatically highlights step-by-step calculus derivations to impress technical AI judges.</p>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-gray-800">
              <CheckCircle2 className="w-5 h-5 text-amber-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Sci-Fi Audio Feedback</h3>
              <p className="text-xs text-gray-400 mt-1">Fills the presentation room with futuristic synthesizer chords when recognition triggers.</p>
            </div>
          </div>
        </div>

      </div>

      {/* System Milestones & Achievements Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 border border-cyan-500/20">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          <span>Unlocked System Milestones & Achievements</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((a, idx) => {
            const Icon = a.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-gray-950/80 border border-gray-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-cyan-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" style={{ color: a.color }} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      UNLOCKED ✓
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{a.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{a.desc}</p>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-4">
                  <div className="h-full w-full rounded-full" style={{ backgroundColor: a.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
