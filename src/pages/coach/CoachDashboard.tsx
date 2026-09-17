import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { TEST_META, type TestType } from "@/lib/constants";
import { AppShell } from "@/components/shell";
import { EmptyState, StatCard } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BAND_META, BAND_ORDER, formatScore, formatWhen } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { ClipboardList, Flame, MapPin, Plus, Users, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router";

export default function CoachDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const athletes = useQuery(api.athletes.listMine);
  const tests = useQuery(api.tests.listEnriched);

  const loading = athletes === undefined || tests === undefined;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const testsThisMonth = (tests ?? []).filter((t) => (t.recordedAt ?? 0) >= monthStart.getTime());
  const flaggedIds = new Set((tests ?? []).filter((t) => t.isFlagged).map((t) => t.athleteId));

  return (
    <AppShell
      role="coach"
      title={`Namaste, ${user?.name?.split(" ")[0] ?? "Coach"} 👋`}
      subtitle="Your rural talent pipeline at a glance."
      actions={
        <>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/coach/athletes/new">
              <UserPlus className="size-4" /> Add Athlete
            </Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/coach/test/record">
              <Plus className="size-4" /> Record New Test
            </Link>
          </Button>
        </>
      }
    >
      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Users className="size-5" />} label="Athletes registered" value={loading ? "—" : athletes!.length} sub="Across all regions" />
        <StatCard icon={<ClipboardList className="size-5" />} label="Tests this month" value={loading ? "—" : testsThisMonth.length} sub="AI-scored automatically" />
        <StatCard icon={<Flame className="size-5" />} label="Flagged athletes" value={loading ? "—" : flaggedIds.size} sub="Top 15% — scout-worthy" tone="dark" />
      </div>

      {/* Athletes */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Your athletes</h2>
        <Link to="/coach/athletes/new" className="text-sm font-medium text-primary hover:underline">
          + Add new
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : athletes!.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Users className="size-5" />}
            title="No athletes yet"
            description="Register your first athlete to start recording AI-scored fitness tests."
            action={
              <Button asChild className="rounded-full">
                <Link to="/coach/athletes/new">
                  <UserPlus className="size-4" /> Add your first athlete
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {athletes!.map((a) => {
            const athleteTests = (tests ?? []).filter((t) => t.athleteId === a._id);
            const best = athleteTests.reduce<{ band: string; percentile: number } | null>((acc, t) => {
              if (!acc || BAND_ORDER.indexOf(t.band as never) < BAND_ORDER.indexOf(acc.band as never)) {
                return { band: t.band, percentile: t.percentile };
              }
              return acc;
            }, null);
            const meta = best ? BAND_META[best.band as keyof typeof BAND_META] : null;
            const lastTest = athleteTests[0];
            return (
              <Card
                key={a._id}
                onClick={() => navigate(`/athlete/${a._id}`)}
                className="tl-card-lift cursor-pointer border-border/70 transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary/10 font-display text-sm font-bold text-secondary">
                        {a.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      <div>
                        <p className="font-semibold leading-tight">{a.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {a.age} yrs · {a.gender === "male" ? "M" : "F"} {a.sportInterest ? `· ${a.sportInterest}` : ""}
                        </p>
                      </div>
                    </div>
                    {a._id && flaggedIds.has(a._id) && (
                      <Badge className="gap-1 rounded-full bg-emerald-500 text-white">
                        <Flame className="size-3" /> Flagged
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" /> {a.region} {a.schoolName ? `· ${a.schoolName}` : ""}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    {meta ? (
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", meta.bg, meta.text)}>
                        {meta.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No tests yet</span>
                    )}
                    {lastTest && (
                      <span className="text-xs text-muted-foreground">
                        Last: {TEST_META[lastTest.testType as TestType].short} {formatScore(lastTest.rawScore, lastTest.unit)} · {formatWhen(lastTest.recordedAt)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
