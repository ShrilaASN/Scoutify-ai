import { useAuth } from "@/hooks/use-auth";
import { ROLE_HOME } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router";

/** Role router: sends the signed-in user to the dashboard for their role. */
export default function Dashboard() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth?returnTo=%2Fdashboard" replace />;

  const role = user?.appRole ?? "coach";
  return <Navigate to={ROLE_HOME[role]} replace />;
}
