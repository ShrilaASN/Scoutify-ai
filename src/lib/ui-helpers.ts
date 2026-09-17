import { format } from "date-fns";

export type BandKey = "top_15" | "top_30" | "average" | "below_average";

export const BAND_ORDER: BandKey[] = ["top_15", "top_30", "average", "below_average"];

/** Client-side mirror of the band metadata in convex/norms.ts */
export const BAND_META: Record<BandKey, { label: string; color: string; bg: string; text: string; ring: string }> = {
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

export function formatScore(rawScore: number, unit: string): string {
  if (unit === "s") return `${rawScore.toFixed(1)}s`;
  return `${Math.round(rawScore)} ${unit}`;
}

export function formatWhen(ts?: number): string {
  if (!ts) return "—";
  return format(new Date(ts), "d MMM");
}

export function formatWhenFull(ts?: number): string {
  if (!ts) return "—";
  return format(new Date(ts), "d MMM yyyy, h:mm a");
}

export type NormCutoffs = {
  percentile15Cutoff: number;
  percentile30Cutoff: number;
  percentile50Cutoff: number;
};

/** Client-side mirror of convex/norms.ts computePercentile (used for the instant results preview). */
export function computePercentileClient(
  testType: "vertical_jump" | "sprint_40m" | "situps_30s" | "shuttle_run",
  rawScore: number,
  norm: NormCutoffs,
): { percentile: number; band: BandKey } {
  const lowerIsBetter = testType === "sprint_40m" || testType === "shuttle_run";
  const { percentile15Cutoff: c15, percentile30Cutoff: c30, percentile50Cutoff: c50 } = norm;

  const interp = (x: number, x0: number, x1: number, y0: number, y1: number) => {
    if (x1 === x0) return y0;
    const t = (x - x0) / (x1 - x0);
    const y = y0 + t * (y1 - y0);
    return Math.min(Math.max(y, Math.min(y0, y1)), Math.max(y0, y1));
  };

  let percentile: number;
  if (!lowerIsBetter) {
    if (rawScore >= c15) percentile = 92.5;
    else if (rawScore >= c30) percentile = interp(rawScore, c30, c15, 70, 92.5);
    else if (rawScore >= c50) percentile = interp(rawScore, c50, c30, 40, 70);
    else percentile = Math.max(2, interp(rawScore, c50 * 0.6, c50, 2, 40));
  } else {
    if (rawScore <= c15) percentile = 92.5;
    else if (rawScore <= c30) percentile = interp(rawScore, c30, c15, 70, 92.5);
    else if (rawScore <= c50) percentile = interp(rawScore, c50, c30, 40, 70);
    else percentile = Math.max(2, interp(rawScore, c50 * 1.4, c50, 2, 40));
  }

  percentile = Math.round(percentile * 10) / 10;
  const band: BandKey =
    percentile >= 85 ? "top_15" : percentile >= 70 ? "top_30" : percentile >= 40 ? "average" : "below_average";
  return { percentile, band };
}
