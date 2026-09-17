import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/shell";
import { EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LOWER_IS_BETTER, TEST_META, TEST_TYPES, type TestType } from "@/lib/constants";
import { BAND_META, formatScore, type BandKey } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Flame, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

const AGE_FILTERS: Record<string, [number, number]> = {
  "12-14": [12, 14],
  "15-16": [15, 16],
  "17-19": [17, 19],
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const [testType, setTestType] = useState<TestType>("vertical_jump");
  const [ageGroup, setAgeGroup] = useState<string>("all");

  const tests = useQuery(api.tests.listEnriched, {});
  const loading = tests === undefined;

  const sorted = useMemo(() => {
    const lowerBetter = LOWER_IS_BETTER[testType];
    return (tests ?? [])
      .filter((t) => t.testType === testType)
      .filter((t) => {
        if (ageGroup === "all") return true;
        const [min, max] = AGE_FILTERS[ageGroup];
        return t.athleteAge >= min && t.athleteAge <= max;
      })
      .sort((a, b) => (lowerBetter ? a.rawScore - b.rawScore : b.rawScore - a.rawScore));
  }, [tests, testType, ageGroup]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <AppShell
      role="coach"
      publicNav
      title="Leaderboard"
      subtitle="The national standard, test by test — every result here was measured, not estimated."
    >
      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          {TEST_TYPES.map((tt) => (
            <button
              key={tt}
              onClick={() => setTestType(tt)}
              className={cn(
                "cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                testType === tt
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {TEST_META[tt].short}
            </button>
          ))}
        </div>
        <Select value={ageGroup} onValueChange={setAgeGroup}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All age groups</SelectItem>
            {Object.keys(AGE_FILTERS).map((g) => (
              <SelectItem key={g} value={g}>
                Ages {g.replace("-", "–")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Trophy className="size-5" />}
            title="No results here yet"
            description="Once coaches file assessments for this test and age group, the leading performances appear here automatically."
          />
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="mt-8 grid grid-cols-3 items-end gap-3 sm:gap-5">
            {podiumOrder.map((p) => {
              const place = p === top3[0] ? 1 : p === top3[1] ? 2 : 3;
              const barHeights: Record<number, string> = { 1: "sm:h-36", 2: "sm:h-28", 3: "sm:h-24" };
              const medalColors: Record<number, string> = {
                1: "bg-amber-400",
                2: "bg-slate-300",
                3: "bg-orange-400",
              };
              return (
                <div key={p._id} className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full font-display text-base font-bold text-white shadow-md sm:size-11 sm:text-lg",
                      medalColors[place],
                    )}
                  >
                    {place}
                  </span>
                  <p className="mt-2 max-w-full truncate text-center text-sm font-semibold">{p.athleteName}</p>
                  <p className="max-w-full truncate text-xs text-muted-foreground">{p.region}</p>
                  <div
                    className={cn(
                      "mt-2.5 flex w-full flex-col items-center justify-start rounded-t-2xl border border-b-0 border-border/70 pt-3.5 sm:h-0",
                      barHeights[place].replace("sm:", ""),
                      medalColors[place] + "/20",
                    )}
                    style={{ height: place === 1 ? 96 : place === 2 ? 76 : 64 }}
                  >
                    <span className="font-display text-lg font-bold sm:text-xl">
                      {formatScore(p.rawScore, p.unit)}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground">
                      {Math.round(p.percentile)}th pct
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranked list */}
          <Card className="mt-8 border-border/70 py-0">
            <CardContent className="p-0">
              {rest.map((t, i) => {
                const band = BAND_META[t.band as BandKey];
                return (
                  <button
                    key={t._id}
                    onClick={() => navigate(`/athlete/${t.athleteId}`)}
                    className="flex w-full cursor-pointer items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left transition last:border-0 hover:bg-muted/50 sm:gap-4"
                  >
                    <span className="w-8 shrink-0 text-center font-display text-base font-bold text-muted-foreground">
                      {i + 4}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-tight">{t.athleteName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.region} · {t.athleteAge}y {t.athleteGender === "male" ? "M" : "F"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex",
                        band.bg,
                        band.text,
                      )}
                    >
                      {band.label}
                    </span>
                    {t.isFlagged && (
                      <Badge className="hidden gap-1 rounded-full bg-emerald-600 text-white sm:inline-flex">
                        <Flame className="size-3" /> On the map
                      </Badge>
                    )}
                    <span className="font-display text-lg font-bold">{formatScore(t.rawScore, t.unit)}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Rankings use each athlete's latest {TEST_META[testType].label} result ·{" "}
            {LOWER_IS_BETTER[testType] ? "lower time is better" : "higher is better"} · updated live as coaches file results
          </p>
        </>
      )}
    </AppShell>
  );
}
