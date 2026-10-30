import React from 'react';
import { Home, Camera, History, BarChart3, Sparkles, Settings, User, Cpu, PenTool } from 'lucide-react';
import { sound } from '../utils/sound';
import { Logo } from './Logo';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { id: 'landing', label: 'Home', icon: Home, badge: '' },
  { id: 'live', label: 'Live Detection', icon: Camera, badge: 'LIVE' },
  { id: 'calligraphy', label: 'AI Font Engine', icon: PenTool, badge: 'NEW' },
  { id: 'features', label: 'AI Features Hub', icon: Sparkles, badge: '8 AI' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: '' },
  { id: 'history', label: 'History Vault', icon: History, badge: '' },
  { id: 'settings', label: 'Settings', icon: Settings, badge: '' },
  { id: 'profile', label: 'Presenter Mode', icon: User, badge: 'DEMO' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <aside className="w-16 md:w-64 shrink-0 bg-gray-950/60 backdrop-blur-2xl border-r border-cyan-500/20 flex flex-col justify-between py-6 transition-all duration-300 z-30">
      
      {/* Top Section */}
      <div className="px-2 md:px-4 space-y-6">
        
        {/* Sidebar Brand Badge */}
        <div 
          onClick={() => { sound.playClick(); onSelectTab('landing'); }}
          className="px-2 py-1.5 cursor-pointer hover:bg-cyan-500/10 rounded-xl transition-colors hidden md:block"
        >
          <Logo size="sm" showSubtitle={false} />
        </div>
        <div 
          onClick={() => { sound.playClick(); onSelectTab('landing'); }}
          className="cursor-pointer flex justify-center md:hidden"
        >
          <Logo size="sm" showText={false} />
        </div>

        {/* Navigation Links */}
        <div className="space-y-1.5">
          <p className="hidden md:block text-[10px] font-mono text-cyan-400/60 tracking-wider uppercase px-3 mb-2">
            SYSTEM MODULES
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playClick();
                  onSelectTab(item.id);
                }}
                onMouseEnter={() => sound.playHover()}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group relative hover:translate-x-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 via-cyan-500/20 to-transparent border-l-4 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900/60 border-l-4 border-transparent hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-all duration-300 group-hover:scale-110 ${
                    isActive ? 'bg-cyan-500/20 text-cyan-400 shadow-sm shadow-cyan-500/30' : 'text-gray-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/10'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="hidden md:block text-sm font-semibold tracking-wide group-hover:text-cyan-200 transition-colors">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span className={`hidden md:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-transform group-hover:scale-105 ${
                    item.badge === 'LIVE'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 group-hover:border-cyan-300'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for mobile collapsed */}
                <div className="md:hidden absolute left-full ml-3 px-2.5 py-1.5 rounded bg-gray-900 text-cyan-300 text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-cyan-500/30 shadow-xl z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Tech Badge */}
      <div className="px-3 md:px-4">
        <div className="hidden md:flex flex-col gap-2 p-3 rounded-2xl bg-gradient-to-br from-blue-950/40 via-gray-900/60 to-black border border-cyan-500/30 shadow-inner">
          <div className="flex items-center gap-2 text-cyan-400">
            <Cpu className="w-4 h-4 animate-spin-slow" />
            <span className="text-xs font-bold font-mono">NEURAL ENGINE 3.1</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            TensorFlow.js + MediaPipe Hands + Multimodal AI Processing.
          </p>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-[94%] rounded-full animate-pulse" />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>GPU Acceleration</span>
            <span className="text-emerald-400">60 FPS</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
