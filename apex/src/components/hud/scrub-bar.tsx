"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { SkipBack, SkipForward } from "lucide-react";
import type { Lap } from "@/lib/data/types";
import { indexForDistance, useScrubStore } from "@/lib/store/scrub";
import { cn } from "@/lib/utils";

type Props = { lap: Lap };

export function ScrubBar({ lap }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrubDistance = useScrubStore((s) => s.scrubDistance);
  const setScrubDistance = useScrubStore((s) => s.setScrubDistance);
  const setScrubbing = useScrubStore((s) => s.setScrubbing);

  const totalDist = lap.telemetry.distance[lap.telemetry.distance.length - 1] ?? 1;
  const totalMs = lap.lap_time_ms;

  const scrubPct = Math.max(0, Math.min(1, scrubDistance / totalDist));
  const idx = useMemo(
    () => indexForDistance(lap.telemetry.distance, scrubDistance),
    [lap.telemetry.distance, scrubDistance],
  );
  const elapsedMs = Math.round((scrubPct) * totalMs);

  /* Convert pointer X within the track to a distance, then commit to store. */
  const pointerToDistance = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setScrubDistance(pct * totalDist);
    },
    [setScrubDistance, totalDist],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setScrubbing(true);
      pointerToDistance(e.clientX);
    },
    [pointerToDistance, setScrubbing],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return;
      pointerToDistance(e.clientX);
    },
    [pointerToDistance],
  );

  const onPointerUp = useCallback(() => setScrubbing(false), [setScrubbing]);

  /* Keyboard nudges: ← → step ±1%, shift= step ±5%. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const step = totalDist * (e.shiftKey ? 0.05 : 0.01);
      if (e.key === "ArrowRight") {
        setScrubDistance(Math.min(totalDist, scrubDistance + step));
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setScrubDistance(Math.max(0, scrubDistance - step));
        e.preventDefault();
      } else if (e.key === "Home") {
        setScrubDistance(0);
        e.preventDefault();
      } else if (e.key === "End") {
        setScrubDistance(totalDist);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrubDistance, totalDist, setScrubDistance]);

  return (
    <div className="panel p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
      {/* Controls */}
      <button
        type="button"
        onClick={() => setScrubDistance(0)}
        className="size-7 sm:size-8 grid place-items-center rounded text-apex-muted hover:text-foreground hover:bg-apex-surface-2 shrink-0"
        aria-label="restart"
      >
        <SkipBack className="size-4" strokeWidth={1.6} />
      </button>
      <button
        type="button"
        onClick={() => setScrubDistance(totalDist)}
        className="size-7 sm:size-8 grid place-items-center rounded text-apex-muted hover:text-foreground hover:bg-apex-surface-2 shrink-0"
        aria-label="end"
      >
        <SkipForward className="size-4" strokeWidth={1.6} />
      </button>

      <span className="label-mono w-14 sm:w-16 shrink-0 text-foreground !text-[10px] sm:!text-[11px]">
        {fmtClock(elapsedMs)}
      </span>

      {/* Track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative flex-1 h-9 cursor-pointer select-none rounded-md bg-apex-bg border border-apex-border overflow-hidden"
      >
        {/* Sector ticks */}
        <SectorTicks lap={lap} totalDist={totalDist} />

        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 bg-apex-red/12"
          style={{ width: `${scrubPct * 100}%` }}
        />

        {/* Handle */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 size-5 rounded-full bg-apex-red glow-red",
            "pointer-events-none",
            "transition-[box-shadow] duration-150",
          )}
          style={{ left: `calc(${scrubPct * 100}% - 10px)` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-apex-red pointer-events-none"
          style={{ left: `${scrubPct * 100}%` }}
        />
      </div>

      <span className="label-mono w-14 sm:w-16 shrink-0 text-right !text-[10px] sm:!text-[11px]">
        {fmtClock(totalMs)}
      </span>

      <div className="hidden md:flex items-center gap-3 pl-3 border-l border-apex-border">
        <div className="text-right">
          <p className="label-mono">SAMPLE</p>
          <p className="font-mono text-xs text-foreground mt-0.5">
            {idx} / {lap.telemetry.samples - 1}
          </p>
        </div>
        <div className="text-right">
          <p className="label-mono">DIST</p>
          <p className="font-mono text-xs text-foreground mt-0.5">
            {(scrubDistance / 1000).toFixed(3)} km
          </p>
        </div>
      </div>
    </div>
  );
}

function SectorTicks({ lap }: { lap: Lap; totalDist: number }) {
  const totalMs = lap.lap_time_ms;
  const s = lap.sectors;
  if (s.s1_ms == null || s.s2_ms == null) return null;
  const ticks = [s.s1_ms, s.s1_ms + s.s2_ms];

  return (
    <>
      {ticks.map((ms, i) => (
        <div
          key={i}
          className="absolute inset-y-0 w-px bg-apex-border"
          style={{ left: `${(ms / totalMs) * 100}%` }}
          title={`Sector ${i + 1} end`}
        />
      ))}
    </>
  );
}

function fmtClock(ms: number): string {
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, "0")}`;
}
