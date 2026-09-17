import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TEST_META, TEST_TYPES, type TestType } from "@/lib/constants";
import { POSE_CONNECTIONS } from "@/lib/pose-draw";
import { loadPoseLandmarker, scoreTimeline, type Frame } from "@/lib/pose";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CircleStop,
  Loader2,
  Play,
  ScanLine,
  TriangleAlert,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { toast } from "sonner";

const DURATIONS: Record<TestType, number> = {
  vertical_jump: 4,
  sprint_40m: 10,
  situps_30s: 32,
  shuttle_run: 14,
};

type Phase = "select" | "capture" | "processing";
type CameraState = "idle" | "starting" | "live" | "error";

export default function RecordTest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const athletes = useQuery(api.athletes.listMine);

  const [athleteId, setAthleteId] = useState<string>(searchParams.get("athlete") ?? "");
  const [testType, setTestType] = useState<TestType | "">("");
  const [phase, setPhase] = useState<Phase>("select");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [framesSeen, setFramesSeen] = useState(0);
  const [poseReady, setPoseReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const startTimeRef = useRef(0);
  const framesRef = useRef<Frame[]>([]);
  const hipSamplesRef = useRef<number[]>([]);
  const angleSamplesRef = useRef<number[]>([]);
  const recordingRef = useRef(false);
  const doneRef = useRef(false);
  const heightRef = useRef<number | undefined>(undefined);

  const tt = (testType ?? "vertical_jump") as TestType;
  const isUploadEntry = searchParams.get("mode") === "upload";

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const resetCaptureState = useCallback(() => {
    framesRef.current = [];
    hipSamplesRef.current = [];
    angleSamplesRef.current = [];
    recordingRef.current = false;
    doneRef.current = false;
    setFramesSeen(0);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const landmarker = await loadPoseLandmarker();
      landmarkerRef.current = landmarker;
      setPoseReady(true);
      setCameraState("live");
      startTimeRef.current = performance.now();
      doneRef.current = false;
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error("Camera/pose init failed:", err);
      setCameraState("error");
      setCameraError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access and try again."
          : "Could not access the camera or load the pose AI model. Check the connection and try again.",
      );
    }
  };

  // Main per-frame loop: pose inference, skeleton overlay, sample collection.
  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker) return;

    const nowMs = performance.now();
    const t = (nowMs - startTimeRef.current) / 1000;

    let lm: { x: number; y: number }[] | undefined;
    if (video.readyState >= 2) {
      try {
        const result = landmarker.detectForVideo(video, nowMs);
        lm = result?.landmarks?.[0];
      } catch {
        lm = undefined;
      }
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (lm) {
        ctx.strokeStyle = "rgba(255, 107, 53, 0.9)";
        ctx.lineWidth = 3;
        for (const [a, b] of POSE_CONNECTIONS) {
          const pa = lm[a];
          const pb = lm[b];
          if (pa && pb) {
            ctx.beginPath();
            ctx.moveTo(pa.x * canvas.width, pa.y * canvas.height);
            ctx.lineTo(pb.x * canvas.width, pb.y * canvas.height);
            ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(0, 200, 83, 0.95)";
        for (const p of lm) {
          ctx.beginPath();
          ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (lm && recordingRef.current) {
      const hip = lm[23];
      const shoulder = lm[11];
      const knee = lm[25];
      const ankle = lm[27];
      if (hip && shoulder && knee && ankle) {
        const kp = (p: { x: number; y: number }) => ({ x: p.x, y: p.y, score: 1 });
        if (testTypeRef.current === "vertical_jump") hipSamplesRef.current.push(hip.y);
        if (testTypeRef.current === "situps_30s") {
          const a1 = Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x);
          const a2 = Math.atan2(knee.y - hip.y, knee.x - hip.x);
          let deg = Math.abs((a1 - a2) * (180 / Math.PI));
          if (deg > 180) deg = 360 - deg;
          angleSamplesRef.current.push(deg);
        }
        framesRef.current.push({ t, hip: kp(hip), shoulder: kp(shoulder), knee: kp(knee), ankle: kp(ankle) });
      }
      setFramesSeen((n) => n + 1);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, []);
  const testTypeRef = useRef<TestType>("vertical_jump");
  testTypeRef.current = (testType ?? "vertical_jump") as TestType;

  const beginRecording = () => {
    if (!testType) return;
    const athlete = athletes?.find((a) => a._id === athleteId);
    heightRef.current = athlete?.heightCm;
    resetCaptureState();
    setCountdown(3);
  };

  // Countdown → start recording
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      startTimeRef.current = performance.now();
      recordingRef.current = true;
      doneRef.current = false;
      setRecording(true);
      setRemaining(DURATIONS[tt]);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, tt]);

  // Auto-stop when the capture duration elapses
  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => {
      const t = (performance.now() - startTimeRef.current) / 1000;
      setRemaining(Math.max(0, Math.ceil(DURATIONS[tt] - t)));
      if (t >= DURATIONS[tt] && !doneRef.current) {
        doneRef.current = true;
        recordingRef.current = false;
        stopCamera();
        setRecording(false);
        setPhase("processing");
      }
    }, 100);
    return () => clearInterval(interval);
  }, [recording, stopCamera, tt]);

  // After processing, compute the score and move to the results screen
  useEffect(() => {
    if (phase !== "processing") return;
    const timer = setTimeout(() => {
      const frames = framesRef.current;
      const result = scoreTimeline(tt, frames, heightRef.current);
      if (!result || result.rawScore <= 0 || frames.length < 5) {
        toast.error("Couldn't detect a clear pose. Try again with the full body in frame.");
        resetCaptureState();
        setCameraState("idle");
        setPhase("capture");
        return;
      }
      navigate(
        `/coach/test/results/pending?athlete=${athleteId}&type=${tt}&score=${result.rawScore}`,
        {
          state: {
            rawScore: result.rawScore,
            details: result.details,
            athleteId,
            testType: tt,
            frames: frames.length,
            confidence: result.confidence,
          },
        },
      );
    }, 1400);
    return () => clearTimeout(timer);
  }, [phase, tt, athleteId, navigate, resetCaptureState]);

  const selectedAthlete = athletes?.find((a) => a._id === athleteId);
  const canStart = Boolean(athleteId && testType) && cameraState === "live" && poseReady;

  if (phase === "processing") {
    return (
      <AppShell role="coach"      title="Scoring in progress…" subtitle="The engine is analyzing the capture — this takes a moment.">
        <div className="grid place-items-center rounded-2xl border border-border/70 bg-card px-6 py-20 text-center">
          <div className="relative">
            <Loader2 className="size-12 animate-spin text-primary" />
            <ScanLine className="absolute -right-2 -top-2 size-5 text-secondary" />
          </div>
          <p className="mt-6 font-display text-lg font-semibold">Analyzing movement</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tracking the skeleton across {framesSeen} frames, computing the performance signal, and comparing it
            against age-{selectedAthlete?.age ?? ""} benchmarks.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="coach"
      title="New Assessment"
      subtitle="Standardized capture — Scoutify measures, benchmarks, and files the result."
    >
      {phase === "select" ? (
        <div className="mx-auto max-w-3xl space-y-5">
          <Link
            to="/coach/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>

          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="mb-2 text-sm font-semibold">Step 1 · Select athlete</p>
                {!athletes ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : athletes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    No athletes yet —{" "}
                    <Link to="/coach/athletes/new" className="font-medium text-primary hover:underline">
                      add one first
                    </Link>
                    .
                  </div>
                ) : (
                  <Select value={athleteId} onValueChange={setAthleteId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose athlete" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.map((a) => (
                        <SelectItem key={a._id} value={a._id}>
                          {a.name} · {a.age}y {a.gender === "male" ? "M" : "F"} · {a.region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Step 2 · Choose the test</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TEST_TYPES.map((type) => {
                    const meta = TEST_META[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTestType(type)}
                        className={cn(
                          "cursor-pointer rounded-2xl border p-4 text-left transition",
                          testType === type
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display font-semibold">{meta.label}</span>
                          <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                            {meta.unit}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{meta.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Tip: place the phone 3–4m away, full body in frame, even lighting.
                </p>
                <Button className="rounded-full" disabled={!athleteId || !testType} onClick={() => setPhase("capture")}>
                  Continue <ArrowRight className="ml-1.5 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          <Link
            to="/coach/dashboard"
            onClick={stopCamera}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Cancel and go back
          </Link>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <div className="relative aspect-video w-full bg-black">
              <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 size-full" />

              {cameraState === "live" && !recording && countdown === null && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="rounded-2xl bg-black/55 px-5 py-3 text-center text-sm text-white backdrop-blur-sm">
                    <Camera className="mx-auto mb-1 size-5" />
                    Stand 3–4m back · full body in frame
                  </div>
                </div>
              )}

              {countdown !== null && (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <span className="font-display text-8xl font-extrabold text-white drop-shadow-lg">{countdown}</span>
                </div>
              )}

              {recording && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-600/90 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg">
                  <span className="size-2.5 animate-pulse rounded-full bg-white" />
                  REC {remaining}s
                </div>
              )}

              {recording && testType === "situps_30s" && (
                <div className="absolute right-4 top-4 rounded-full bg-secondary/90 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg">
                  {angleSamplesRef.current.length} samples
                </div>
              )}

              {cameraState === "idle" && (
                <div className="absolute inset-0 grid place-items-center bg-secondary/95 text-center">
                  <div className="px-6">
                    <Video className="mx-auto size-10 text-white/80" />
                    <p className="mt-3 font-display text-lg font-semibold text-white">Ready to record</p>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-white/70">
                      {selectedAthlete?.name ?? "The athlete"} · {testType ? TEST_META[tt].label : ""}
                    </p>
                    <Button className="mt-5 rounded-full bg-white text-secondary hover:bg-white/90" onClick={startCamera}>
                      <Play className="mr-2 size-4" /> Start camera
                    </Button>
                  </div>
                </div>
              )}
              {cameraState === "idle" && isUploadEntry && (
                <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/40 px-4 py-3 text-center text-xs text-white/70 backdrop-blur-sm">
                  Prefer to work from footage you already have? Upload support is on the capture roadmap — recording
                  today produces the identical scored result.
                </div>
              )}
              {cameraState === "starting" && (
                <div className="absolute inset-0 grid place-items-center bg-secondary/95 text-center text-white">
                  <div>
                    <Loader2 className="mx-auto size-8 animate-spin" />
                    <p className="mt-3 text-sm">Starting camera & loading pose AI…</p>
                  </div>
                </div>
              )}
              {cameraState === "error" && (
                <div className="absolute inset-0 grid place-items-center bg-secondary/95 p-6 text-center text-white">
                  <div>
                    <TriangleAlert className="mx-auto size-10 text-orange-300" />
                    <p className="mt-3 font-display text-lg font-semibold">Camera unavailable</p>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-white/75">{cameraError}</p>
                    <Button
                      variant="outline"
                      className="mt-5 rounded-full border-white/30 text-white hover:bg-white/10"
                      onClick={startCamera}
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <CardContent className="flex flex-col items-center gap-3 p-5">
              <div className="flex w-full items-center justify-between text-sm">
                <span className="font-medium">{selectedAthlete?.name}</span>
                <span className="text-muted-foreground">
                  {testType ? TEST_META[tt].label : ""} · {DURATIONS[tt]}s capture
                </span>
              </div>
              {recording ? (
                <Button
                  variant="destructive"
                  className="w-full rounded-full"
                  onClick={() => {
                    doneRef.current = true;
                    recordingRef.current = false;
                    stopCamera();
                    setRecording(false);
                    setPhase("processing");
                  }}
                >
                  <CircleStop className="mr-2 size-4" /> Stop now
                </Button>
              ) : (
                <Button className="w-full rounded-full" disabled={!canStart || countdown !== null} onClick={beginRecording}>
                  <Play className="mr-2 size-4" /> {countdown !== null ? "Get ready…" : "Start test"}
                </Button>
              )}
              {!poseReady && cameraState === "live" && (
                <p className="text-xs text-muted-foreground">Loading pose AI model…</p>
              )}
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How this test is measured</p>
            <p className="mt-1 leading-6">
              {testType === "vertical_jump" &&
                "The engine tracks the athlete's hip through the crouch and jump, then converts peak hip rise to centimetres using the athlete's recorded height."}
              {testType === "situps_30s" &&
                "The engine measures the shoulder–hip–knee torso angle on every frame and counts complete up-down cycles within the 30-second window."}
              {testType === "sprint_40m" &&
                "Timing runs across the capture window while the engine tracks body movement — the measured phase becomes the sprint time."}
              {testType === "shuttle_run" &&
                "The engine times the movement phase across the shuttle course and automatically discounts pauses at the turn lines."}
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
