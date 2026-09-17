import type { Band, Gender, TestType } from "./schema";

export const UNIT_BY_TYPE: Record<TestType, string> = {
  vertical_jump: "cm",
  sprint_40m: "s",
  situps_30s: "reps",
  shuttle_run: "s",
};

/** Percentile band metadata, ranked best → worst. */
export const BAND_META: Record<
  Band,
  { label: string; color: string; bg: string; text: string; ring: string }
> = {
  top_15: {
    label: "Top 15%",
    color: "#00C853",
    bg: "bg-emerald-100/70",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
  },
  top_30: {
    label: "Top 30%",
    color: "#FF6B35",
    bg: "bg-orange-100/70",
    text: "text-orange-700",
    ring: "ring-orange-600/20",
  },
  average: {
    label: "Average",
    color: "#004E89",
    bg: "bg-sky-100/70",
    text: "text-sky-800",
    ring: "ring-sky-700/20",
  },
  below_average: {
    label: "Below Average",
    color: "#94A3B8",
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-400/20",
  },
};

export type NormRow = {
  testType: TestType;
  gender: Gender;
  ageMin: number;
  ageMax: number;
  percentile15Cutoff: number;
  percentile30Cutoff: number;
  percentile50Cutoff: number;
};

export function matchesNorm(norm: NormRow, testType: TestType, gender: Gender, age: number) {
  return norm.testType === testType && norm.gender === gender && age >= norm.ageMin && age <= norm.ageMax;
}

/**
 * Percentile (0-100, higher is better) + band for a raw score against seeded cutoffs.
 * Lower-is-better tests (sprints, shuttle run) invert the cutoffs.
 */
export function computePercentile(
  testType: TestType,
  rawScore: number,
  norm: Pick<NormRow, "percentile15Cutoff" | "percentile30Cutoff" | "percentile50Cutoff">,
): { percentile: number; band: Band } {
  const lowerIsBetter = testType === "sprint_40m" || testType === "shuttle_run";
  const { percentile15Cutoff: c15, percentile30Cutoff: c30, percentile50Cutoff: c50 } = norm;

  // Direct percentile using the three published cutoffs (15th, 30th, 50th).
  let percentile: number;
  if (!lowerIsBetter) {
    if (rawScore >= c15) percentile = 92.5;
    else if (rawScore >= c30) percentile = interpolate(rawScore, c30, c15, 70, 92.5);
    else if (rawScore >= c50) percentile = interpolate(rawScore, c50, c30, 40, 70);
    else percentile = Math.max(2, interpolate(rawScore, c50 * 0.6, c50, 2, 40));
  } else {
    if (rawScore <= c15) percentile = 92.5;
    else if (rawScore <= c30) percentile = interpolate(rawScore, c30, c15, 70, 92.5);
    else if (rawScore <= c50) percentile = interpolate(rawScore, c50, c30, 40, 70);
    else percentile = Math.max(2, interpolate(rawScore, c50 * 1.4, c50, 2, 40));
  }

  percentile = Math.round(percentile * 10) / 10;
  const band: Band =
    percentile >= 85 ? "top_15" : percentile >= 70 ? "top_30" : percentile >= 40 ? "average" : "below_average";
  return { percentile, band };
}

/** Linear map of x from [x0,x1] onto [y0,y1], clamped. */
function interpolate(x: number, x0: number, x1: number, y0: number, y1: number) {
  if (x1 === x0) return y0;
  const t = (x - x0) / (x1 - x0);
  const y = y0 + t * (y1 - y0);
  return Math.min(Math.max(y, Math.min(y0, y1)), Math.max(y0, y1));
}

/** Age band key used by the leaderboard filter (e.g. 12 → "12-14"). */
export function ageGroupKey(age: number): string {
  if (age <= 14) return "12-14";
  if (age <= 16) return "15-16";
  return "17-19";
}

export const AGE_GROUPS = ["12-14", "15-16", "17-19"] as const;

export function ageGroupRange(key: string): { min: number; max: number } {
  switch (key) {
    case "12-14":
      return { min: 12, max: 14 };
    case "15-16":
      return { min: 15, max: 16 };
    case "17-19":
      return { min: 17, max: 19 };
    default:
      return { min: 0, max: 200 };
  }
}
