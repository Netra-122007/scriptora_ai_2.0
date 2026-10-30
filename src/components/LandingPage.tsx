import React, { useState, useEffect } from 'react';
import { Sparkles, Camera, Zap, Shield, Cpu, ArrowRight, Play, CheckCircle2, Layers, Award, Wand2 } from 'lucide-react';
import { sound } from '../utils/sound';
import { Logo } from './Logo';

interface LandingPageProps {
  onStart: () => void;
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onNavigate }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [demoTextIndex, setDemoTextIndex] = useState(0);

  const demoPhrases = [
    "E = mc² + \\int x² dx",
    "Welcome to SCRIPTORA AI",
    "Write in the Air. Let AI Understand.",
    "Biometric Signature Verified ✓",
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 30;
      const y = (e.clientY / innerHeight - 0.5) * -30;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoTextIndex((prev) => (prev + 1) % demoPhrases.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden pb-24 text-white">
      
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16 flex flex-col items-center text-center z-10">
        
        {/* Top Award Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-900/60 via-cyan-900/40 to-blue-900/60 border border-cyan-500/40 shadow-lg shadow-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-8 animate-bounce">
          <Award className="w-4 h-4 text-cyan-400" />
          <span>AI-POWERED TOUCHLESS SMART WORKSPACE</span>
        </div>

        {/* 3D Glowing Hologram Logo with Tilt */}
        <div
          className="relative mb-8 cursor-pointer group transition-transform duration-200 ease-out flex flex-col items-center"
          style={{
            transform: `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          }}
          onClick={() => { sound.playSuccess(); onStart(); }}
        >
          {/* Glowing Aura */}
          <div className="absolute -inset-8 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-pulse" />
          
          <Logo size="xl" showText={false} />

          {/* Floating Orbital Rings */}
          <div className="absolute -inset-4 border border-cyan-500/30 rounded-full animate-spin-slow pointer-events-none" style={{ animationDuration: '20s' }} />
          <div className="absolute -inset-8 border border-blue-500/20 rounded-full animate-spin-reverse-slow pointer-events-none" style={{ animationDuration: '30s' }} />
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6">
          <span className="bg-gradient-to-r from-white via-cyan-100 to-gray-300 bg-clip-text text-transparent drop-shadow-sm">
            SCRIPTORA
          </span>{" "}
          <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(37,99,235,0.6)]">
            AI
          </span>
        </h1>

        {/* Tagline */}
        <p className="max-w-3xl text-xl sm:text-2xl md:text-3xl font-extrabold text-cyan-200/90 mb-8 leading-relaxed tracking-wide">
          "Write in the Air. Let AI Understand."
        </p>

        <p className="max-w-2xl text-base sm:text-lg text-gray-400 mb-10 leading-relaxed font-normal">
          Experience world-class real-time hand landmark tracking, neural character & math formula recognition, biometric signature verification, and instant speech output.
        </p>

        {/* Animated CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full max-w-2xl">
          <button
            onClick={() => { sound.playSuccess(); onStart(); }}
            onMouseEnter={() => sound.playHover()}
            className="flex-1 min-w-[220px] hover-btn-shine relative group overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white font-extrabold text-lg shadow-[0_0_35px_rgba(37,99,235,0.6)] hover:shadow-[0_0_50px_rgba(56,189,248,0.9)] transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-1.5 active:scale-95"
          >
            <Camera className="w-6 h-6 text-yellow-300 animate-pulse group-hover:scale-110 transition-transform" />
            <span>Start Air Writing</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>

          <button
            onClick={() => { sound.playClick(); onNavigate('calligraphy'); }}
            onMouseEnter={() => sound.playHover()}
            className="hover-btn-shine px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-900/80 to-blue-900/80 hover:from-purple-800 hover:to-blue-800 border border-purple-500/50 hover:border-purple-300 text-purple-200 font-bold text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-1 active:scale-95"
          >
            <Wand2 className="w-5 h-5 text-purple-300 animate-spin-slow group-hover:scale-110 transition-transform" />
            <span>AI Font Engine & Calligrapher</span>
          </button>

          <button
            onClick={() => { sound.playClick(); onNavigate('features'); }}
            onMouseEnter={() => sound.playHover()}
            className="hover-btn-shine px-6 py-4 rounded-2xl bg-gray-900/80 hover:bg-gray-800 border border-cyan-500/30 hover:border-cyan-300 text-cyan-300 font-bold text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-95"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Explore 8 AI Hubs</span>
          </button>
        </div>

        {/* Live Simulation Banner */}
        <div className="mt-16 w-full max-w-4xl p-1 rounded-3xl bg-gradient-to-r from-blue-500/30 via-cyan-500/40 to-indigo-500/30 shadow-2xl">
          <div className="w-full bg-[#0B0F19]/90 backdrop-blur-2xl rounded-[22px] p-6 sm:p-8 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                <Play className="w-6 h-6 text-cyan-400 fill-cyan-400 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  REAL-TIME NEURAL STREAM DEMO
                </span>
                <p className="text-lg sm:text-xl font-bold text-white mt-1 transition-all duration-500 font-mono">
                  &gt; {demoPhrases[demoTextIndex]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>CONFIDENCE: 99.4%</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono">
                <span>60 FPS GPU</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Engineered for Breathtaking Performance
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Combining MediaPipe hand tracking, TensorFlow.js kinematics, and Multimodal AI reasoning into a seamless glassmorphic workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1 */}
          <div className="hover-card-glow p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 group shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600/30 transition-all duration-300">
              <Camera className="w-7 h-7 text-cyan-400 group-hover:rotate-6 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-between">
              <span>Live Camera Air Tracking</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded group-hover:bg-cyan-500/20 transition-colors">MediaPipe</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Real-time 21-joint hand landmark detection. Follows your index finger tip with glowing neon particle trails and zero perceptible latency.
            </p>
          </div>

          {/* Card 2 */}
          <div className="hover-card-glow p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 group shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600/30 transition-all duration-300">
              <Cpu className="w-7 h-7 text-purple-400 group-hover:rotate-6 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-between">
              <span>Math Equation Solver</span>
              <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded group-hover:bg-purple-500/20 transition-colors">Neural AI</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Write complex calculus, algebraic equations, or physics formulas in thin air. AI instantly transcribes and solves them step-by-step.
            </p>
          </div>

          {/* Card 3 */}
          <div className="hover-card-glow p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 group shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600/30 transition-all duration-300">
              <Shield className="w-7 h-7 text-emerald-400 group-hover:rotate-6 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-between">
              <span>Biometric Signatures</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded group-hover:bg-emerald-500/20 transition-colors">99.1% Acc</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Verify identity through spatial stroke velocity and cursive symmetry analysis. Perfect for secure futuristic authentication demos.
            </p>
          </div>

          {/* Card 4 */}
          <div className="hover-card-glow p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 group shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-600/30 transition-all duration-300">
              <Zap className="w-7 h-7 text-amber-400 group-hover:rotate-6 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-between">
              <span>Instant Speech TTS</span>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded group-hover:bg-amber-500/20 transition-colors">5 Voices</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Let SCRIPTORA AI speak your air-written thoughts aloud using high-definition neural voices (Zephyr, Kore, Puck, Charon, Fenrir).
            </p>
          </div>

          {/* Card 5 */}
          <div className="hover-card-glow p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 group shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-600/30 transition-all duration-300">
              <Layers className="w-7 h-7 text-cyan-400 group-hover:rotate-6 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-between">
              <span>Diagram Auto-Structurer</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded group-hover:bg-cyan-500/20 transition-colors">Smart Grid</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Draw messy boxes, arrows, and circles in the air. SCRIPTORA cleans them up into structured flowcharts and markdown schemas.
            </p>
          </div>

          {/* Card 6 */}
          <div className="hover-card-glow p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-cyan-500/20 group shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600/30 transition-all duration-300">
              <CheckCircle2 className="w-7 h-7 text-indigo-400 group-hover:rotate-6 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-between">
              <span>Production Ready</span>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded group-hover:bg-indigo-500/20 transition-colors">PDF Export</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Includes Presenter Mode, interactive charts, PDF document export, multi-language support, and simulated fallbacks for any environment.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
