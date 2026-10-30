import React, { useState } from 'react';
import { Sparkles, Wand2, Calculator, Layers, Fingerprint, Hand, FileText, CheckCircle2, ShieldCheck, Zap, ArrowRight, RefreshCw, Cpu, BookOpen, PenTool } from 'lucide-react';
import { gestureLibrary } from '../data/initialData';
import { sound } from '../utils/sound';

interface ExtraAIFeaturesProps {
  onNavigateToLive: () => void;
}

export const ExtraAIFeatures: React.FC<ExtraAIFeaturesProps> = ({ onNavigateToLive }) => {
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const [demoInput, setDemoInput] = useState("Welecome to SCRIPTORA AI Air Wrting system.");
  const [demoOutput, setDemoOutput] = useState("Welcome to SCRIPTORA AI Air Writing system. [Grammar Enhanced: 100%]");
  const [loading, setLoading] = useState(false);

  const featuresList = [
    {
      id: 0,
      title: "✨ Smart Handwriting Enhancement & Font Transformation Engine",
      icon: PenTool,
      color: "#A855F7",
      badge: "15 FONTS",
      description: "Real-time shaky stroke stabilization, Bezier curve smoothing, and instant transformation into 15 typography styles (Cursive, Calligraphy, Chalkboard, Signature, and more).",
      sampleQuery: "Transform shaky air strokes -> Royal Calligraphy",
      actionLabel: "Simulate Font Transformation",
      handler: async (val: string) => {
        setLoading(true);
        sound.playHover();
        await new Promise(r => setTimeout(r, 600));
        setDemoOutput("✨ [AI Calligrapher Active]: Hand jitter removed via Kalman Filter. Font rendered in: 'Alex Brush' Royal Calligraphy with 99.8% precision.");
        setLoading(false);
        sound.playSuccess();
      },
    },
    {
      id: 1,
      title: "1. Smart Auto-Correction & Grammar Enhancer",
      icon: Wand2,
      color: "#38BDF8",
      badge: "NLP 3.1",
      description: "Air writing can sometimes produce imprecise spacing or trailing strokes. Our neural auto-corrector reconstructs the intended words with context-aware NLP.",
      sampleQuery: "Welecome to SCRIPTORA AI Air Wrting system.",
      actionLabel: "Test Neural Correction",
      handler: async (val: string) => {
        setLoading(true);
        sound.playHover();
        await new Promise(r => setTimeout(r, 600));
        setDemoOutput("Welcome to SCRIPTORA AI Air Writing system. [Correction Applied: Fixed spelling of 'Welcome' and 'Writing']");
        setLoading(false);
        sound.playSuccess();
      },
    },
    {
      id: 2,
      title: "2. AI Word & Sentence Prediction",
      icon: Sparkles,
      color: "#818CF8",
      badge: "PREDICTIVE",
      description: "Anticipates your next words based on spatial trajectory and linguistic context. Speeds up air note-taking by up to 300%.",
      sampleQuery: "Next generation neural",
      actionLabel: "Generate Predictions",
      handler: async (val: string) => {
        setLoading(true);
        sound.playHover();
        await new Promise(r => setTimeout(r, 500));
        setDemoOutput("Predictions for '" + val + "':\n1. [Network Architecture]\n2. [Vision System]\n3. [Kinematic Sensor]\n4. [Computing Paradigm]");
        setLoading(false);
        sound.playSuccess();
      },
    },
    {
      id: 3,
      title: "3. Spatial Gesture Command Library",
      icon: Hand,
      color: "#F472B6",
      badge: "KINEMATICS",
      description: "Trigger system actions without touching a keyboard or screen. Swipe right to redo, circle to save, or draw a sharp X to clear the holographic canvas.",
      sampleQuery: "Draw air circle (〇) or swipe right (───►)",
      actionLabel: "Simulate Gesture Match",
      handler: async () => {
        setLoading(true);
        sound.playHover();
        await new Promise(r => setTimeout(r, 500));
        setDemoOutput("✅ GESTURE DETECTED: [Air Circle 360°]\nCommand Executed: Saved current workspace state to secure Cloud Vault.");
        setLoading(false);
        sound.playSuccess();
      },
    },
    {
      id: 4,
      title: "4. Biometric Signature Verification Vault",
      icon: Fingerprint,
      color: "#FBBF24",
      badge: "SECURITY 99.1%",
      description: "Analyzes dynamic stroke velocity, acceleration curves, and spatial pressure profiles. Impossible to forge with static images.",
      sampleQuery: "Alexandre V. Mercer (Cursive Air Stroke)",
      actionLabel: "Verify Biometric Profile",
      handler: async () => {
        setLoading(true);
        sound.playHover();
        await new Promise(r => setTimeout(r, 700));
        setDemoOutput("🔒 BIOMETRIC VERIFICATION PASSED\nIdentity: Alexandre V. Mercer\nVelocity Match: 99.1% | Symmetry Score: 98.7% | Security Clearance: Granted.");
        setLoading(false);
        sound.playSuccess();
      },
    },
    {
      id: 5,
      title: "5. Math Equation Recognition & Solver",
      icon: Calculator,
      color: "#A855F7",
      badge: "NEURAL MATH",
      description: "Write calculus integrals, algebraic polynomials, or matrix equations in mid-air. SCRIPTORA transcribes LaTeX and solves them step-by-step.",
      sampleQuery: "2x + 15 = 45",
      actionLabel: "Solve Air Equation",
      handler: async (val: string) => {
        setLoading(true);
        sound.playHover();
        await new Promise(r => setTimeout(r, 600));
        setDemoOutput("📐 EQUATION SOLVED:\nInput: " + val + "\nStep 1: Subtract 15 from both sides -> 2x = 30\nStep 2: Divide both sides by 2 -> x = 15\nFinal Answer: x = 15");
        setLoading(false);
        sound.playSuccess();
      },
    },
    {
      id: 6,
      title: "6. Diagram & Flowchart Auto-Structurer",
      icon: Layers,
      color: "#34D399",
      badge: "SMART GRID",
      description: "Transforms rough hand-drawn rectangles, circles, and directional arrows into clean, aligned architectural flowcharts.",
      sampleQuery: "[AI Sensor] --> [Neural Net] --> [Realtime Output]",
      actionLabel: "Structure Flowchart",
      handler: async (val: string) => {
        setLoading(true);
        sound.playHover();
        await new Promise(r => setTimeout(r, 600));
        setDemoOutput("📊 FLOWCHART STRUCTURED:\nNode 01: [AI Sensor] (Box Shape, Aligned Left)\n  ↓ (Directional Vector Arrow)\nNode 02: [Neural Net] (Hexagon Shape, Centered)\n  ↓ (Directional Vector Arrow)\nNode 03: [Realtime Output] (Terminal Shape, Aligned Right)");
        setLoading(false);
        sound.playSuccess();
      },
    },
    {
      id: 7,
      title: "7. AI Note Summarization & Action Item Extractor",
      icon: FileText,
      color: "#60A5FA",
      badge: "SUMMARIZER",
      description: "Condenses lengthy air-written meeting notes into 3 executive takeaways and automatically assigns actionable task lists.",
      sampleQuery: "Meeting notes: Review 60 FPS MediaPipe hand tracking latency. Ensure PDF export works offline. Prepare project pitch demo for tomorrow.",
      actionLabel: "Extract Action Items",
      handler: async (val: string) => {
        setLoading(true);
        sound.playHover();
        await new Promise(r => setTimeout(r, 700));
        setDemoOutput("📋 EXECUTIVE SUMMARY:\nTitle: Project Pitch & Technical Prep\n\n🎯 Key Action Items:\n1. Verify 60 FPS MediaPipe tracking latency.\n2. Audit PDF report export in offline mode.\n3. Rehearse live demonstration.");
        setLoading(false);
        sound.playSuccess();
      },
    },
    {
      id: 8,
      title: "8. OCR & Stroke Quality Enhancement Engine",
      icon: ShieldCheck,
      color: "#4ADE80",
      badge: "TENSORFLOW.JS",
      description: "Applies Kalman filter smoothing and spline interpolation to eliminate hand tremors, resulting in crisp vector typography.",
      sampleQuery: "Raw shaky stroke input vector (Tremor index: 12%)",
      actionLabel: "Apply Kinematic Smoothing",
      handler: async () => {
        setLoading(true);
        sound.playHover();
        await new Promise(r => setTimeout(r, 600));
        setDemoOutput("✨ STROKE ENHANCED:\nTremor Index Reduced from 12% -> 0.2%\nVector Bezier Curves smoothed. Ready for high-definition render.");
        setLoading(false);
        sound.playSuccess();
      },
    },
  ];

  const currentFeat = featuresList[activeFeature];
  const IconComponent = currentFeat.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              8 Extra Neural AI Features Hub
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              MULTIMODAL SUITE
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Explore and interactively test our advanced AI engines powered by Multimodal AI and TensorFlow.js.
          </p>
        </div>

        <button
          onClick={() => { sound.playSuccess(); onNavigateToLive(); }}
          onMouseEnter={() => sound.playHover()}
          className="hover-btn-shine flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/30 transition-all self-start md:self-auto hover:-translate-y-0.5 active:scale-95"
        >
          <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
          <span>Launch in Live Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Left Feature Tabs (4 cols), Right Interactive Demo Playground (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[620px] overflow-y-auto pr-2 smooth-scroll">
          {featuresList.map((f, idx) => {
            const Icon = f.icon;
            const isSel = activeFeature === idx;

            return (
              <button
                key={f.id}
                onClick={() => {
                  sound.playClick();
                  setActiveFeature(idx);
                  setDemoInput(f.sampleQuery);
                  setDemoOutput("Ready. Click button below to run neural simulation.");
                }}
                onMouseEnter={() => sound.playHover()}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 border flex items-start gap-4 group hover:scale-[1.01] active:scale-[0.99] ${
                  isSel
                    ? 'bg-gradient-to-r from-blue-900/40 via-cyan-950/40 to-transparent border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'bg-gray-900/40 hover:bg-gray-900/80 border-gray-800 hover:border-cyan-500/40 text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-all duration-300 shrink-0 mt-0.5 group-hover:scale-110 ${
                  isSel ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'bg-gray-800 text-gray-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/10'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-sm font-bold truncate ${isSel ? 'text-white' : 'text-gray-300'}`}>
                      {f.title.split('. ')[1]}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 border border-blue-500/30 shrink-0 group-hover:border-cyan-300 transition-colors">
                      {f.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Interactive Demo Playground */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-gray-900/90 via-[#0B0F19] to-blue-950/80 border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <IconComponent className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  INTERACTIVE NEURAL TEST BENCH
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {currentFeat.title}
                </h2>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              {currentFeat.description}
            </p>

            {/* Input Box */}
            <div className="mb-6">
              <label className="block text-xs font-mono font-bold text-gray-400 uppercase mb-2">
                Simulated Air Stroke Vector / Text Input:
              </label>
              <textarea
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                rows={3}
                className="w-full p-4 rounded-2xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-sm font-mono text-cyan-200 outline-none transition-colors resize-none"
              />
            </div>

            {/* Run Action Button */}
            <button
              onClick={() => currentFeat.handler(demoInput)}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 sm:from-blue-600 via-cyan-500 to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 transition-all flex items-center justify-center gap-2 mb-6"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-yellow-300" />
                  <span>Processing Multimodal Reasoning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{currentFeat.actionLabel}</span>
                </>
              )}
            </button>

            {/* Output Result Box */}
            <div>
              <label className="block text-xs font-mono font-bold text-emerald-400 uppercase mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Neural Output Result:</span>
              </label>
              <div className="p-4 rounded-2xl bg-black/80 border border-emerald-500/30 text-xs sm:text-sm font-mono text-emerald-300 leading-relaxed min-h-[100px] whitespace-pre-wrap select-all">
                {demoOutput}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between text-xs font-mono text-gray-400">
            <span>Powered by Multimodal AI Reasoning</span>
            <span className="text-cyan-400">GPU Accelerated 60 FPS</span>
          </div>
        </div>

      </div>

      {/* Spatial Gesture Command Library Showcase Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 border border-cyan-500/20">
        <div className="flex items-center gap-3 mb-6">
          <Hand className="w-6 h-6 text-pink-400" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Spatial Air Gesture Command Reference Guide
            </h2>
            <p className="text-xs text-gray-400">
              Perform these hand gestures in the Live Workspace to control SCRIPTORA AI hands-free.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {gestureLibrary.map((g) => (
            <div
              key={g.id}
              onClick={() => {
                sound.playClick();
                alert(`Gesture Guide: ${g.name}\nCommand: ${g.command}\nPattern: ${g.strokePattern}`);
              }}
              className="p-4 rounded-2xl bg-gray-950/80 border border-gray-800 hover:border-pink-500/40 transition-all cursor-pointer group flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-mono font-bold text-pink-400 block mb-1">
                  {g.command}
                </span>
                <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                  {g.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {g.description}
                </p>
              </div>
              <div className="text-lg font-mono font-black text-cyan-300 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800 group-hover:scale-110 transition-transform">
                {g.strokePattern}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
