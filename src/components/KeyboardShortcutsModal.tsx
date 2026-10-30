import React from 'react';
import { X, Keyboard, Command, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Pause or resume live air tracking' },
    { key: 'C', desc: 'Clear holographic drawing canvas' },
    { key: 'Z / Ctrl+Z', desc: 'Undo last drawn air stroke' },
    { key: 'S', desc: 'Save current recognition note to Vault' },
    { key: 'M', desc: 'Cycle through recognition modes (Text, Math, Diagram)' },
    { key: 'V', desc: 'Speak recognized text aloud (Neural TTS)' },
    { key: 'Esc', desc: 'Close dialogs or exit full-screen mode' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-[#0B0F19] to-blue-950 border-2 border-cyan-500/40 shadow-2xl text-white">
        
        {/* Close button */}
        <button
          onClick={() => { sound.playClick(); onClose(); }}
          className="absolute top-6 right-6 p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Keyboard className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              QUICK COMMAND REFERENCE
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              System Keyboard Shortcuts
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
          Boost your workflow speed by navigating SCRIPTORA AI hands-free using these keyboard triggers.
        </p>

        {/* Shortcuts List */}
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-black/60 border border-gray-800 hover:border-cyan-500/30 transition-all"
            >
              <span className="text-xs sm:text-sm text-gray-300 font-normal">
                {sc.desc}
              </span>
              <kbd className="px-3 py-1.5 rounded-xl bg-gray-800 border border-gray-700 font-mono text-xs font-black text-cyan-300 shadow-inner shrink-0 ml-4">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between text-xs font-mono text-gray-500">
          <span>Press ESC or Click Close</span>
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SCRIPTORA AI v3.1</span>
          </span>
        </div>

      </div>
    </div>
  );
};
