import { useAuth } from "@/hooks/use-auth";
import type { AppRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  LogOut,
  Radar,
  Trophy,
  UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, Navigate, useLocation, useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_BY_ROLE: Record<AppRole, { to: string; label: string; icon: ReactNode }[]> = {
  coach: [
    { to: "/coach/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { to: "/coach/athletes/new", label: "Add Athlete", icon: <UserPlus className="size-4" /> },
    { to: "/coach/test/record", label: "Record Test", icon: <ClipboardList className="size-4" /> },
    { to: "/leaderboard", label: "Leaderboard", icon: <Trophy className="size-4" /> },
  ],
  athlete: [
    { to: "/athlete/dashboard", label: "My Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { to: "/leaderboard", label: "Leaderboard", icon: <Trophy className="size-4" /> },
  ],
  scout: [
    { to: "/scout/dashboard", label: "Talent Search", icon: <Radar className="size-4" /> },
    { to: "/leaderboard", label: "Leaderboard", icon: <Trophy className="size-4" /> },
  ],
};

export const ROLE_HOME: Record<AppRole, string> = {
  coach: "/coach/dashboard",
  athlete: "/athlete/dashboard",
  scout: "/scout/dashboard",
};

function LogoMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-secondary text-white shadow-sm">
        <Activity className="size-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Talent<span className="text-primary">Lens</span>
      </span>
    </span>
  );
}

/**
 * Authenticated, role-aware app shell: top navbar with role links, user menu,
 * page header with actions slot, and a mobile bottom tab bar. With `publicNav`,
 * the shell also renders for signed-out visitors (used by the public leaderboard).
 */
export function AppShell({
  role = "coach",
  title,
  subtitle,
  actions,
  publicNav = false,
  children,
}: {
  role?: AppRole;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  publicNav?: boolean;
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const effectiveRole: AppRole = (user?.appRole as AppRole | undefined) ?? role;
  const items = NAV_BY_ROLE[effectiveRole];

  if (!publicNav) {
    if (isLoading) {
      return (
        <div className="grid min-h-screen place-items-center bg-background">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (!isAuthenticated) {
      const returnTo = `${location.pathname}${location.search}`;
      return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
    }
  }

  if (publicNav && isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const logoTarget = isAuthenticated ? ROLE_HOME[effectiveRole] : "/";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <button onClick={() => navigate(logoTarget)} className="cursor-pointer">
            <LogoMark />
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
            {!isAuthenticated && (
              <NavLink
                to="/"
                className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Home
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {actions && <div className="hidden items-center gap-2 md:flex">{actions}</div>}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-card py-1 pl-1 pr-2.5 shadow-sm transition hover:shadow">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-secondary text-xs font-semibold text-white">
                        {(user?.name ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
                      {user?.name ?? "User"}
                    </span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="truncate">{user?.name ?? "User"}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {user?.email ?? `${effectiveRole} (demo)`}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="capitalize">
                    {effectiveRole} account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="rounded-full">
                <NavLink to="/auth">Sign in</NavLink>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 md:hidden">{actions}</div>}
        </div>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-flow-col auto-cols-fr">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
                  isActive && "text-primary",
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
