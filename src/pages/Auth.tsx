import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";
import { Activity, ArrowRight, GraduationCap, Loader2, Radar, ScanLine, Trophy, Upload, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ROLE_HOME, type AppRole } from "@/lib/constants";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

const ROLE_OPTIONS: { role: AppRole; label: string; icon: React.ReactNode }[] = [
  { role: "coach", label: "Coach / Teacher", icon: <GraduationCap className="size-4" /> },
  { role: "athlete", label: "Athlete", icon: <Trophy className="size-4" /> },
  { role: "scout", label: "Scout", icon: <Radar className="size-4" /> },
];

const DEMO_PRELOAD = "30 athlete profiles and 90 assessed tests are pre-loaded for your demo.";

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);
  const initialRole = (searchParams.get("mode") as AppRole | null) ?? "coach";

  const [role, setRole] = useState<AppRole>(ROLE_OPTIONS.some((r) => r.role === initialRole) ? initialRole : "coach");
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect);
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (err) {
      console.error("Email sign-in error:", err);
      setError(err instanceof Error ? err.message : "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("The verification code you entered is incorrect.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const finishDemoSignIn = async (demoRole: AppRole) => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(ROLE_HOME[demoRole], { replace: true });
    } catch (err) {
      console.error("Demo sign-in error:", err);
      setError(`Failed to sign in: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left brand panel */}
      <div className="tl-gradient-hero relative hidden w-[46%] flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="tl-grid-bg absolute inset-0 opacity-50" />
        <div className="relative">
          <button onClick={() => navigate("/")} className="flex cursor-pointer items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-white/15 text-white backdrop-blur">
              <Activity className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Talent<span className="text-orange-300">Lens</span>
            </span>
          </button>
        </div>
        <div className="relative">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white">
            Your scouting desk, ready when you are.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">
            Scoutify AI gives every coach a pocket-sized scouting desk — record a few simple tests, get a
            fair performance signal, and put overlooked athletes on the map.
          </p>
          <div className="mt-8 space-y-3 text-sm text-white/80">
            <p className="flex items-center gap-2.5"><ScanLine className="size-4 text-amber-300" /> Fair, benchmarked signals — not gut feel</p>
            <p className="flex items-center gap-2.5"><Upload className="size-4 text-amber-300" /> Record live or upload footage after the fact</p>
            <p className="flex items-center gap-2.5"><Trophy className="size-4 text-amber-300" /> Every result visible on the scout desk</p>
          </div>
        </div>
        <p className="relative text-xs text-white/50">Demo data included · No equipment purchase required</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src={logo} alt="Scoutify AI" className="size-10 rounded-lg" />
            <div>
              <p className="font-display font-bold leading-tight">Scoutify AI</p>
              <p className="text-xs text-muted-foreground">The pocket scouting desk for coaches</p>
            </div>
          </div>

          <Card className="border-border/70 shadow-lg shadow-secondary/5">
            {step === "signIn" ? (
              <>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Sign in to Scoutify AI</CardTitle>
                  <CardDescription>Choose how you work, then continue with a demo desk or your email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Role selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {ROLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => setRole(opt.role)}
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition",
                          role === opt.role
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* One-tap demo accounts */}
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5">
                    <p className="text-xs font-semibold">Explore with a demo desk</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {role === "coach"
                        ? "Step into a coach's desk"
                        : role === "athlete"
                          ? "Step into an athlete's view"
                          : "Step into the scout desk"}
                      {" "}— {DEMO_PRELOAD}
                    </p>
                    <Button
                      type="button"
                      className="mt-3 w-full rounded-full"
                      disabled={isLoading}
                      onClick={() => finishDemoSignIn(role)}
                    >
                      {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Continue as {role === "coach" ? "Coach" : role === "athlete" ? "Athlete" : "Scout"} (demo)
                    </Button>
                    <p className="mt-2 text-center text-[11px] leading-4 text-muted-foreground">
                      Demo logins: coach@demo.com · athlete@demo.com · scout@demo.com
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-2 text-xs uppercase text-muted-foreground">or use email</span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailSubmit}>
                    <div className="flex items-center gap-2">
                      <Input
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        disabled={isLoading}
                        required
                      />
                      <Button type="submit" variant="outline" size="icon" disabled={isLoading} aria-label="Send code">
                        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                      </Button>
                    </div>
                    {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      We&apos;ll email you a 6-digit verification code.
                    </p>
                  </form>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Check your email</CardTitle>
                  <CardDescription>We&apos;ve sent a code to {step.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOtpSubmit}>
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit code"
                      inputMode="numeric"
                      className="text-center font-display text-lg tracking-[0.4em]"
                      disabled={isLoading}
                      autoFocus
                    />
                    {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="mt-4 w-full rounded-full" disabled={isLoading || otp.length !== 6}>
                      {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Verify code <ArrowRight className="ml-1 size-4" />
                    </Button>
                    <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setStep("signIn")} disabled={isLoading}>
                      Use a different email
                    </Button>
                  </form>
                </CardContent>
              </>
            )}
            <div className="rounded-b-2xl border-t border-border/70 bg-muted/50 px-6 py-3 text-center text-xs text-muted-foreground">
              Demo environment · Your data stays on this deployment
            </div>
          </Card>

          <button
            onClick={() => navigate("/")}
            className="mx-auto mt-5 flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <UserX className="size-3.5" /> Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
