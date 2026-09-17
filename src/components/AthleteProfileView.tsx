import { api } from "@/convex/_generated/api";
import { TEST_META, TEST_TYPES, type TestType } from "@/lib/constants";
import { BAND_META, BAND_ORDER, formatScore, formatWhenFull, type BandKey } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Activity, CalendarDays, Flame, MapPin, School, Target } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared";
import type { Doc, Id } from "@/convex/_generated/dataModel";

export function AthleteProfileView({
  athlete,
  showRegionalComparison = false,
}: {
  athlete: Doc<"athletes">;
  showRegionalComparison?: boolean;
}) {
  const tests = useQuery(api.tests.listByAthlete, { athleteId: athlete._id });
  const allTests = useQuery(api.tests.listEnriched, showRegionalComparison ? {} : "skip");

  const [activeTab, setActiveTab] = useState<TestType>("vertical_jump");

  const byType = useMemo(() => {
    const map = new Map<TestType, typeof tests>();
    for (const tt of TEST_TYPES) {
      map.set(
        tt,
        (tests ?? [])
          .filter((t) => t.testType === tt)
          .sort((a, b) => (a.recordedAt ?? 0) - (b.recordedAt ?? 0)),
      );
    }
    return map;
  }, [tests]);

  const best = useMemo(() => {
    return (tests ?? []).reduce<{ band: BandKey; percentile: number } | null>((acc, t) => {
      if (!acc || BAND_ORDER.indexOf(t.band as BandKey) < BAND_ORDER.indexOf(acc.band)) {
        return { band: t.band as BandKey, percentile: t.percentile };
      }
      return acc;
    }, null);
  }, [tests]);

  const flaggedCount = (tests ?? []).filter((t) => t.isFlagged).length;
  const isFlagged = (tests ?? []).some((t) => t.isFlagged);

  const trendData = (byType.get(activeTab) ?? []).map((t) => ({
    date: formatWhenFull(t.recordedAt).split(",")[0],
    score: t.rawScore,
  }));

  const regionalData = useMemo(() => {
    if (!allTests) return [];
    return TEST_TYPES.map((tt) => {
      const mine = (allTests ?? []).filter((t) => t.athleteId === athlete._id && t.testType === tt);
      const regionTests = (allTests ?? []).filter((t) => t.testType === tt && t.region === athlete.region);
      const myAvg = mine.length ? mine.reduce((s, t) => s + t.percentile, 0) / mine.length : 0;
      const regionAvg = regionTests.length ? regionTests.reduce((s, t) => s + t.percentile, 0) / regionTests.length : 0;
      return { test: TEST_META[tt].short, you: Math.round(myAvg), region: Math.round(regionAvg) };
    });
  }, [allTests, athlete._id, athlete.region]);

  if (tests === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="overflow-hidden border-border/70">
        <div className="tl-gradient-hero h-2" />
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-secondary/10 font-display text-xl font-bold text-secondary">
            {athlete.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl font-bold tracking-tight">{athlete.name}</h2>
              {isFlagged && (
                <Badge className="gap-1 rounded-full bg-emerald-600 text-white">
                  <Flame className="size-3" /> On the scout map
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{athlete.age} yrs · {athlete.gender === "male" ? "Male" : "Female"}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {athlete.region}</span>
              {athlete.schoolName && <span className="inline-flex items-center gap-1"><School className="size-3.5" /> {athlete.schoolName}</span>}
              {athlete.sportInterest && <span className="inline-flex items-center gap-1"><Target className="size-3.5" /> {athlete.sportInterest}</span>}
            </div>
          </div>
          {best && (
            <span className={cn("inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-sm font-semibold sm:self-center", BAND_META[best.band].bg, BAND_META[best.band].text)}>
              <Activity className="size-4" /> Best: {BAND_META[best.band].label}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<CalendarDays className="size-5" />} label="Assessments filed" value={tests.length} sub="Across all four test types" />
        <StatCard
          icon={<Activity className="size-5" />}
          label="Best percentile"
          value={best ? `${Math.round(best.percentile)}th` : "—"}
          sub={best ? BAND_META[best.band].label : "No results yet"}
        />
        <StatCard icon={<Flame className="size-5" />} label="Scout attention" value={flaggedCount} sub="Top-15% performances" tone="dark" />
      </div>

      {/* Test history tabs */}
      <Card className="border-border/70">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TestType)}>
            <TabsList className="flex-wrap">
              {TEST_TYPES.map((tt) => (
                <TabsTrigger key={tt} value={tt}>
                  {TEST_META[tt].short}
                  {(byType.get(tt)?.length ?? 0) > 0 && (
                    <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] font-semibold">
                      {byType.get(tt)!.length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {TEST_TYPES.map((tt) => {
              const rows = byType.get(tt) ?? [];
              const meta = TEST_META[tt];
              return (
                <TabsContent key={tt} value={tt} className="mt-5">
                  {rows.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      No {meta.label} results on file yet.
                    </p>
                  ) : (
                    <>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                            <Tooltip
                              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                              formatter={(v) => [`${v} ${meta.unit === "reps" ? "reps" : meta.unit}`, meta.label]}
                            />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="#FF6B35"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: "#FF6B35" }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="mt-1 text-center text-xs text-muted-foreground">
                        {meta.label} across every assessment · {tt === "sprint_40m" || tt === "shuttle_run" ? "lower time is better" : "higher is better"}
                      </p>

                      <div className="mt-5 space-y-2">
                        {[...rows].reverse().map((t) => {
                          const band = BAND_META[t.band as BandKey];
                          return (
                            <div key={t._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="font-display text-lg font-bold">{formatScore(t.rawScore, t.unit)}</span>
                                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", band.bg, band.text)}>
                                  {band.label}
                                </span>
                                {t.isFlagged && (
                                  <Badge className="gap-1 rounded-full bg-emerald-600 text-white">
                                    <Flame className="size-3" /> Scout attention
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{formatWhenFull(t.recordedAt)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Regional comparison (athlete self-view) */}
      {showRegionalComparison && allTests !== undefined && allTests.length > 0 && (
        <Card className="border-border/70">
          <CardContent className="p-6">
            <p className="font-display font-semibold">Where you stand · {athlete.region}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Average percentile per test — you against every assessed athlete in your region.
            </p>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="test" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="you" name="You" fill="#FF6B35" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="region" name="Region avg" fill="#004E89" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export type AthleteId = Id<"athletes">;
