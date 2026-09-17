import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/shell";
import { EmptyState, StatCard } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { REGIONS, TEST_META, TEST_TYPES, type TestType } from "@/lib/constants";
import { BAND_META, BAND_ORDER, formatScore, type BandKey } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Flame,
  Radar,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortKey = "name" | "age" | "region" | "band" | "percentile";

export default function ScoutDashboard() {
  const navigate = useNavigate();
  const athletes = useQuery(api.athletes.listAll);
  const tests = useQuery(api.tests.listEnriched);

  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [sport, setSport] = useState("all");
  const [band, setBand] = useState("all");
  const [ageBand, setAgeBand] = useState("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("percentile");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const loading = athletes === undefined || tests === undefined;

  const summary = useMemo(() => {
    const testsList = tests ?? [];
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return {
      total: athletes?.length ?? 0,
      flaggedThisMonth: testsList.filter((t) => t.isFlagged && (t.recordedAt ?? 0) >= monthStart.getTime()).length,
      avgPercentile: testsList.length
        ? Math.round(testsList.reduce((s, t) => s + t.percentile, 0) / testsList.length)
        : 0,
    };
  }, [athletes, tests]);

  /** Region heatmap: athletes and flagged athletes per region. */
  const regionStats = useMemo(() => {
    const stats = REGIONS.map((r) => ({ region: r as string, athletes: 0, flagged: 0 }));
    const byRegion = new Map(stats.map((s) => [s.region, s]));
    for (const a of athletes ?? []) {
      const row = byRegion.get(a.region);
      if (row) row.athletes++;
    }
    const flaggedAthletes = new Set((tests ?? []).filter((t) => t.isFlagged).map((t) => t.athleteId));
    for (const a of athletes ?? []) {
      if (flaggedAthletes.has(a._id)) {
        const row = byRegion.get(a.region);
        if (row) row.flagged++;
      }
    }
    return stats;
  }, [athletes, tests]);

  const sports = useMemo(
    () => Array.from(new Set((athletes ?? []).map((a) => a.sportInterest).filter((s): s is string => Boolean(s)))),
    [athletes],
  );

  /** Per-athlete aggregated view (best percentile/band + test count). */
  const rows = useMemo(() => {
    if (!athletes || !tests) return [];
    const bestByAthlete = new Map<string, { percentile: number; band: BandKey; testCount: number; flagged: boolean }>();
    for (const t of tests) {
      const cur = bestByAthlete.get(t.athleteId);
      if (!cur || BAND_ORDER.indexOf(t.band as BandKey) < BAND_ORDER.indexOf(cur.band)) {
        bestByAthlete.set(t.athleteId, {
          percentile: t.percentile,
          band: t.band as BandKey,
          testCount: (cur?.testCount ?? 0) + 1,
          flagged: cur?.flagged || t.isFlagged,
        });
      } else {
        cur.testCount++;
        cur.flagged = cur.flagged || t.isFlagged;
      }
    }
    return athletes.map((a) => {
      const agg = bestByAthlete.get(a._id);
      return {
        id: a._id,
        name: a.name,
        age: a.age,
        gender: a.gender,
        region: a.region,
        schoolName: a.schoolName,
        sportInterest: a.sportInterest,
        percentile: agg?.percentile ?? null,
        band: agg?.band ?? null,
        testCount: agg?.testCount ?? 0,
        flagged: agg?.flagged ?? false,
      };
    });
  }, [athletes, tests]);

  const filtered = useMemo(() => {
    let out = rows;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.region.toLowerCase().includes(q) ||
          r.schoolName?.toLowerCase().includes(q) ||
          r.sportInterest?.toLowerCase().includes(q),
      );
    }
    if (region !== "all") out = out.filter((r) => r.region === region);
    if (sport !== "all") out = out.filter((r) => r.sportInterest === sport);
    if (band !== "all") out = out.filter((r) => r.band === band);
    if (ageBand !== "all") {
      out = out.filter((r) =>
        ageBand === "12-14" ? r.age <= 14 : ageBand === "15-16" ? r.age >= 15 && r.age <= 16 : r.age >= 17,
      );
    }
    if (flaggedOnly) out = out.filter((r) => r.flagged);

    const dir = sortDir === "asc" ? 1 : -1;
    return out.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "age":
          return (a.age - b.age) * dir;
        case "region":
          return a.region.localeCompare(b.region) * dir;
        case "percentile":
          return ((a.percentile ?? -1) - (b.percentile ?? -1)) * dir;
        case "band":
        default:
          return (
            BAND_ORDER.indexOf((a.band ?? "below_average") as BandKey) -
              BAND_ORDER.indexOf((b.band ?? "below_average") as BandKey)
          ) * dir;
      }
    });
  }, [rows, query, region, sport, band, ageBand, flaggedOnly, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "region" ? "asc" : "desc");
    }
  };

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead>
      <button onClick={() => toggleSort(k)} className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground">
        {label}
        {sortKey === k ? (
          sortDir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );

  return (
    <AppShell
      role="scout"
      title="Scout Desk"
      subtitle="A live, benchmarked view of every assessed athlete — search, filter, and work the shortlist."
    >
      {/* Operations summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Users className="size-5" />} label="Athletes in the pool" value={loading ? "—" : summary.total} sub="Assessed across five regions" />
        <StatCard icon={<Flame className="size-5" />} label="Flagged this month" value={loading ? "—" : summary.flaggedThisMonth} sub="New top-15% performers" tone="dark" />
        <StatCard icon={<Radar className="size-5" />} label="Average percentile" value={loading ? "—" : `${summary.avgPercentile}th`} sub="Across all filed assessments" />
      </div>

      {/* Region heatmap grid */}
      <Card className="mt-6 border-border/70">
        <CardContent className="p-6">
          <p className="font-display font-semibold">Coverage map</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Assessed athletes and top-15% flags per region — darker tiles signal where the talent pool is deepest.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {regionStats.map((r) => {
              const intensity = r.athletes === 0 ? 0 : Math.min(1, r.flagged / Math.max(1, r.athletes * 0.5));
              return (
                <div
                  key={r.region}
                  className={cn(
                    "rounded-xl border p-4",
                    intensity > 0.5
                      ? "border-emerald-300 bg-emerald-500/15"
                      : intensity > 0
                        ? "border-emerald-200 bg-emerald-500/8"
                        : "border-border bg-muted/40",
                  )}
                >
                  <p className="text-xs font-medium leading-tight text-muted-foreground">{r.region}</p>
                  <p className="mt-2 font-display text-2xl font-bold">{r.athletes}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <Flame className="size-3" /> {r.flagged} on the map
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mt-6 border-border/70">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, school, region…"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sports</SelectItem>
                  {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={ageBand} onValueChange={setAgeBand}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ages</SelectItem>
                  <SelectItem value="12-14">12–14</SelectItem>
                  <SelectItem value="15-16">15–16</SelectItem>
                  <SelectItem value="17-19">17–19</SelectItem>
                </SelectContent>
              </Select>
              <Select value={band} onValueChange={setBand}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All bands</SelectItem>
                  {BAND_ORDER.map((b) => <SelectItem key={b} value={b}>{BAND_META[b].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={flaggedOnly ? "default" : "outline"}
              className={cn("rounded-full", flaggedOnly && "bg-emerald-600 hover:bg-emerald-700")}
              onClick={() => setFlaggedOnly((v) => !v)}
            >
              <Flame className="size-4" /> On the map only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Radar className="size-5" />}
            title="No athletes match these filters"
            description="Widen a filter or clear the search — new assessments land on this desk in real time."
          />
        </div>
      ) : (
        <Card className="mt-4 border-border/70 py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortHead label="Athlete" k="name" />
                  <SortHead label="Age" k="age" />
                  <SortHead label="Region" k="region" />
                  <TableHead className="hidden md:table-cell">Sport</TableHead>
                  <SortHead label="Best band" k="band" />
                  <SortHead label="Percentile" k="percentile" />
                  <TableHead className="text-right">Tests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    onClick={() => navigate(`/athlete/${r.id}`)}
                    className="tl-card-lift cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                          {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                        <div>
                          <p className="font-medium leading-tight">{r.name}</p>
                          {r.flagged && (
                            <Badge className="mt-0.5 gap-1 rounded-full bg-emerald-600 text-white">
                              <Flame className="size-3" /> On the map
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{r.age}</TableCell>
                    <TableCell className="text-muted-foreground">{r.region}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{r.sportInterest ?? "—"}</TableCell>
                    <TableCell>
                      {r.band ? (
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", BAND_META[r.band].bg, BAND_META[r.band].text)}>
                          {BAND_META[r.band].label}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not assessed</span>
                      )}
                    </TableCell>
                    <TableCell className="font-display font-bold">{r.percentile != null ? `${Math.round(r.percentile)}th` : "—"}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.testCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
