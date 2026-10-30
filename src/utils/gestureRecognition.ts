import type { DrawGesture } from '../types';

interface HandLandmark {
  x: number;
  y: number;
}

export function matchesFingerPose(
  landmarks: HandLandmark[],
  gesture: Exclude<DrawGesture, 'pinch'>,
): boolean {
  const fingerIsExtended = (tip: number, pip: number) =>
    Boolean(landmarks[tip] && landmarks[pip] && landmarks[tip].y < landmarks[pip].y - 0.02);
  const fingerIsFolded = (tip: number, pip: number) =>
    Boolean(landmarks[tip] && landmarks[pip] && landmarks[tip].y > landmarks[pip].y - 0.015);

  if (gesture === 'index') {
    return fingerIsExtended(8, 6)
      && fingerIsFolded(12, 10)
      && fingerIsFolded(16, 14)
      && fingerIsFolded(20, 18);
  }

  return fingerIsExtended(8, 6)
    && fingerIsExtended(12, 10)
    && fingerIsFolded(16, 14)
    && fingerIsFolded(20, 18);
}
