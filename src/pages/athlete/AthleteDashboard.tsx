import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/shell";
import { AthleteProfileView } from "@/components/AthleteProfileView";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Trophy } from "lucide-react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

export default function AthleteDashboard() {
  const { user } = useAuth();
  const profile = useQuery(api.athletes.myAthleteProfile, {});
  const linkDemoProfile = useMutation(api.athletes.linkMyDemoProfile);

  // One-time: adopt a demo athlete profile so the dashboard shows real data.
  useEffect(() => {
    if (profile === null) {
      linkDemoProfile().catch(() => undefined);
    }
  }, [profile, linkDemoProfile]);

  return (
    <AppShell
      role="athlete"
      title={profile ? `Keep pushing, ${profile.name.split(" ")[0]}` : "My Dashboard"}
      subtitle="Your performance record — every assessment, benchmark, and regional standing."
    >
      {profile === undefined ? (
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      ) : profile === null ? (
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="No athlete profile linked yet"
          description="Once your coach registers you, your assessments, benchmarks, and regional standing appear here automatically. Meanwhile, browse the leaderboard to see the standard at the top."
          action={
            <Button asChild className="rounded-full">
              <Link to="/leaderboard">Browse the leaderboard</Link>
            </Button>
          }
        />
      ) : (
        <AthleteProfileView athlete={profile} showRegionalComparison />
      )}
    </AppShell>
  );
}
