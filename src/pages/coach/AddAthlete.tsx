import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGIONS, SPORTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

export default function AddAthlete() {
  const navigate = useNavigate();
  const createAthlete = useMutation(api.athletes.create);

  const [name, setName] = useState("");
  const [age, setAge] = useState("15");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [region, setRegion] = useState<string>("");
  const [schoolName, setSchoolName] = useState("");
  const [sportInterest, setSportInterest] = useState<string>("");
  const [heightCm, setHeightCm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Please enter the athlete's full name.");
    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum < 10 || ageNum > 19) return setError("Age must be between 10 and 19.");
    if (!region) return setError("Please select a region.");

    setIsSaving(true);
    try {
      const id = await createAthlete({
        name: name.trim(),
        age: ageNum,
        gender,
        region,
        schoolName: schoolName.trim() || undefined,
        sportInterest: sportInterest || undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
      });
      toast.success("Athlete registered", {
        description: `${name.trim()} is ready for their first test.`,
      });
      navigate(`/coach/test/record?athlete=${id}`);
    } catch (err) {
      console.error(err);
      setError("Could not save the athlete. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <AppShell role="coach" title="Add Athlete" subtitle="Register an athlete once — all tests stay on their profile.">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/coach/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Arjun Patil" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min={10}
                    max={19}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition cursor-pointer",
                          gender === g
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Benchmarks are gender- and age-specific.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Region *</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Input id="school" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Zilla Parishad Vidyalaya" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sport interest</Label>
                  <Select value={sportInterest} onValueChange={setSportInterest}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={120}
                    max={210}
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="e.g. 160"
                  />
                  <p className="text-xs text-muted-foreground">Improves AI jump-height calibration.</p>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-col gap-2 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" className="rounded-full">
                  <Link to="/coach/dashboard">Cancel</Link>
                </Button>
                <Button type="submit" className="rounded-full" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
                  Save athlete
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
