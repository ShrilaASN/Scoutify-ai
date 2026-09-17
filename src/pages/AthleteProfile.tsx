import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/shell";
import { AthleteProfileView } from "@/components/AthleteProfileView";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserX } from "lucide-react";
import { Link, useParams } from "react-router";
import { useQuery } from "convex/react";

export default function AthleteProfilePage() {
  const { id } = useParams<{ id: string }>();
  const athlete = useQuery(api.athletes.get, id ? { id: id as never } : "skip");

  return (
    <AppShell role="coach" title="Athlete Profile">
      <Link
        to="/coach/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      {athlete === undefined ? (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      ) : athlete === null ? (
        <EmptyState
          icon={<UserX className="size-5" />}
          title="Athlete not found"
          description="This athlete profile doesn't exist or was removed."
          action={
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/coach/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      ) : (
        <AthleteProfileView athlete={athlete} />
      )}
    </AppShell>
  );
}
