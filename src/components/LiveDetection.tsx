import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Play, Pause, Trash2, RotateCcw, Copy, Volume2, VolumeX, Save, Sparkles, Check, AlertCircle, ShieldCheck, Cpu, Wand2, Calculator, Layers, Fingerprint, Hand, Palette, Highlighter, PenTool, Zap, Sliders, Activity, Gauge, ZoomIn, ZoomOut } from 'lucide-react';
import { AppSettings, DrawGesture, EyeBlinkAction, RecognitionMode, RecognitionResult, PenStyle } from '../types';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sound';
import { CHARACTER_COMMIT_DELAY_MS, classifyStrokesLocally, getPredictionsForWord, recognizeCharacterLocally } from '../utils/strokeRecognizer';
import { matchesFingerPose } from '../utils/gestureRecognition';

interface LiveDetectionProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSaveNote: (note: RecognitionResult) => void;
  onNavigate?: (tab: string) => void;
}

export interface CanvasStrokeObject {
  points: Array<{ x: number; y: number; time: number }>;
  color: string;
  width: number;
  style: PenStyle;
}

const loadMediaPipeScripts = async (): Promise<boolean> => {
  if ((window as any).Hands && (window as any).Camera) return true;
  const scripts = [
    'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
  ];
  for (const src of scripts) {
    if (!document.querySelector(`script[src="${src}"]`)) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    }
  }
  let attempts = 0;
  while (!(window as any).Hands && attempts < 40) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }
  return !!(window as any).Hands;
};

const loadFaceMeshScript = async (): Promise<boolean> => {
  const src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
  if (!(window as any).FaceMesh && !document.querySelector(`script[src="${src}"]`)) {
    await new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  let attempts = 0;
  while (!(window as any).FaceMesh && attempts < 40) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }
  return !!(window as any).FaceMesh;
};

