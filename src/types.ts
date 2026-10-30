export type RecognitionMode = 'text' | 'math' | 'diagram' | 'signature' | 'gesture';

export type LanguageOption = 'English' | 'Spanish' | 'French' | 'German' | 'Japanese' | 'Chinese' | 'Hindi' | 'Arabic';

export type TTSVoice = 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';

export type PenStyle = 'neon' | 'solid' | 'calligraphy' | 'dashed' | 'highlighter';
export type DrawGesture = 'pinch' | 'index' | 'peace';
export type EyeBlinkAction = 'none' | 'save' | 'clear';

export interface AirWritingStroke {
  id: string;
  points: { x: number; y: number; time: number }[];
  color: string;
  width: number;
  style?: PenStyle;
}

export interface RecognitionResult {
  id: string;
  timestamp: number;
  mode: RecognitionMode;
  recognizedText: string;
  confidence: number;
  autoCorrected?: string;
  predictions?: string[];
  detailedAnalysis?: string;
  strokeQuality?: string;
  strokesCount: number;
  durationMs: number;
  language: LanguageOption;
  thumbnailBase64?: string;
}

export interface AnalyticsData {
  dailyStats: {
    day: string;
    characters: number;
    words: number;
    accuracy: number;
    speedWPM: number;
  }[];
  modeDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  confidenceTrend: {
    time: string;
    confidence: number;
    target: number;
  }[];
  metrics: {
    totalCharacters: number;
    averageAccuracy: number;
    averageSpeedWPM: number;
    successRate: number;
    totalSessions: number;
    savedNotesCount: number;
  };
}

export interface AppSettings {
  cameraDeviceId: string;
  sensitivity: number; // 1-10
  strokeWidth: number; // 2-36
  strokeColor: string;
  penStyle?: PenStyle;
  autoAnalyzeDelayMs: number; // e.g., 550
  theme: 'dark' | 'light' | 'cyber' | 'obsidian';
  language: LanguageOption;
  voiceName: TTSVoice;
  voiceSpeed: number; // 0.8 - 1.5
  autoSpeak: boolean;
  soundEffects: boolean;
  particleEffects: boolean;
  handLandmarks: boolean;
  offlineMode: boolean;
  presenterMode: boolean;
  drawGesture?: DrawGesture;
  eyeBlinkAction?: EyeBlinkAction;
}

export interface GestureDefinition {
  id: string;
  name: string;
  icon: string;
  command: string;
  description: string;
  strokePattern: string;
}
