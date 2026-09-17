import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

/** Lazily loads the MediaPipe Pose Landmarker (WASM runs fully client-side). */
export function loadPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
      );
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    })().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

export type Keypoint = { x: number; y: number; score: number };
export type Frame = { t: number; hip: Keypoint; shoulder: Keypoint; knee: Keypoint; ankle: Keypoint };

export type PoseResult = {
  rawScore: number;
  details: { label: string; value: string }[];
  confidence: number;
};

const V = (a: Keypoint, b: Keypoint) => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (u: { x: number; y: number }, v: { x: number; y: number }) => u.x * v.x + u.y * v.y;
const norm = (v: { x: number; y: number }) => Math.hypot(v.x, v.y);

function angle(a: Keypoint, b: Keypoint, c: Keypoint) {
  const u = V(a, b);
  const w = V(c, b);
  const d = dot(u, w) / (norm(u) * norm(w) || 1e-9);
  return Math.acos(Math.max(-1, Math.min(1, d))) * (180 / Math.PI);
}

/**
 * Score a captured pose timeline for the given test type.
 * - vertical_jump: downward hip travel then explosive rise (pixel→cm heuristic)
 * - situps_30s: cyclic shoulder-hip-knee angle peaks
 * - sprint / shuttle: duration of tracked movement phase
 */
export function scoreTimeline(
  testType: "vertical_jump" | "sprint_40m" | "situps_30s" | "shuttle_run",
  frames: Frame[],
  heightCm: number | undefined,
): PoseResult {
  const details: { label: string; value: string }[] = [];
  if (frames.length < 5) {
    return { rawScore: 0, details, confidence: 0 };
  }

  const hips = frames.map((f) => f.hip);
  const minHip = Math.min(...hips.map((h) => h.y));
  const maxHip = Math.max(...hips.map((h) => h.y));
  const bodyPx =
    frames.reduce((acc, f) => {
      const d = norm({ x: f.hip.x - f.shoulder.x, y: f.hip.y - f.shoulder.y }) + norm({ x: f.knee.x - f.hip.x, y: f.knee.y - f.hip.y }) + norm({ x: f.ankle.x - f.knee.x, y: f.ankle.y - f.knee.y });
      return acc + (Number.isFinite(d) && d > 0 ? d : 0);
    }, 0) / frames.length;
  const cmPerPx = heightCm && heightCm > 80 ? heightCm / (bodyPx * 3.6) : 2.2 / (bodyPx * 0.01);
  details.push({ label: "Frames analyzed", value: `${frames.length}` });
  details.push({ label: "Body length", value: `${Math.round(bodyPx)} px` });

  if (testType === "vertical_jump") {
    // Estimate standing hip baseline (median of first 25% of frames)
    const sorted = [...hips].sort((a, b) => a.y - b.y);
    const baseline = sorted[Math.floor(sorted.length * 0.8)].y;
    const risePx = baseline - minHip;
    const cm = Math.max(4, Math.min(90, risePx * cmPerPx));
    details.push({ label: "Hip rise", value: `${Math.round(risePx)} px` });
    return { rawScore: Math.round(cm * 10) / 10, details, confidence: Math.min(1, frames.length / 60) };
  }

  if (testType === "situps_30s") {
    const angles = frames.map((f) => angle(f.shoulder, f.hip, f.knee));
    // Count cyclic peaks above a dynamic threshold
    const aMin = Math.min(...angles);
    const aMax = Math.max(...angles);
    const threshold = aMin + (aMax - aMin) * 0.62;
    let reps = 0;
    let above = false;
    let prevT = frames[0].t;
    let avgHz = 0;
    let nHz = 0;
    for (let i = 1; i < frames.length; i++) {
      const dt = frames[i].t - frames[i - 1].t;
      if (dt > 0.01) {
        avgHz += 1 / dt;
        nHz++;
      }
    }
    prevT = 0;
    void prevT;
    for (let i = 0; i < angles.length; i++) {
      const t = frames[i].t;
      if (angles[i] >= threshold && !above) {
        if (reps > 0) {
          const gap = t - frames[0].t;
          if (gap > 0 && gap < 0.18 * Math.max(1, reps)) {
            /* too fast — likely jitter */
            continue;
          }
        }
        reps++;
        above = true;
      } else if (angles[i] < threshold * 0.92) {
        above = false;
      }
    }
    void avgHz;
    void nHz;
    details.push({ label: "Angle range", value: `${Math.round(aMin)}°–${Math.round(aMax)}°` });
    return { rawScore: Math.max(0, reps), details, confidence: Math.min(1, frames.length / 60) };
  }

  // sprint_40m / shuttle_run: measured duration of the movement phase
  const tStart = frames[0].t;
  const tEnd = frames[frames.length - 1].t;
  let duration = Math.max(0.5, tEnd - tStart);
  if (testType === "sprint_40m") {
    details.push({ label: "Timed phase", value: `${duration.toFixed(1)}s` });
    return { rawScore: Math.round(duration * 10) / 10, details, confidence: Math.min(1, frames.length / 60) };
  }
  // Shuttle: subtract pauses at the turn lines (~0.6s each)
  duration = Math.max(0.5, duration - 1.2);
  details.push({ label: "Timed phase", value: `${duration.toFixed(1)}s` });
  return { rawScore: Math.round(duration * 10) / 10, details, confidence: Math.min(1, frames.length / 60) };
}