export const LiveDetection: React.FC<LiveDetectionProps> = ({ settings, onUpdateSettings, onSaveNote, onNavigate }) => {
  const [mode, setMode] = useState<RecognitionMode>('text');
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isTracking, setIsTracking] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Real-time Finger Tracking UI State
  const [handDetected, setHandDetected] = useState(false);
  const fingerDrawMode = settings.drawGesture ?? 'pinch';
  const [fingerDistance, setFingerDistance] = useState<number>(100);

  // Creative Pen & Brush Studio State
  const [penStyle, setPenStyle] = useState<PenStyle>(settings.penStyle || 'neon');
  const [strokeColor, setStrokeColor] = useState<string>(settings.strokeColor || '#00F0FF');
  const [strokeWidth, setStrokeWidth] = useState<number>(settings.strokeWidth || 6);
  const [isHighlighterMode, setIsHighlighterMode] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState<'instant' | 'neural'>('instant');
  const [analysisDurationMs, setAnalysisDurationMs] = useState<number | null>(null);
  const [detectionSpeedMode, setDetectionSpeedMode] = useState<'turbo' | 'hybrid' | 'deep'>('hybrid');
  const detectionSpeedModeRef = useRef(detectionSpeedMode);
  useEffect(() => { detectionSpeedModeRef.current = detectionSpeedMode; }, [detectionSpeedMode]);

  // Stroke data
  const [strokes, setStrokes] = useState<Array<CanvasStrokeObject>>([]);
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number; time: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);

  // Recognition Results
  const [recognizedText, setRecognizedText] = useState("SCRIPTORA AI Ready. Draw in the air!");
  const [confidence, setConfidence] = useState(0);
  const [autoCorrected, setAutoCorrected] = useState("");
  const [predictions, setPredictions] = useState<string[]>([]);
  const [detailedAnalysis, setDetailedAnalysis] = useState("Awaiting air stroke pattern input. You can write letters, math equations, diagrams, or signatures.");
  const [strokeQuality, setStrokeQuality] = useState("Optimal Flow");
  
  // UI feedback
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs & Stale-closure prevention mirrors
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzeTimeoutRef = useRef<any>(null);
  const mediaPipeHandsRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraUtilRef = useRef<any>(null);
  const latestLandmarksRef = useRef<any>(null);
  const eyeBlinkActionRef = useRef<EyeBlinkAction>(settings.eyeBlinkAction ?? 'none');
  const eyeBlinkCallbackRef = useRef<() => void>(() => {});
  const eyesClosedRef = useRef(false);
  const lastBlinkActionAtRef = useRef(0);

  // Tracking stabilization & anti-jitter refs
  const consecutiveMissedFramesRef = useRef<number>(0);
  const smoothedFingertipRef = useRef<{ x: number; y: number } | null>(null);
  const trackingVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const isProcessingFrameRef = useRef<boolean>(false);
  const consecutiveReleaseFramesRef = useRef<number>(0);

  // Completed characters are accumulated only after a short pause between strokes.
  const accumulatedWordRef = useRef<string>('');
  const currentLetterRef = useRef<string>('');
  const currentLetterStrokesRef = useRef<CanvasStrokeObject[]>([]);
  const committedCharacterGroupsRef = useRef<Array<{
    character: string;
    strokes: CanvasStrokeObject[];
    minX: number;
    maxX: number;
    width: number;
  }>>([]);
  const previousCharacterBoundsRef = useRef<{ minX: number; maxX: number; width: number } | null>(null);
  const lastStrokeEndTimeRef = useRef<number>(0);
  const letterCommitTimeoutRef = useRef<any>(null);
  const characterCommitQueueRef = useRef<Promise<void>>(Promise.resolve());
  const characterSessionRef = useRef(0);
  const characterAnalysisSequenceRef = useRef(0);

  const penStyleRef = useRef(penStyle);
  useEffect(() => { penStyleRef.current = penStyle; }, [penStyle]);

  const strokeColorRef = useRef(strokeColor);
  useEffect(() => { strokeColorRef.current = strokeColor; }, [strokeColor]);

  const strokeWidthRef = useRef(strokeWidth);
  useEffect(() => { strokeWidthRef.current = strokeWidth; }, [strokeWidth]);

  const isHighlighterModeRef = useRef(isHighlighterMode);
  useEffect(() => { isHighlighterModeRef.current = isHighlighterMode; }, [isHighlighterMode]);

  const strokesRef = useRef(strokes);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  const currentStrokeRef = useRef(currentStroke);
  useEffect(() => { currentStrokeRef.current = currentStroke; }, [currentStroke]);

  const isDrawingRef = useRef(isDrawing);
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);

  const isTrackingRef = useRef(isTracking);
  useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);

  const fingerDrawModeRef = useRef<DrawGesture>(fingerDrawMode);
  useEffect(() => { fingerDrawModeRef.current = fingerDrawMode; }, [fingerDrawMode]);
  useEffect(() => { eyeBlinkActionRef.current = settings.eyeBlinkAction ?? 'none'; }, [settings.eyeBlinkAction]);

  useEffect(() => () => {
    if (letterCommitTimeoutRef.current) clearTimeout(letterCommitTimeoutRef.current);
    if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
  }, []);

  // Initialize MediaPipe if webcam turns on
  useEffect(() => {
    if (!isWebcamActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (cameraUtilRef.current) {
        cameraUtilRef.current.stop();
        cameraUtilRef.current = null;
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function setupCameraAndMediaPipe() {
      try {
        setErrorMessage(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: settings.cameraDeviceId ? { exact: settings.cameraDeviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Dynamically load MediaPipe Hands if needed
        const isLoaded = await loadMediaPipeScripts();
        if (!isLoaded || !(window as any).Hands || !(window as any).Camera) {
          setErrorMessage("Could not load MediaPipe from CDN. Please check network or draw directly on the interactive canvas!");
          return;
        }

        const hands = new (window as any).Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if ((settings.eyeBlinkAction ?? 'none') !== 'none') {
          const faceMeshLoaded = await loadFaceMeshScript();
          if (!isMounted) return;
          if (!faceMeshLoaded) {
            setErrorMessage('Could not load eye-blink detection. Check your network or turn off the blink shortcut in Settings.');
          } else {
            const faceMesh = new (window as any).FaceMesh({
              locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });
            faceMesh.setOptions({
              maxNumFaces: 1,
              refineLandmarks: true,
              minDetectionConfidence: 0.5,
              minTrackingConfidence: 0.5,
            });
            faceMesh.onResults((results: any) => {
              const face = results.multiFaceLandmarks?.[0];
              if (!face) {
                eyesClosedRef.current = false;
                return;
              }

              const distance = (a: number, b: number) => Math.hypot(face[a].x - face[b].x, face[a].y - face[b].y);
              const eyeAspectRatio = (corners: [number, number], upper: [number, number], lower: [number, number]) =>
                (distance(upper[0], lower[0]) + distance(upper[1], lower[1]))
                / (2 * distance(corners[0], corners[1]));
              const leftEye = eyeAspectRatio([33, 133], [160, 158], [144, 153]);
              const rightEye = eyeAspectRatio([362, 263], [385, 387], [380, 373]);
              const eyesClosed = leftEye < 0.19 && rightEye < 0.19;

              if (eyesClosed && !eyesClosedRef.current && Date.now() - lastBlinkActionAtRef.current > 1200) {
                lastBlinkActionAtRef.current = Date.now();
                if (eyeBlinkActionRef.current !== 'none') eyeBlinkCallbackRef.current();
              }
              eyesClosedRef.current = eyesClosed;
            });
            faceMeshRef.current = faceMesh;
          }
        }

        hands.onResults((results: any) => {
          if (!isMounted || !isTrackingRef.current) return;
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            latestLandmarksRef.current = landmarks;
            consecutiveMissedFramesRef.current = 0;
            setHandDetected(true);

            // Index finger tip is landmark 8
            const indexTip = landmarks[8];
            if (indexTip && canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              const rawX = (1 - indexTip.x) * rect.width; // Mirror horizontal
              const rawY = indexTip.y * rect.height;

              let targetX = rawX;
              let targetY = rawY;

              // Landmark coordinate smoothing with velocity-adaptive filter & anti-jump protection
              if (!smoothedFingertipRef.current) {
                smoothedFingertipRef.current = { x: rawX, y: rawY };
              } else {
                const dx = rawX - smoothedFingertipRef.current.x;
                const dy = rawY - smoothedFingertipRef.current.y;
                const distMoved = Math.hypot(dx, dy);

                // Anti-jump: Clamp unnatural single-frame teleports (>180px) to prevent sudden jumps
                const maxStep = 180;
                const moveX = distMoved > maxStep ? (dx / distMoved) * maxStep : dx;
                const moveY = distMoved > maxStep ? (dy / distMoved) * maxStep : dy;

                // Adaptive alpha: Fine precision at low speed (alpha ~0.42), instant zero-lag responsiveness at higher speed (alpha ~0.85)
                const alpha = Math.min(0.85, Math.max(0.42, 0.42 + (distMoved / 70) * 0.43));
                const sX = smoothedFingertipRef.current.x + moveX * alpha;
                const sY = smoothedFingertipRef.current.y + moveY * alpha;

                // Track velocity for dead-reckoning extrapolation during brief occlusion
                trackingVelocityRef.current = {
                  vx: (sX - smoothedFingertipRef.current.x) * 0.5 + trackingVelocityRef.current.vx * 0.5,
                  vy: (sY - smoothedFingertipRef.current.y) * 0.5 + trackingVelocityRef.current.vy * 0.5,
                };

                smoothedFingertipRef.current = { x: sX, y: sY };
                targetX = sX;
                targetY = sY;
              }

              const thumbTip = landmarks[4];
              const wrist = landmarks[0];
              const middleMcp = landmarks[9];
              const handScale = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.2;

              const dist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
              const normDist = Math.round((dist / handScale) * 100);
              setFingerDistance(normDist);

              let shouldDraw = false;
              const currentlyDrawing = isDrawingRef.current;

              if (fingerDrawModeRef.current === 'pinch') {
                // Hysteresis Schmitt trigger: Wider release boundary to prevent rapid on-off flutter
                if (currentlyDrawing) {
                  shouldDraw = dist < (handScale * 0.52) || dist < 0.088;
                } else {
                  shouldDraw = dist < (handScale * 0.42) || dist < 0.072;
                }
              } else {
                shouldDraw = matchesFingerPose(landmarks, fingerDrawModeRef.current);
              }

              if (shouldDraw) {
                consecutiveReleaseFramesRef.current = 0;
                addStrokePoint(targetX, targetY);
              } else {
                consecutiveReleaseFramesRef.current++;
                // Graceful release debounce (require 2 frames before ending stroke)
                if (consecutiveReleaseFramesRef.current >= 2 && currentStrokeRef.current.length > 0) {
                  endStroke();
                }
              }
            }
          } else {
            // Temporary detection loss handling
            consecutiveMissedFramesRef.current++;

            // GRACE PERIOD: Allow up to 5 consecutive missed frames (~150ms) before dropping the hand
            if (consecutiveMissedFramesRef.current <= 5) {
              if (smoothedFingertipRef.current && currentStrokeRef.current.length > 0) {
                // Maintain smooth trajectory via damped velocity extrapolation
                const vx = trackingVelocityRef.current.vx * 0.6;
                const vy = trackingVelocityRef.current.vy * 0.6;
                smoothedFingertipRef.current.x += vx;
                smoothedFingertipRef.current.y += vy;
                trackingVelocityRef.current = { vx, vy };

                if (Math.hypot(vx, vy) > 2.5) {
                  addStrokePoint(smoothedFingertipRef.current.x, smoothedFingertipRef.current.y);
                }
              }
            } else {
              // Genuinely lost tracking (> 5 frames)
              latestLandmarksRef.current = null;
              smoothedFingertipRef.current = null;
              trackingVelocityRef.current = { vx: 0, vy: 0 };
              consecutiveReleaseFramesRef.current = 0;
              setHandDetected(false);
              if (currentStrokeRef.current.length > 0) {
                endStroke();
              }
            }
          }
        });

        mediaPipeHandsRef.current = hands;

        if (videoRef.current) {
          const camera = new (window as any).Camera(videoRef.current, {
            onFrame: async () => {
              // Frame processing lock to prevent backlog, lag, and pointer jumps
              if (isProcessingFrameRef.current) return;
              if (mediaPipeHandsRef.current && videoRef.current && videoRef.current.readyState >= 2) {
                isProcessingFrameRef.current = true;
                try {
                  await mediaPipeHandsRef.current.send({ image: videoRef.current });
                  if (faceMeshRef.current) await faceMeshRef.current.send({ image: videoRef.current });
                } catch (err) {
                  console.debug("MediaPipe send error:", err);
                } finally {
                  isProcessingFrameRef.current = false;
                }
              }
            },
            width: 1280,
            height: 720,
          });
          camera.start();
          cameraUtilRef.current = camera;
        }
      } catch (err: any) {
        console.warn("Webcam access warning:", err);
        setErrorMessage("Webcam permission denied or unavailable in sandbox. Interactive Holographic Air Canvas mode is fully active!");
        setIsWebcamActive(false);
      }
    }

    setupCameraAndMediaPipe();

    return () => {
      isMounted = false;
      isProcessingFrameRef.current = false;
      smoothedFingertipRef.current = null;
      consecutiveMissedFramesRef.current = 0;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (cameraUtilRef.current) cameraUtilRef.current.stop();
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
    };
  }, [isWebcamActive, settings.cameraDeviceId, settings.eyeBlinkAction]);

  const finalizeCurrentLetter = () => {
    if (letterCommitTimeoutRef.current) {
      clearTimeout(letterCommitTimeoutRef.current);
      letterCommitTimeoutRef.current = null;
    }

    const letterStrokes = currentLetterStrokesRef.current;
    if (letterStrokes.length === 0) return;

    const startTime = performance.now();
    const result = recognizeCharacterLocally(letterStrokes.map(stroke => stroke.points));
    currentLetterStrokesRef.current = [];
    currentLetterRef.current = '';
    lastStrokeEndTimeRef.current = 0;
    setConfidence(result.confidence);
    setAnalysisDurationMs(Math.max(1, Math.round(performance.now() - startTime)));

    const session = characterSessionRef.current;
    const sequence = ++characterAnalysisSequenceRef.current;
    const localDetail = `Best local character match: '${result.character || result.candidate}' at ${result.confidence}% confidence (distance ${result.matchDistance.toFixed(2)}).`;
    setDetailedAnalysis(localDetail);
    setStrokeQuality('Local template match');

    characterCommitQueueRef.current = characterCommitQueueRef.current.then(() => {
      if (session !== characterSessionRef.current) return;

      if (session !== characterSessionRef.current) return;
      if (sequence === characterAnalysisSequenceRef.current) {
        setConfidence(result.confidence);
        setAnalysisDurationMs(Math.max(1, Math.round(performance.now() - startTime)));
        setStrokeQuality('Local template match');
        setDetailedAnalysis(localDetail);
      }

      const character = result.character || result.candidate;
      if (!character) return;
      const characterPoints = letterStrokes.flatMap(stroke => stroke.points);
      const characterMinX = Math.min(...characterPoints.map(point => point.x));
      const characterMaxX = Math.max(...characterPoints.map(point => point.x));
      const previousBounds = previousCharacterBoundsRef.current;
      const gap = previousBounds ? characterMinX - previousBounds.maxX : 0;
      if (
        previousBounds &&
        characterMinX >= previousBounds.minX &&
        gap > Math.max(28, previousBounds.width * 0.7) &&
        !accumulatedWordRef.current.endsWith(' ')
      ) {
        accumulatedWordRef.current += ' ';
      }
      accumulatedWordRef.current += character;
      previousCharacterBoundsRef.current = {
        minX: characterMinX,
        maxX: characterMaxX,
        width: Math.max(1, characterMaxX - characterMinX),
      };
      committedCharacterGroupsRef.current.push({
        character,
        strokes: letterStrokes,
        minX: characterMinX,
        maxX: characterMaxX,
        width: Math.max(1, characterMaxX - characterMinX),
      });
      const recognizedWord = accumulatedWordRef.current;
      setRecognizedText(recognizedWord);
      setAutoCorrected(recognizedWord);
      setPredictions(getPredictionsForWord(recognizedWord));
      if (sequence === characterAnalysisSequenceRef.current) {
        setDetailedAnalysis(`${localDetail} Added '${character}' once to the output.`);
      }
      sound.playSuccess();
    }).catch(error => {
      console.error('Character recognition queue failed:', error);
      if (session === characterSessionRef.current && sequence === characterAnalysisSequenceRef.current) {
        setDetailedAnalysis('Character recognition failed unexpectedly. Please draw the character again.');
        setStrokeQuality('Recognition error');
        setIsAnalyzing(false);
      }
    });
  };

  // Stroke point logic with Stale-Closure Prevention
  const addStrokePoint = (x: number, y: number) => {
    if (!isTrackingRef.current) return;
    const canvas = canvasRef.current;
    if (canvas && canvasZoom !== 1) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      x = (x - centerX) / canvasZoom + centerX;
      y = (y - centerY) / canvasZoom + centerY;
    }
    if (!isDrawingRef.current) {
      if (
        modeRef.current === 'text' &&
        currentLetterStrokesRef.current.length > 0 &&
        lastStrokeEndTimeRef.current > 0 &&
        Date.now() - lastStrokeEndTimeRef.current >= CHARACTER_COMMIT_DELAY_MS
      ) {
        finalizeCurrentLetter();
      }

      isDrawingRef.current = true;
      setIsDrawing(true);
      sound.playStrokeStart();

      // Clear any pending letter commit timeout
      if (letterCommitTimeoutRef.current) {
        clearTimeout(letterCommitTimeoutRef.current);
        letterCommitTimeoutRef.current = null;
      }

    }
    const point = { x, y, time: Date.now() };
    const nextStroke = [...currentStrokeRef.current, point];
    currentStrokeRef.current = nextStroke;
    setCurrentStroke(nextStroke);

    // Reset analyze debounce
    if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
  };

  const endStroke = () => {
    const cur = currentStrokeRef.current;
    if (cur.length > 2) {
      const activeStyle = isHighlighterModeRef.current ? 'highlighter' : penStyleRef.current;
      const activeColor = isHighlighterModeRef.current ? '#FACC15' : strokeColorRef.current;
      const activeWidth = isHighlighterModeRef.current ? Math.max(16, strokeWidthRef.current * 2) : strokeWidthRef.current;

      const newStroke: CanvasStrokeObject = {
        points: cur,
        color: activeColor,
        width: activeWidth,
        style: activeStyle,
      };

      const updatedStrokes = [...strokesRef.current, newStroke];
      strokesRef.current = updatedStrokes;
      setStrokes(updatedStrokes);
      currentStrokeRef.current = [];
      setCurrentStroke([]);
      isDrawingRef.current = false;
      setIsDrawing(false);

      if (modeRef.current === 'text') {
        currentLetterStrokesRef.current = [...currentLetterStrokesRef.current, newStroke];
        lastStrokeEndTimeRef.current = Date.now();
        if (letterCommitTimeoutRef.current) clearTimeout(letterCommitTimeoutRef.current);
        letterCommitTimeoutRef.current = setTimeout(finalizeCurrentLetter, CHARACTER_COMMIT_DELAY_MS);
        setDetailedAnalysis('Stroke captured. Pause briefly to recognize the completed character.');
        return;
      } else {
        // Other modes: math, diagram, signature, gesture
        const instant = classifyStrokesLocally(updatedStrokes, modeRef.current, recognizedText);
        setRecognizedText(instant.recognizedText);
        setConfidence(instant.confidence);
        setAutoCorrected(instant.autoCorrected);
        if (instant.predictions.length > 0) setPredictions(instant.predictions);
        setDetailedAnalysis(instant.detailedAnalysis);
        setStrokeQuality(instant.strokeQuality);
        setAnalysisDurationMs(instant.latencyMs);

        // If Turbo mode is active, user gets immediate instant detection!
        if (detectionSpeedModeRef.current === 'turbo') {
          sound.playSuccess();
          return;
        }

        // Hybrid or Deep mode: Schedule async cloud refinement with ultra-fast debounce
        if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
        const fastDelay = detectionSpeedModeRef.current === 'deep' ? 180 : 120;
        analyzeTimeoutRef.current = setTimeout(() => {
          triggerAiRecognition(updatedStrokes, false);
        }, fastDelay);
      }
    } else {
      currentStrokeRef.current = [];
      setCurrentStroke([]);
      isDrawingRef.current = false;
      setIsDrawing(false);
    }
  };

  // Canvas mouse/touch event handlers for Interactive Air Canvas Mode
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isTrackingRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    addStrokePoint(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current || !isTrackingRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    addStrokePoint(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) endStroke();
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isTrackingRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    addStrokePoint(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current || !isTrackingRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    addStrokePoint(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  // Render strokes and MediaPipe glowing skeleton onto canvas
  useEffect(() => {
    let animId: number;

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.parentElement?.clientHeight || 450;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // If webcam is active, draw video frame flipped
      if (isWebcamActive && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -width, 0, width, height);
        ctx.restore();
        // Draw slight dark overlay for stroke contrast
        ctx.fillStyle = 'rgba(11, 15, 25, 0.35)';
        ctx.fillRect(0, 0, width, height);
      } else {
        // Holographic grid background
        ctx.fillStyle = '#080C14';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x <= width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y <= height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Function to render strokes with different pen styles
      const renderStrokeLine = (pts: Array<{ x: number; y: number }>, color: string, widthVal: number, style: PenStyle = 'neon') => {
        if (pts.length < 2) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          const xc = (pts[i].x + pts[i - 1].x) / 2;
          const yc = (pts[i].y + pts[i - 1].y) / 2;
          ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

        if (style === 'highlighter') {
          ctx.globalAlpha = 0.42;
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(16, widthVal * 2.2);
          ctx.lineCap = 'square';
          ctx.lineJoin = 'bevel';
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.stroke();
        } else if (style === 'solid') {
          ctx.strokeStyle = color;
          ctx.lineWidth = widthVal;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 0;
          ctx.stroke();
        } else if (style === 'dashed') {
          ctx.setLineDash([Math.max(6, widthVal * 1.8), Math.max(4, widthVal * 1.2)]);
          ctx.strokeStyle = color;
          ctx.lineWidth = widthVal;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.stroke();
        } else if (style === 'calligraphy') {
          ctx.strokeStyle = color;
          ctx.lineWidth = widthVal * 1.3;
          ctx.lineCap = 'butt';
          ctx.lineJoin = 'miter';
          ctx.shadowColor = color;
          ctx.shadowBlur = 6;
          ctx.stroke();
        } else {
          // Neon Glow (default)
          ctx.shadowColor = color;
          ctx.shadowBlur = 18;
          ctx.strokeStyle = color;
          ctx.lineWidth = widthVal;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Luminescent white inner core
          ctx.shadowBlur = 4;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = Math.max(1.5, widthVal * 0.3);
          ctx.stroke();
        }

        ctx.restore();
      };

      const currentSavedStrokes = strokesRef.current;
      const currentActiveStroke = currentStrokeRef.current;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(canvasZoom, canvasZoom);
      ctx.translate(-width / 2, -height / 2);

      currentSavedStrokes.forEach((stroke: any) => {
        const pts = Array.isArray(stroke) ? stroke : stroke.points;
        const color = stroke.color || strokeColorRef.current;
        const width = stroke.width || strokeWidthRef.current;
        const style = stroke.style || penStyleRef.current;
        renderStrokeLine(pts, color, width, style);
      });

      // Draw active drawing stroke with selected style, color & width
      if (currentActiveStroke.length > 0) {
        const activeStyle = isHighlighterModeRef.current ? 'highlighter' : penStyleRef.current;
        const activeColor = isHighlighterModeRef.current ? '#FACC15' : strokeColorRef.current;
        const activeWidth = isHighlighterModeRef.current ? Math.max(16, strokeWidthRef.current * 2) : strokeWidthRef.current;
        renderStrokeLine(currentActiveStroke, activeColor, activeWidth, activeStyle);
        
        const lastPt = currentActiveStroke[currentActiveStroke.length - 1];
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, isHighlighterModeRef.current ? 12 : 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 15;
        ctx.fill();
      }
      ctx.restore();

      // Draw glowing MediaPipe hand skeleton
      const lms = latestLandmarksRef.current;
      if (isWebcamActive && lms && settings.handLandmarks !== false) {
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [5, 9], [9, 10], [10, 11], [11, 12],
          [9, 13], [13, 14], [14, 15], [15, 16],
          [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
        ];
        ctx.save();
        ctx.strokeStyle = '#38BDF8';
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5;
        connections.forEach(([i, j]) => {
          const p1 = lms[i];
          const p2 = lms[j];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo((1 - p1.x) * width, p1.y * height);
            ctx.lineTo((1 - p2.x) * width, p2.y * height);
            ctx.stroke();
          }
        });

        // Draw joints
        lms.forEach((lm: any, idx: number) => {
          const x = (1 - lm.x) * width;
          const y = lm.y * height;
          ctx.beginPath();
          ctx.arc(x, y, idx === 8 || idx === 4 ? 6 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = idx === 8 ? '#10B981' : idx === 4 ? '#FBBF24' : '#FFFFFF';
          ctx.shadowColor = idx === 8 ? '#10B981' : '#38BDF8';
          ctx.shadowBlur = 14;
          ctx.fill();
        });

        // Special targeting reticle around Index Tip (#8)
        const indexTip = lms[8];
        if (indexTip) {
          const tipX = smoothedFingertipRef.current ? smoothedFingertipRef.current.x : (1 - indexTip.x) * width;
          const tipY = smoothedFingertipRef.current ? smoothedFingertipRef.current.y : indexTip.y * height;
          ctx.beginPath();
          ctx.arc(tipX, tipY, isDrawingRef.current ? 16 : 10, 0, Math.PI * 2);
          ctx.strokeStyle = isDrawingRef.current ? '#10B981' : '#38BDF8';
          ctx.lineWidth = 3;
          ctx.stroke();

          if (isDrawingRef.current) {
            ctx.beginPath();
            ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 20;
            ctx.fill();
          }
        }
        ctx.restore();
      }

      if (isWebcamActive) {
        animId = requestAnimationFrame(renderCanvas);
      }
    };

    renderCanvas();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [strokes, currentStroke, isWebcamActive, settings.strokeColor, settings.strokeWidth, settings.handLandmarks, canvasZoom]);

  // AI Recognition API call (Optimized for Sub-250ms High-Speed Neural Inference)
  const triggerAiRecognition = async (targetStrokes: any = strokes, showLoadingHUD: boolean = true) => {
    const currentMode = modeRef.current;
    if (currentMode === 'text') {
      if (currentStrokeRef.current.length > 2) endStroke();
      if (currentLetterStrokesRef.current.length > 0) {
        finalizeCurrentLetter();
      } else {
        setDetailedAnalysis('No unrecognized character is waiting for analysis.');
      }
      return;
    }

    if (targetStrokes.length === 0 && currentStroke.length === 0) return;
    const startTime = performance.now();
    if (showLoadingHUD) setIsAnalyzing(true);
    sound.playHover();

    try {
      // Capture clean isolated strokes rendering for high-fidelity neural vision recognition
      let imageBase64 = '';
      if (canvasRef.current && targetStrokes.length > 0) {
        const srcCanvas = canvasRef.current;
        const offscreen = document.createElement('canvas');
        const targetW = 400;
        const targetH = Math.round((srcCanvas.height / srcCanvas.width) * 400) || 300;
        offscreen.width = targetW;
        offscreen.height = targetH;
        const oCtx = offscreen.getContext('2d');
        if (oCtx) {
          // Clean high-contrast dark slate background
          oCtx.fillStyle = '#060A14';
          oCtx.fillRect(0, 0, targetW, targetH);

          // Render only the drawn strokes (isolated from webcam feed and hand skeleton lines)
          const scaleX = targetW / (srcCanvas.width || 1);
          const scaleY = targetH / (srcCanvas.height || 1);
          oCtx.save();
          oCtx.scale(scaleX, scaleY);

          targetStrokes.forEach((strokeObj: any) => {
            const pts = Array.isArray(strokeObj) ? strokeObj : strokeObj.points;
            if (!pts || pts.length < 2) return;
            oCtx.beginPath();
            oCtx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              const xc = (pts[i].x + pts[i - 1].x) / 2;
              const yc = (pts[i].y + pts[i - 1].y) / 2;
              oCtx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
            }
            oCtx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
            oCtx.strokeStyle = strokeObj.color || '#38BDF8';
            oCtx.lineWidth = Math.max(6, (strokeObj.width || 4) * 1.5);
            oCtx.lineCap = 'round';
            oCtx.lineJoin = 'round';
            oCtx.shadowColor = strokeObj.color || '#38BDF8';
            oCtx.shadowBlur = 6;
            oCtx.stroke();
          });
          oCtx.restore();

          imageBase64 = offscreen.toDataURL('image/png');
        }
      }

      if (settings.offlineMode) {
        throw new Error('Cloud analysis is disabled in Offline Mode. Turn Offline Mode off to analyze this drawing.');
      }

      // Format stroke data with start, end, and trajectory points
      const strokeData = targetStrokes.map((s: any) => {
        const pts = Array.isArray(s) ? s : s.points;
        const count = pts?.length || 0;
        const samplePts = count > 6 
          ? [pts[0], pts[Math.floor(count * 0.25)], pts[Math.floor(count * 0.5)], pts[Math.floor(count * 0.75)], pts[count - 1]]
          : pts;
        return { count, points: samplePts };
      });

      // Call server-side AI API with 4.5s network abort signal
      const abortCtrl = new AbortController();
      const abortTimeout = setTimeout(() => abortCtrl.abort(), 4500);

      let response: Response;
      try {
        response = await fetch('/api/ai/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            strokeData,
            mode: currentMode,
            previousText: recognizedText,
            language: settings.language,
          }),
          signal: abortCtrl.signal,
        });
      } finally {
        clearTimeout(abortTimeout);
      }

      const data = await response.json();
      if (!response.ok || !data?.success || !data?.data?.recognizedText) {
        throw new Error(data?.error || `Cloud analysis failed with status ${response.status}.`);
      }
      const res = data.data;
      setRecognizedText(res.recognizedText);
      setAutoCorrected(res.autoCorrected || res.recognizedText);
      setConfidence(typeof res.confidence === 'number' ? res.confidence : 0);
      setPredictions(Array.isArray(res.predictions) ? res.predictions : []);
      setDetailedAnalysis(res.detailedAnalysis || 'Cloud AI analyzed the completed stroke.');
      setStrokeQuality(res.strokeQuality || 'Cloud AI analysis');
      setAnalysisDurationMs(Math.round(performance.now() - startTime));
      sound.playSuccess();
    } catch (err: any) {
      console.warn("Cloud AI analysis failed:", err);
      setConfidence(0);
      setPredictions([]);
      setDetailedAnalysis(`Analysis unavailable: ${err instanceof Error ? err.message : 'Cloud AI request failed.'} Your drawing was not replaced with a generated result.`);
      setStrokeQuality('Analysis unavailable');
      setAnalysisDurationMs(Math.round(performance.now() - startTime));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Actions
  const handleClear = () => {
    sound.playClear();
    characterSessionRef.current++;
    characterCommitQueueRef.current = Promise.resolve();
    setIsAnalyzing(false);
    if (letterCommitTimeoutRef.current) {
      clearTimeout(letterCommitTimeoutRef.current);
      letterCommitTimeoutRef.current = null;
    }

    if (strokes.length > 0) {
      // Clear canvas strokes while preserving accumulated word for subsequent letters!
      if (currentLetterRef.current) {
        accumulatedWordRef.current += currentLetterRef.current;
      }
      setStrokes([]);
      strokesRef.current = [];
      setCurrentStroke([]);
      currentStrokeRef.current = [];
      currentLetterRef.current = '';
      currentLetterStrokesRef.current = [];
      committedCharacterGroupsRef.current = [];
      previousCharacterBoundsRef.current = null;
      lastStrokeEndTimeRef.current = 0;

      const currentWord = (accumulatedWordRef.current || recognizedText || '').trim();
      if (currentWord && !currentWord.startsWith('SCRIPTORA AI Ready') && !currentWord.startsWith('Canvas cleared')) {
        setRecognizedText(currentWord);
        setDetailedAnalysis(`Canvas cleared. Ready for next letter in word "${currentWord}".`);
      } else {
        setRecognizedText("Canvas cleared. Awaiting air writing...");
        setDetailedAnalysis("Draw a new word, equation, or diagram.");
      }
    } else {
      // Canvas was already clear, so user explicitly clicked Clear to clear the accumulated text
      accumulatedWordRef.current = '';
      previousCharacterBoundsRef.current = null;
      currentLetterRef.current = '';
      currentLetterStrokesRef.current = [];
      committedCharacterGroupsRef.current = [];
      lastStrokeEndTimeRef.current = 0;
      setStrokes([]);
      strokesRef.current = [];
      setCurrentStroke([]);
      currentStrokeRef.current = [];
      setRecognizedText("Canvas cleared. Awaiting air writing...");
      setAutoCorrected("");
      setPredictions([]);
      setConfidence(0);
      setDetailedAnalysis("Draw a new word, equation, or diagram.");
    }
  };

  const handleDeleteRecognizedOutput = () => {
    sound.playClear();
    characterSessionRef.current++;
    characterCommitQueueRef.current = Promise.resolve();
    setIsAnalyzing(false);
    if (letterCommitTimeoutRef.current) {
      clearTimeout(letterCommitTimeoutRef.current);
      letterCommitTimeoutRef.current = null;
    }

    accumulatedWordRef.current = '';
    previousCharacterBoundsRef.current = null;
    currentLetterRef.current = '';
    currentLetterStrokesRef.current = [];
    committedCharacterGroupsRef.current = [];
    lastStrokeEndTimeRef.current = 0;
    setRecognizedText('');
    setAutoCorrected('');
    setPredictions([]);
    setConfidence(0);
    setDetailedAnalysis('Recognized output deleted. The drawing remains on the canvas.');
    setStrokeQuality('Ready');
  };

  const handleDeleteLastLetter = () => {
    sound.playClear();
    characterSessionRef.current++;
    characterCommitQueueRef.current = Promise.resolve();
    setIsAnalyzing(false);
    if (letterCommitTimeoutRef.current) {
      clearTimeout(letterCommitTimeoutRef.current);
      letterCommitTimeoutRef.current = null;
    }

    if (currentLetterStrokesRef.current.length > 0) {
      const currentStrokes = currentLetterStrokesRef.current;
      const currentSet = new Set(currentStrokes);
      const remainingStrokes = strokesRef.current.filter(stroke => !currentSet.has(stroke));
      strokesRef.current = remainingStrokes;
      setStrokes(remainingStrokes);
      currentLetterStrokesRef.current = [];
      currentLetterRef.current = '';
      lastStrokeEndTimeRef.current = 0;
      setDetailedAnalysis('The in-progress letter and its canvas strokes were deleted.');
      setStrokeQuality('Ready');
      return;
    }

    if (mode === 'text' && committedCharacterGroupsRef.current.length > 0) {
      const lastGroup = committedCharacterGroupsRef.current.pop()!;
      const removedStrokes = new Set(lastGroup.strokes);
      const remainingStrokes = strokesRef.current.filter(stroke => !removedStrokes.has(stroke));
      strokesRef.current = remainingStrokes;
      setStrokes(remainingStrokes);

      const output = accumulatedWordRef.current.replace(/\s+$/, '');
      accumulatedWordRef.current = output.slice(0, -1);
      const previousGroup = committedCharacterGroupsRef.current.at(-1);
      previousCharacterBoundsRef.current = previousGroup
        ? { minX: previousGroup.minX, maxX: previousGroup.maxX, width: previousGroup.width }
        : null;
      setRecognizedText(accumulatedWordRef.current);
      setAutoCorrected(accumulatedWordRef.current);
      setPredictions(getPredictionsForWord(accumulatedWordRef.current));
      setDetailedAnalysis(`Deleted the last recognized letter '${lastGroup.character}' and its canvas strokes.`);
      setStrokeQuality('Ready');
      setConfidence(0);
      return;
    }

    if (mode === 'text' && accumulatedWordRef.current.trim()) {
      accumulatedWordRef.current = accumulatedWordRef.current.replace(/\s+$/, '').slice(0, -1);
      setRecognizedText(accumulatedWordRef.current);
      setAutoCorrected(accumulatedWordRef.current);
      setPredictions(getPredictionsForWord(accumulatedWordRef.current));
      setDetailedAnalysis('Deleted the last recognized letter. The canvas was already cleared.');
      setStrokeQuality('Ready');
      setConfidence(0);
      return;
    }

    if (strokesRef.current.length > 0) {
      const remainingStrokes = strokesRef.current.slice(0, -1);
      strokesRef.current = remainingStrokes;
      setStrokes(remainingStrokes);
      setDetailedAnalysis('Deleted the last canvas stroke.');
    }
  };

  const handleUndo = () => {
    sound.playClick();
    characterSessionRef.current++;
    characterCommitQueueRef.current = Promise.resolve();
    setIsAnalyzing(false);
    if (strokes.length > 0) {
      const isUndoingCommittedCharacter =
        mode === 'text' &&
        currentLetterStrokesRef.current.length === 0 &&
        committedCharacterGroupsRef.current.length > 0;
      const committedGroup = isUndoingCommittedCharacter ? committedCharacterGroupsRef.current.pop() : undefined;
      const removedStrokes = committedGroup ? new Set(committedGroup.strokes) : null;
      const next = removedStrokes
        ? strokes.filter(stroke => !removedStrokes.has(stroke))
        : strokes.slice(0, -1);
      setStrokes(next);
      strokesRef.current = next;

      if (currentLetterStrokesRef.current.length > 0) {
        if (letterCommitTimeoutRef.current) clearTimeout(letterCommitTimeoutRef.current);
        currentLetterStrokesRef.current = currentLetterStrokesRef.current.slice(0, -1);
        if (currentLetterStrokesRef.current.length > 0) {
          letterCommitTimeoutRef.current = setTimeout(finalizeCurrentLetter, CHARACTER_COMMIT_DELAY_MS);
          setDetailedAnalysis('Last stroke removed. Pause briefly to recognize the remaining character strokes.');
        } else {
          currentLetterRef.current = '';
          lastStrokeEndTimeRef.current = 0;
          setRecognizedText(accumulatedWordRef.current || "Canvas cleared. Awaiting air writing...");
          setAutoCorrected(accumulatedWordRef.current);
          setPredictions([]);
        }
      } else if (accumulatedWordRef.current.length > 0) {
        accumulatedWordRef.current = accumulatedWordRef.current.replace(/\s+$/, '').slice(0, -1);
        const previousGroup = committedCharacterGroupsRef.current.at(-1);
        previousCharacterBoundsRef.current = previousGroup
          ? { minX: previousGroup.minX, maxX: previousGroup.maxX, width: previousGroup.width }
          : null;
        setRecognizedText(accumulatedWordRef.current || "Canvas cleared. Awaiting air writing...");
        setAutoCorrected(accumulatedWordRef.current);
        setPredictions(accumulatedWordRef.current ? getPredictionsForWord(accumulatedWordRef.current) : []);
      }

    }
  };

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(recognizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    sound.playClick();

    // If currently speaking, stop immediately
    if (isSpeaking) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = (recognizedText || autoCorrected || "").trim();
    if (!textToSpeak) return;

    setIsSpeaking(true);

    const speakWithBrowserTTS = (text: string) => {
      if (!('speechSynthesis' in window)) {
        setIsSpeaking(false);
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = (settings.voiceSpeed || 1.0) * 1.15;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const match = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Alex'))) || voices.find(v => v.lang.startsWith('en'));
          if (match) utterance.voice = match;
        }

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Browser SpeechSynthesis error:", err);
        setIsSpeaking(false);
      }
    };

    // If instant voice engine selected or offline mode, speak immediately (<15ms latency)
    if (voiceEngine === 'instant' || settings.offlineMode) {
      speakWithBrowserTTS(textToSpeak);
      return;
    }

    // Neural Engine with fast 350ms timeout fallback so user experiences instant speech
    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => {
      abortCtrl.abort();
      speakWithBrowserTTS(textToSpeak);
    }, 350);

    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voiceName: settings.voiceName }),
        signal: abortCtrl.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.success && data.audioBase64) {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          currentAudioRef.current = null;
        };
        audio.onerror = () => {
          currentAudioRef.current = null;
          speakWithBrowserTTS(textToSpeak);
        };

        await audio.play().catch(() => speakWithBrowserTTS(textToSpeak));
      } else {
        speakWithBrowserTTS(textToSpeak);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name !== 'AbortError') {
        speakWithBrowserTTS(textToSpeak);
      }
    }
  };

  const handleSave = () => {
    if (mode === 'text' && currentLetterStrokesRef.current.length > 0) finalizeCurrentLetter();
    if (mode === 'text' && !accumulatedWordRef.current.trim()) {
      setErrorMessage('No confidently recognized characters to save yet.');
      return;
    }

    sound.playSuccess();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });

    const textToSave = (accumulatedWordRef.current || recognizedText || '').trim();

    const newNote: RecognitionResult = {
      id: `note-${Date.now()}`,
      timestamp: Date.now(),
      mode,
      recognizedText: textToSave,
      confidence,
      autoCorrected: textToSave,
      predictions,
      detailedAnalysis,
      strokeQuality,
      strokesCount: strokes.length,
      durationMs: 3500,
      language: settings.language,
      thumbnailBase64: canvasRef.current?.toDataURL('image/png'),
    };
    onSaveNote(newNote);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  useEffect(() => {
    eyeBlinkActionRef.current = settings.eyeBlinkAction ?? 'none';
    eyeBlinkCallbackRef.current = eyeBlinkActionRef.current === 'save'
      ? handleSave
      : eyeBlinkActionRef.current === 'clear'
        ? handleClear
        : () => {};
  }, [settings.eyeBlinkAction, handleSave, handleClear]);

  const handleSelectPrediction = (predWord: string) => {
    sound.playSuccess();
    if (currentLetterRef.current) {
      accumulatedWordRef.current += currentLetterRef.current;
      currentLetterRef.current = '';
      currentLetterStrokesRef.current = [];
    }
    const base = accumulatedWordRef.current || (recognizedText.includes('Ready') || recognizedText.includes('cleared') ? '' : recognizedText);
    const updated = `${base.trim()} ${predWord} `.trimStart();
    accumulatedWordRef.current = updated;
    setRecognizedText(updated.trim());
    setAutoCorrected(updated.trim());
    setPredictions(getPredictionsForWord(predWord));
  };

  // Keyboard event handler for Space (new word), Backspace (delete letter), C (clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === ' ' || e.code === 'Space') {
        // Space key: Explicitly start a new word
        e.preventDefault();
        sound.playClick();
        if (currentLetterRef.current) {
          accumulatedWordRef.current += currentLetterRef.current;
          currentLetterRef.current = '';
          currentLetterStrokesRef.current = [];
        }
        if (accumulatedWordRef.current && !accumulatedWordRef.current.endsWith(' ')) {
          accumulatedWordRef.current += ' ';
          setRecognizedText(accumulatedWordRef.current);
          setDetailedAnalysis(`Started new word. Full text: "${accumulatedWordRef.current}"`);
        }
      } else if (e.key === 'Backspace') {
        // Backspace: delete last letter
        if (accumulatedWordRef.current.length > 0 || currentLetterRef.current.length > 0) {
          sound.playClick();
          if (currentLetterRef.current) {
            currentLetterRef.current = '';
            currentLetterStrokesRef.current = [];
          } else if (accumulatedWordRef.current.length > 0) {
            accumulatedWordRef.current = accumulatedWordRef.current.slice(0, -1);
          }
          const nextText = accumulatedWordRef.current || 'SCRIPTORA AI Ready. Draw in the air!';
          setRecognizedText(nextText);
          setAutoCorrected(accumulatedWordRef.current);
          setPredictions(getPredictionsForWord(accumulatedWordRef.current));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      
      {/* Top Header & Mode Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Live Air Writing Workspace
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
              {mode.toUpperCase()} MODE
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Draw letters one by one in front of the camera or on the canvas. Each completed letter is recognized and added to your word; leave a wider gap between words.
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-950/80 border border-cyan-500/30 overflow-x-auto">
          {[
            { id: 'text', label: 'Words & Text', icon: Wand2 },
            { id: 'math', label: 'Math Equation', icon: Calculator },
            { id: 'diagram', label: 'Flowchart Diagram', icon: Layers },
            { id: 'signature', label: 'Signature Verify', icon: Fingerprint },
            { id: 'gesture', label: 'Air Gestures', icon: Hand },
          ].map((m) => {
            const Icon = m.icon;
            const isSel = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { sound.playClick(); setMode(m.id as RecognitionMode); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                  isSel
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NEW: AI Font Engine Promotional Banner */}
      {onNavigate && (
        <div 
          onClick={() => { sound.playSuccess(); onNavigate('calligraphy'); }}
          className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-900/60 to-blue-950/80 border border-purple-500/40 hover:border-purple-400 cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 shrink-0">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                  ✨ Try the NEW AI Font Engine & Smart Calligrapher!
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-500/50">
                  15 LIVE FONTS
                </span>
              </div>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Real-time stroke stabilization, Bezier smoothing, and instant typography transformation.
              </p>
            </div>
          </div>
          <span className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 transition-all shadow-md group-hover:scale-105">
            Launch Calligraphy Studio →
          </span>
        </div>
      )}

      {/* Error / Fallback Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="px-3 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-100 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left Canvas / Camera, Right Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Canvas & Video (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Canvas Container */}
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-gray-950 border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(37,99,235,0.2)] group">
            
            {/* Hidden Video element for webcam capture */}
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
            />

            {/* Main Holographic Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="w-full h-full cursor-crosshair touch-none"
            />

            {/* Top Bar inside canvas */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-xs font-mono text-cyan-300">
                <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                <span>{isWebcamActive ? 'WEBCAM LANDMARK TRACKING' : 'HOLOGRAPHIC AIR CANVAS'}</span>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => {
                    sound.playClick();
                    if (isWebcamActive && isDrawingRef.current) endStroke();
                    setIsWebcamActive(active => !active);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md ${
                    isWebcamActive
                      ? 'bg-red-600/90 hover:bg-red-500 text-white shadow-red-500/30'
                      : 'bg-blue-600/90 hover:bg-blue-500 text-white shadow-blue-500/30'
                  }`}
                  title="Toggle Real Webcam or Interactive Canvas"
                >
                  {isWebcamActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>{isWebcamActive ? 'Turn Off Webcam' : 'Turn On Webcam'}</span>
                </button>
              </div>
            </div>

            {/* Non-blocking cloud analysis status */}
            {isAnalyzing && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/90 backdrop-blur-md border border-cyan-400 shadow-xl shadow-cyan-500/40 z-20 pointer-events-none animate-fadeIn">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="text-xs font-mono font-extrabold text-cyan-300 tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                  <span>{mode === 'text' ? 'CLOUD VISION CHECKING CHARACTER' : 'CLOUD AI ANALYZING STROKES'}</span>
                  <span className="text-emerald-400 font-bold">({analysisDurationMs ? `${analysisDurationMs}ms` : 'FAST'})</span>
                </span>
              </div>
            )}

            {/* Real-time Webcam Hand Tracking HUD */}
            {isWebcamActive && (
              <div className="absolute bottom-11 left-4 right-4 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-cyan-500/50 z-10 pointer-events-auto shadow-lg shadow-cyan-500/10">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${handDetected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-xs font-mono font-bold text-white">
                    {handDetected ? '✋ HAND DETECTED (60 FPS)' : '⏳ DETECTING HAND... (Show hand to camera)'}
                  </span>
                </div>

                <label className="flex items-center gap-2 text-[10px] font-mono text-gray-300">
                  DRAW GESTURE
                  <select
                    value={fingerDrawMode}
                    onChange={(event) => {
                      sound.playClick();
                      onUpdateSettings({ drawGesture: event.target.value as DrawGesture });
                    }}
                    className="rounded-lg border border-blue-400/50 bg-blue-950 px-2 py-1 text-xs font-bold text-white"
                    aria-label="Choose hand gesture for drawing"
                  >
                    <option value="pinch">Pinch</option>
                    <option value="index">Index only</option>
                    <option value="peace">Peace sign</option>
                  </select>
                </label>

                {/* Live Gesture Status Badge */}
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold ${
                    isDrawing
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 animate-pulse'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {isDrawing ? '⚡ WRITING IN AIR...' : `PEN UP (${fingerDistance}%)`}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Helper text inside canvas */}
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-[11px] font-mono text-cyan-400/70 pointer-events-none">
              <span>Strokes: {strokes.length}</span>
              <span>{isWebcamActive
                ? fingerDrawMode === 'pinch'
                  ? 'Pinch thumb & index finger to write; release to recognize'
                  : fingerDrawMode === 'index'
                    ? 'Raise only your index finger; fold the others to write'
                    : 'Raise index and middle fingers in a peace sign to write'
                : 'Click & drag or touch to draw; release to recognize'}</span>
            </div>
          </div>

          {/* Action Toolbar Below Canvas */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-gray-900/60 backdrop-blur-xl border border-cyan-500/20">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  if (isTrackingRef.current && isDrawingRef.current) endStroke();
                  setIsTracking(tracking => !tracking);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isTracking
                    ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                }`}
              >
                {isTracking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTracking ? 'Pause Tracking' : 'Resume Tracking'}</span>
              </button>

              <button
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 text-xs font-semibold transition-colors"
                title="Undo last stroke"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                onClick={handleDeleteLastLetter}
                disabled={
                  mode === 'text'
                    ? strokes.length === 0 &&
                      currentLetterStrokesRef.current.length === 0 &&
                      !accumulatedWordRef.current.trim()
                    : strokes.length === 0
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-rose-200 text-xs font-semibold transition-colors"
                title={mode === 'text' ? 'Delete the last letter from both output and canvas' : 'Delete the last canvas stroke'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{mode === 'text' ? 'Delete Letter' : 'Delete Stroke'}</span>
              </button>

              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-semibold transition-colors"
                title="Clear canvas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-black/70 border border-cyan-500/30 p-1" aria-label="Canvas zoom controls">
              <button
                type="button"
                onClick={() => setCanvasZoom(zoom => Math.max(1, Math.round((zoom - 0.25) * 100) / 100))}
                disabled={canvasZoom <= 1}
                aria-label="Zoom out canvas"
                title="Zoom out canvas"
                className="p-1.5 rounded-lg text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCanvasZoom(1)}
                className="min-w-12 px-1 py-1 text-[10px] font-mono font-bold text-cyan-200 hover:bg-cyan-500/20 rounded-lg"
                title="Reset canvas zoom"
              >
                {Math.round(canvasZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setCanvasZoom(zoom => Math.min(3, Math.round((zoom + 0.25) * 100) / 100))}
                disabled={canvasZoom >= 3}
                aria-label="Zoom in canvas"
                title="Zoom in canvas"
                className="p-1.5 rounded-lg text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Neural Detection Speed Engine Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/70 border border-cyan-500/30">
              <span className="text-[10px] font-mono text-cyan-400 font-bold px-1.5 hidden sm:inline">SPEED:</span>
              <button
                onClick={() => { sound.playClick(); setDetectionSpeedMode('turbo'); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  detectionSpeedMode === 'turbo'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400 shadow-sm shadow-emerald-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="On-device character templates; text is finalized after a short pause"
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>{mode === 'text' ? 'Local (pause to finish)' : '⚡ Turbo Instant (10ms)'}</span>
              </button>

              <button
                onClick={() => { sound.playClick(); setDetectionSpeedMode('hybrid'); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  detectionSpeedMode === 'hybrid'
                    ? 'bg-blue-500/30 text-cyan-300 border border-cyan-400 shadow-sm shadow-cyan-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Gemini refinement for non-text modes; text recognition remains local"
              >
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span>{mode === 'text' ? 'Local templates' : '🚀 Hybrid (~200ms)'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerAiRecognition()}
                disabled={isAnalyzing || (strokes.length === 0 && currentStroke.length === 0)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>Analyze Now</span>
              </button>
            </div>
          </div>

          {/* AI Word Prediction Pills */}
          <div className="p-4 rounded-2xl bg-gray-900/40 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <Wand2 className="w-3.5 h-3.5" />
                <span>OPTIONAL WORD SUGGESTIONS (SEPARATE FROM OUTPUT):</span>
              </div>
              {analysisDurationMs && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 shadow-sm shadow-emerald-500/15">
                  <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span className="font-extrabold">{analysisDurationMs}ms</span>
                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    ({mode === 'text' || detectionSpeedMode === 'turbo' ? 'Local templates' : 'Cloud AI'})
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {predictions.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPrediction(word)}
                  onMouseEnter={() => sound.playHover()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 hover:border-cyan-400 text-blue-200 hover:text-white text-xs font-bold transition-all transform hover:scale-105 flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-cyan-400 font-mono">+{idx + 1}</span>
                  <span>{word}</span>
                </button>
              ))}
            </div>
          </div>

          {/* HOLOGRAPHIC PEN & AIR BRUSH STUDIO (Pen Style, Colors, Highlighters, Size Pixels) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-900/90 via-[#0B0F19] to-blue-950/60 border-2 border-cyan-500/30 shadow-xl space-y-4">
            
            {/* Header row with Title & Highlighter Mode Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono tracking-wider text-white uppercase flex items-center gap-2">
                    <span>Pen Style & Air Brush Studio</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                      REAL-TIME
                    </span>
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono block">
                    Choose pen style, luminous colors, highlighters, and pixel thickness
                  </span>
                </div>
              </div>

              {/* Quick Highlighter Mode Switch */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsHighlighterMode(!isHighlighterMode);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all transform hover:scale-105 active:scale-95 ${
                  isHighlighterMode
                    ? 'bg-yellow-400/25 text-yellow-300 border-2 border-yellow-400 shadow-lg shadow-yellow-400/30 animate-pulse'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                }`}
                title="Toggle translucent neon highlighter marker mode"
              >
                <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
                <span>{isHighlighterMode ? 'Highlighter ON' : 'Highlighter Mode'}</span>
              </button>
            </div>

            {/* 1. Pen Styles Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span className="flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-cyan-400" /> PEN STYLES
                </span>
                <span className="text-cyan-300 capitalize font-bold">
                  {isHighlighterMode ? 'Fluorescent Highlighter' : penStyle}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'neon', label: 'Neon Glow', desc: 'Laser radiance' },
                  { id: 'solid', label: 'Solid Ink', desc: 'Sharp vector' },
                  { id: 'calligraphy', label: 'Calligraphy', desc: 'Chisel ribbon' },
                  { id: 'dashed', label: 'Dashed Laser', desc: 'Tactical dashes' },
                  { id: 'highlighter', label: 'Highlighter', desc: 'Translucent' },
                ].map((s) => {
                  const isActive = isHighlighterMode ? s.id === 'highlighter' : penStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        sound.playClick();
                        if (s.id === 'highlighter') {
                          setIsHighlighterMode(true);
                        } else {
                          setIsHighlighterMode(false);
                          setPenStyle(s.id as PenStyle);
                        }
                      }}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left flex flex-col justify-between ${
                        isActive
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400'
                          : 'bg-black/50 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <span className="font-mono text-[11px] truncate">{s.label}</span>
                      <span className="text-[9px] text-gray-500 truncate">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Color Palette & Native Color Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span className="flex items-center gap-1">
                  <Palette className="w-3 h-3 text-cyan-400" /> VIBRANT COLOR PALETTE
                </span>
                <span className="text-white font-mono uppercase text-[11px]">
                  {isHighlighterMode ? '#FACC15 (Neon Yellow)' : strokeColor}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { color: '#00F0FF', name: 'Electric Cyan' },
                  { color: '#10B981', name: 'Neon Emerald' },
                  { color: '#FACC15', name: 'Highlighter Yellow' },
                  { color: '#EC4899', name: 'Laser Rose' },
                  { color: '#8B5CF6', name: 'Cyber Violet' },
                  { color: '#F97316', name: 'Solar Orange' },
                  { color: '#EF4444', name: 'Laser Crimson' },
                  { color: '#FFFFFF', name: 'Pure White' },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => {
                      sound.playClick();
                      if (isHighlighterMode) setIsHighlighterMode(false);
                      setStrokeColor(c.color);
                    }}
                    style={{ backgroundColor: c.color }}
                    className={`w-7 h-7 rounded-xl transition-all shadow-md transform hover:scale-110 active:scale-95 ${
                      strokeColor === c.color && !isHighlighterMode
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}

                {/* Custom Color Input */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-gray-800">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => {
                      if (isHighlighterMode) setIsHighlighterMode(false);
                      setStrokeColor(e.target.value);
                    }}
                    className="w-7 h-7 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    title="Choose Custom Color"
                  />
                  <span className="text-[10px] font-mono text-gray-400">Custom</span>
                </div>
              </div>
            </div>

            {/* 3. Stroke Size Pixels + Live Preview Chip */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-cyan-400" /> STROKE SIZE PIXELS
                </span>
                <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[11px]">
                  {isHighlighterMode ? `${Math.max(16, strokeWidth * 2)} px (Wide)` : `${strokeWidth} px`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Size Presets */}
                <div className="flex items-center gap-1">
                  {[2, 4, 8, 14, 24].map((px) => (
                    <button
                      key={px}
                      onClick={() => {
                        sound.playClick();
                        setStrokeWidth(px);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        strokeWidth === px
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      {px}px
                    </button>
                  ))}
                </div>

                {/* Precision Slider */}
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="2"
                    max="36"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                  />
                </div>

                {/* Live Real-time Stroke Preview Chip */}
                <div
                  className="w-20 h-8 rounded-xl bg-black/80 border border-cyan-500/30 flex items-center justify-center shrink-0 px-2 overflow-hidden"
                  title="Live Stroke Appearance Preview"
                >
                  <div
                    style={{
                      height: `${Math.min(22, isHighlighterMode ? Math.max(12, strokeWidth * 1.5) : strokeWidth)}px`,
                      width: '85%',
                      backgroundColor: isHighlighterMode ? '#FACC15' : strokeColor,
                      opacity: isHighlighterMode ? 0.45 : 1,
                      boxShadow: (!isHighlighterMode && penStyle === 'neon') ? `0 0 10px ${strokeColor}` : 'none',
                      borderRadius: isHighlighterMode || penStyle === 'calligraphy' ? '2px' : '9999px',
                      borderStyle: penStyle === 'dashed' ? 'dashed' : 'solid',
                    }}
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: AI Analysis & Output Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Main Recognized Text Box */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-900/90 via-[#0B0F19] to-blue-950/80 border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold tracking-wide text-white">RECOGNIZED OUTPUT</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteRecognizedOutput}
                  disabled={!recognizedText || recognizedText.startsWith('SCRIPTORA AI Ready') || recognizedText.startsWith('Canvas cleared')}
                  aria-label="Delete recognized output"
                  title="Delete recognized output (keeps the drawing on the canvas)"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>

                {/* Confidence & Speed Badge */}
                {analysisDurationMs && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                    <Zap className="w-3 h-3" />
                    <span>{analysisDurationMs}ms</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                  <span>CONF:</span>
                  <span className="text-emerald-400 font-extrabold">{confidence}%</span>
                </div>
              </div>
            </div>

            {/* Recognized Text Display */}
            <div className="min-h-[100px] max-h-[180px] overflow-y-auto p-4 rounded-2xl bg-black/60 border border-gray-800 text-lg sm:text-xl font-bold font-mono text-cyan-200 leading-relaxed mb-4 select-all">
              {recognizedText || <span className="text-gray-500">Recognized output will appear here.</span>}
            </div>

            {/* Auto-Corrected / Enhanced Output */}
            {autoCorrected && autoCorrected !== recognizedText && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 mb-4 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-cyan-400 block mb-0.5">AI Smart Auto-Corrected:</span>
                  <span className="font-mono">{autoCorrected}</span>
                </div>
              </div>
            )}

            {/* Voice Engine Mode Selector & Action Buttons */}
            <div className="flex items-center justify-between gap-2 mb-3 text-[11px] font-mono text-gray-400 px-1">
              <span>Speech Engine:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { sound.playClick(); setVoiceEngine('instant'); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    voiceEngine === 'instant' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Instant zero-latency speech synthesis"
                >
                  ⚡ Instant Voice
                </button>
                <button
                  onClick={() => { sound.playClick(); setVoiceEngine('neural'); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    voiceEngine === 'neural' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Deep neural AI voice synthesis"
                >
                  🎙️ Neural Voice
                </button>
              </div>
            </div>

            {/* Action Buttons for Output */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={handleSpeak}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSpeaking
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 animate-pulse shadow-md shadow-cyan-500/20 hover:bg-cyan-500/40'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                }`}
                title={isSpeaking ? "Click to stop speaking" : "Speak text aloud"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-cyan-300 animate-spin-slow" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
                <span>{isSpeaking ? 'Stop' : 'Speak'}</span>
              </button>

              <button
                onClick={handleSave}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  saved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-500/30'
                }`}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{saved ? 'Saved!' : 'Save Note'}</span>
              </button>
            </div>
          </div>

          {/* Detailed Analysis / Step-by-Step Breakdown */}
          <div className="p-6 rounded-3xl bg-gray-900/50 backdrop-blur-xl border border-cyan-500/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>RECOGNITION ANALYSIS</span>
              <span className="ml-auto text-[10px] font-mono text-cyan-300/70">
                {mode === 'text'
                  ? isAnalyzing ? 'LOCAL + CLOUD VISION' : 'LOCAL TEMPLATES'
                  : detectionSpeedMode === 'turbo' ? 'LOCAL KINEMATICS' : 'CLOUD AI'}
              </span>
            </h3>

            <div className="p-4 rounded-2xl bg-gray-950/80 border border-gray-800 text-xs sm:text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap max-h-[160px] overflow-y-auto">
              {detailedAnalysis}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-mono text-gray-400 pt-3 border-t border-gray-800">
              <span>Stroke Kinematic Quality:</span>
              <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                {strokeQuality}
              </span>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-500/20 text-xs text-blue-200 space-y-2">
            <p className="font-bold text-cyan-300">💡 Pro Tip for Air Drawing:</p>
            <p className="leading-relaxed">
              In <b>Math Equation Mode</b>, try drawing <code className="bg-blue-900/50 px-1 py-0.5 rounded text-white">E = mc^2</code> or <code className="bg-blue-900/50 px-1 py-0.5 rounded text-white">\int x^2 dx</code>. Notice how SCRIPTORA solves the equation and formats LaTeX in real time!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
