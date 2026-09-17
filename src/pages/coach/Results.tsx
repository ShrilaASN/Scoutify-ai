import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/shell";
import { PercentileGauge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TestType } from "@/lib/constants";
import { LOWER_IS_BETTER, TEST_META } from "@/lib/constants";
import { BAND_META, computePercentileClient, formatScore } from "@/lib/ui-helpers";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CheckCircle2, Flame, PartyPopper, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import confetti from "canvas-confetti";

type LocationState = {
  rawScore: number;
  details: { label: string; value: string }[];
  athleteId: string;
  testType: TestType;
  frames: number;
  confidence: number;
};

/** Animated number counter (count up from 0 to target). */
function useCountUp(target: number, durationMs = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);
  return value;
}

export default function Results() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? null) as LocationState | null;
  const pendingId = testId === "pending" || !testId;

  const [savedId, setSavedId] = useState<string | null>(pendingId ? null : (testId ?? null));
  const [isSaving, setIsSaving] = useState(false);

  // Saved-result lookup (deep link to an already-saved test)
  const savedTest = useQuery(
    api.tests.get,
    pendingId ? "skip" : ({ id: testId as never } as never),
  );
  const savedAthlete = useQuery(
    api.athletes.get,
    savedTest && !pendingId ? { id: savedTest.athleteId } : "skip",
  );
  const norms = useQuery(api.benchmarkNorms.list, pendingId ? "skip" : { testType: savedTest?.testType });

  // Pending-result data
  const athleteId = state?.athleteId ?? "";
  const previewAthlete = useQuery(api.athletes.get, athleteId ? { id: athleteId as never } : "skip");
  const previewNorms = useQuery(
    api.benchmarkNorms.list,
    state ? { testType: state.testType } : "skip",
  );
  const recordTest = useMutation(api.tests.record);

  const displayScore = pendingId ? (state?.rawScore ?? 0) : (savedTest?.rawScore ?? 0);
  const animatedScore = useCountUp(displayScore);
  const [firedConfetti, setFiredConfetti] = useState(false);

  const norm = useMemo(() => {
    const list = pendingId ? previewNorms : norms;
    const athlete = pendingId ? previewAthlete : savedAthlete;
    if (!list || !athlete) return null;
    return (
      list.find((n) => n.gender === athlete.gender && athlete.age >= n.ageMin && athlete.age <= n.ageMax) ?? null
    );
  }, [pendingId, previewNorms, norms, previewAthlete, savedAthlete]);

  const computed = useMemo(() => {
    const athlete = pendingId ? previewAthlete : savedAthlete;
    const score = pendingId ? (state?.rawScore ?? 0) : (savedTest?.rawScore ?? 0);
    if (!athlete || !norm || !score) return null;
    const { percentile, band } = computePercentileClient(state?.testType ?? savedTest!.testType, score, norm);
    return { percentile, band, athlete };
  }, [pendingId, previewAthlete, savedAthlete, norm, state, savedTest]);

  const isFlagged = pendingId ? computed?.band === "top_15" : (savedTest?.isFlagged ?? false);

  useEffect(() => {
    if (isFlagged && !firedConfetti) {
      setFiredConfetti(true);
      confetti({
        particleCount: 160,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#FF6B35", "#00C853", "#004E89", "#ffffff"],
      });
    }
  }, [isFlagged, firedConfetti]);

  const handleSave = async () => {
    if (!state || !computed) return;
    setIsSaving(true);
    try {
      const res = await recordTest({
        athleteId: state.athleteId as never,
        testType: state.testType,
        rawScore: state.rawScore,
      });
      setSavedId(res.testId);
      toast.success("Result saved to the athlete profile", {
        description: res.isFlagged
          ? "Scout-worthy performance — flagged for recruiters!"
          : "The athlete can see this on their dashboard.",
      });
      navigate(`/athlete/${state.athleteId}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Could not save the result. Please try again.");
      setIsSaving(false);
    }
  };

  const athlete = pendingId ? previewAthlete : savedAthlete;
  const testMeta = TEST_META[(pendingId ? state?.testType : savedTest?.testType) ?? "vertical_jump"];

  if (!pendingId && savedTest === undefined) {
    return (
      <AppShell role="coach" title="Test Result">
        <Skeleton className="h-72 rounded-2xl" />
      </AppShell>
    );
  }

  if (!athlete || !computed) {
    return (
      <AppShell role="coach" title="Test Result">
        <Card className="border-border/70">
          <CardContent className="grid place-items-center gap-4 p-10 text-center">
            <ArrowLeft className="size-8 text-muted-foreground" />
            <p className="font-display text-lg font-semibold">No result to display</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Record a test first — the results screen opens automatically after capture.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/coach/test/record">Record a test</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const band = BAND_META[computed.band];
  const isLowerBetter = LOWER_IS_BETTER[(pendingId ? state!.testType : savedTest!.testType) as TestType];

  return (
    <AppShell role="coach" title="Test Result" subtitle="Scored by AI, benchmarked against national norms.">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          to="/coach/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        {/* Score hero */}
        <Card className="tl-gradient-hero overflow-hidden border-0 text-white">
          <CardContent className="relative p-8 text-center">
            <div className="tl-grid-bg absolute inset-0 opacity-40" />
            <div className="relative">
              <p className="text-sm font-medium text-white/75">
                {athlete.name} · {testMeta.label}
              </p>
              <div className="mt-3 font-display text-7xl font-extrabold tracking-tight">
                {isLowerBetter ? animatedScore.toFixed(1) : Math.round(animatedScore)}
                <span className="ml-2 text-2xl font-bold text-white/80">{testMeta.unit === "reps" ? "reps" : testMeta.unit}</span>
              </div>
              <p className="mt-2 text-sm text-white/70">
                {pendingId ? `Analyzed from ${state?.frames ?? 0} pose frames` : formatScore(savedTest!.rawScore, savedTest!.unit)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Flag banner */}
        {isFlagged && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-white">
              <Flame className="size-5" />
            </span>
            <div>
              <p className="font-display font-semibold text-emerald-800">Scout-worthy!</p>
              <p className="text-sm text-emerald-700">
                This performance lands in the top 15% — the athlete will be flagged on the scout dashboard.
              </p>
            </div>
            <PartyPopper className="ml-auto hidden size-5 text-emerald-600 sm:block" />
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {/* Percentile gauge */}
          <Card className="border-border/70">
            <CardContent className="flex flex-col items-center p-6">
              <PercentileGauge value={computed.percentile} color={band.color} />
              <Badge className={band.bg + " " + band.text + " mt-4 rounded-full border-0 px-3 py-1 text-sm font-semibold"}>
                {band.label} for {athlete.age}y {athlete.gender === "male" ? "male" : "female"}
              </Badge>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Better than {Math.round(computed.percentile)}% of athletes in this age-gender group
              </p>
            </CardContent>
          </Card>

          {/* Benchmark cutoffs + AI details */}
          <Card className="border-border/70">
            <CardContent className="p-6">
              <p className="text-sm font-semibold">Benchmark cutoffs · {testMeta.label}</p>
              <div className="mt-3 space-y-2.5 text-sm">
                {[
                  { label: "Top 15%", value: norm?.percentile15Cutoff, tone: "text-emerald-700" },
                  { label: "Top 30%", value: norm?.percentile30Cutoff, tone: "text-orange-700" },
                  { label: "Median (Top 50%)", value: norm?.percentile50Cutoff, tone: "text-sky-800" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={row.tone + " font-semibold"}>
                      {typeof row.value === "number"
                        ? `${row.value}${testMeta.unit === "reps" ? " reps" : " " + testMeta.unit}`
                        : "—"}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2.5">
                  <span className="font-medium">This score</span>
                  <span className="font-display text-base font-bold">
                    {formatScore(displayScore, testMeta.unit)}
                  </span>
                </div>
              </div>

              {pendingId && state?.details?.length ? (
                <>
                  <p className="mt-5 text-sm font-semibold">AI analysis</p>
                  <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {state.details.map((d) => (
                      <div key={d.label} className="flex items-center justify-between gap-3">
                        <span>{d.label}</span>
                        <span className="font-medium text-foreground">{d.value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3">
                      <span>Tracking confidence</span>
                      <span className="font-medium text-foreground">{Math.round((state.confidence ?? 0) * 100)}%</span>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-secondary" />
                {isLowerBetter
                  ? "For timed tests, lower is better — the AI flags performances under the top-15% cutoff."
                  : "For jump and rep tests, higher is better — the AI flags performances above the top-15% cutoff."}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          {pendingId ? (
            <>
              <Button className="flex-1 rounded-full" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save result"}
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/coach/test/record">
                  <RotateCcw className="mr-2 size-4" /> Record another test
                </Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-full">
                <Link to={`/athlete/${athleteId}`}>View athlete profile</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="flex-1 rounded-full">
                <Link to={`/athlete/${savedTest?.athleteId}`}>
                  <Trophy className="mr-2 size-4" /> View athlete profile
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/coach/test/record">
                  <RotateCcw className="mr-2 size-4" /> Record another test
                </Link>
              </Button>
            </>
          )}
        </div>
        {savedId && pendingId && <p className="text-center text-xs text-muted-foreground">Saved as test {savedId}</p>}
      </div>
    </AppShell>
  );
}
