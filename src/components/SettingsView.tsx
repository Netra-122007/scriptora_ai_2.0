import React, { useState, useEffect } from 'react';
import { Settings, Camera, Volume2, Globe, Palette, Sliders, Shield, RefreshCw, Check, Zap, Wifi, WifiOff } from 'lucide-react';
import { AppSettings, DrawGesture, EyeBlinkAction, LanguageOption, TTSVoice } from '../types';
import { sound } from '../utils/sound';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetToDefaults: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetToDefaults,
}) => {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    async function getDevices() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setVideoDevices(videoInputs);
        }
      } catch (e) {
        console.warn("Could not enumerate camera devices:", e);
      }
    }
    getDevices();
  }, []);

  const handleSaveFeedback = () => {
    sound.playSuccess();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const colorsList = [
    { name: 'Glowing Cyan', hex: '#38BDF8' },
    { name: 'Royal Blue', hex: '#2563EB' },
    { name: 'Neon Purple', hex: '#A855F7' },
    { name: 'Emerald Green', hex: '#34D399' },
    { name: 'Electric Pink', hex: '#F472B6' },
    { name: 'Solar Amber', hex: '#FBBF24' },
  ];

  const languages: LanguageOption[] = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Hindi', 'Arabic'];
  const voices: TTSVoice[] = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              System Configuration & Preferences
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              v3.1 ENGINE
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Customize camera tracking sensitivity, neural voice models, stroke visual fx, and offline fallback behavior.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (confirm("Reset all settings to default values?")) { sound.playClear(); onResetToDefaults(); } }}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveFeedback}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-1.5"
          >
            {savedMessage ? <Check className="w-4 h-4 text-emerald-300" /> : <Zap className="w-4 h-4 text-yellow-300" />}
            <span>{savedMessage ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Settings Sections Grid */}
      <div className="space-y-6">
        
        {/* Section 1: Camera & Tracking Kinematics */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Camera & Tracking Kinematics</h2>
              <p className="text-xs text-gray-400">Manage video hardware input and MediaPipe joint sensitivity.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-300 uppercase mb-2">
                Video Input Device:
              </label>
              <select
                value={settings.cameraDeviceId}
                onChange={(e) => { sound.playClick(); onUpdateSettings({ cameraDeviceId: e.target.value }); }}
                className="w-full p-3 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-sm text-white outline-none transition-colors"
              >
                <option value="">Default HD Front Webcam</option>
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera Device ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-gray-300 uppercase mb-2 flex justify-between">
                <span>Landmark Smoothing Sensitivity:</span>
                <span className="text-cyan-400 font-extrabold">{settings.sensitivity} / 10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.sensitivity}
                onChange={(e) => onUpdateSettings({ sensitivity: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Hand Landmark Skeletal Overlay</span>
                <span className="text-xs text-gray-400">Display 21 MediaPipe hand joints on camera preview.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.handLandmarks}
                onChange={(e) => { sound.playClick(); onUpdateSettings({ handLandmarks: e.target.checked }); }}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Offline Mode</span>
                <span className="text-xs text-gray-400">Local letter recognition remains available; Cloud AI analysis is disabled and will not return simulated results.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.offlineMode}
                onChange={(e) => { sound.playClick(); onUpdateSettings({ offlineMode: e.target.checked }); }}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-5">
          <div className="pb-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">Custom Gesture Controls</h2>
            <p className="text-xs text-gray-400 mt-1">Choose the hand pose that writes and an optional blink shortcut. These preferences are shared with Live Detection and Calligraphy.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <label className="text-xs font-mono font-bold text-gray-300 uppercase">
              Draw with hand pose
              <select
                value={settings.drawGesture ?? 'pinch'}
                onChange={(e) => { sound.playClick(); onUpdateSettings({ drawGesture: e.target.value as DrawGesture }); }}
                className="mt-2 w-full p-3 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-sm text-white outline-none normal-case"
              >
                <option value="pinch">Pinch thumb and index finger</option>
                <option value="index">Index finger only (other fingers folded)</option>
                <option value="peace">Peace sign (index and middle fingers)</option>
              </select>
            </label>
            <label className="text-xs font-mono font-bold text-gray-300 uppercase">
              Eye blink shortcut
              <select
                value={settings.eyeBlinkAction ?? 'none'}
                onChange={(e) => { sound.playClick(); onUpdateSettings({ eyeBlinkAction: e.target.value as EyeBlinkAction }); }}
                className="mt-2 w-full p-3 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-sm text-white outline-none normal-case"
              >
                <option value="none">Off</option>
                <option value="save">Blink to save the current result</option>
                <option value="clear">Blink to clear the canvas</option>
              </select>
              <span className="block mt-2 text-xs font-normal normal-case text-gray-400">Blink detection runs locally while the webcam is active in Live Detection.</span>
            </label>
          </div>
        </div>

        {/* Section 2: Stroke Aesthetics & Visual FX */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
            <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Stroke Aesthetics & Visual FX</h2>
              <p className="text-xs text-gray-400">Customize holographic air stroke colors, line thickness, and particle explosions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-300 uppercase mb-2 flex justify-between">
                <span>Stroke Line Width:</span>
                <span className="text-cyan-400 font-extrabold">{settings.strokeWidth} px</span>
              </label>
              <input
                type="range"
                min="2"
                max="12"
                value={settings.strokeWidth}
                onChange={(e) => onUpdateSettings({ strokeWidth: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-gray-300 uppercase mb-2">
                Stroke Neon Color Palette:
              </label>
              <div className="flex items-center gap-3 mt-2">
                {colorsList.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => { sound.playClick(); onUpdateSettings({ strokeColor: c.hex }); }}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      settings.strokeColor === c.hex ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex, boxShadow: `0 0 12px ${c.hex}` }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <div>
              <span className="text-sm font-bold text-white block">Floating Neural Particles</span>
              <span className="text-xs text-gray-400">Render 60 FPS glowing background particles and stroke explosions.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.particleEffects}
              onChange={(e) => { sound.playClick(); onUpdateSettings({ particleEffects: e.target.checked }); }}
              className="w-5 h-5 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Section 3: Speech Synthesis & Internationalization */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Speech Synthesis & Language</h2>
              <p className="text-xs text-gray-400">Configure neural TTS voices and target handwriting languages.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-300 uppercase mb-2">
                Target Air Script Language:
              </label>
              <select
                value={settings.language}
                onChange={(e) => { sound.playClick(); onUpdateSettings({ language: e.target.value as any }); }}
                className="w-full p-3 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-sm text-white outline-none transition-colors"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-gray-300 uppercase mb-2">
                Neural TTS Voice:
              </label>
              <select
                value={settings.voiceName}
                onChange={(e) => { sound.playClick(); onUpdateSettings({ voiceName: e.target.value as any }); }}
                className="w-full p-3 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-sm text-white outline-none transition-colors"
              >
                {voices.map((v) => (
                  <option key={v} value={v}>{v} (HD Neural)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-gray-300 uppercase mb-2 flex justify-between">
                <span>Voice Speech Rate:</span>
                <span className="text-emerald-400 font-extrabold">{settings.voiceSpeed}x</span>
              </label>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={settings.voiceSpeed}
                onChange={(e) => onUpdateSettings({ voiceSpeed: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Auto-Speak Recognized Text</span>
                <span className="text-xs text-gray-400">Automatically read air notes aloud when tracking finishes.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => { sound.playClick(); onUpdateSettings({ autoSpeak: e.target.checked }); }}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Sci-Fi UI Audio Synthesizer</span>
                <span className="text-xs text-gray-400">Play futuristic micro-interaction sound effects on hover and click.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => { sound.playClick(); onUpdateSettings({ soundEffects: e.target.checked }); }}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
