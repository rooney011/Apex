"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Download, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { line, curveMonotoneX } from "d3-shape";
import type { Lap } from "@/lib/data/types";
import { useScrubStore } from "@/lib/store/scrub";
import { FingerprintSVG } from "./fingerprint-svg";

type Props = {
  lap: Lap | null;
  onClose: () => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

const POSTER_AVAILABLE: Record<string, string> = {
  ham_2020_silverstone_q: "/fingerprints/ham_2020_silverstone_q_poster.png",
};

export function LapInspector({ lap, onClose }: Props) {
  const setActiveLapId = useScrubStore((s) => s.setActiveLapId);

  /* esc to dismiss + scroll lock while open */
  useEffect(() => {
    if (!lap) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lap, onClose]);

  return (
    <AnimatePresence>
      {lap && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-apex-bg/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[560px] bg-apex-surface border-l border-apex-border shadow-[-30px_0_60px_rgba(0,0,0,0.5)] overflow-y-auto"
          >
            <InspectorBody
              lap={lap}
              onClose={onClose}
              onOpenTelemetry={() => {
                setActiveLapId(lap.id);
                onClose();
              }}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function InspectorBody({
  lap,
  onClose,
  onOpenTelemetry,
}: {
  lap: Lap;
  onClose: () => void;
  onOpenTelemetry: () => void;
}) {
  const poster = POSTER_AVAILABLE[lap.id];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="label-mono text-apex-red">LAP_INSPECTOR</p>
          <h2 className="font-sans text-2xl font-bold tracking-tight mt-1">
            {lap.driver_name}
          </h2>
          <p className="label-mono mt-1">
            {lap.team || "—"} · {lap.race} {lap.year}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-9 grid place-items-center rounded text-apex-muted hover:text-foreground hover:bg-apex-surface-2 transition-colors"
          aria-label="close"
        >
          <X className="size-4" strokeWidth={1.6} />
        </button>
      </div>

      {/* Big fingerprint */}
      <div
        className="relative aspect-square w-full rounded bg-apex-bg overflow-hidden grid-overlay"
      >
        <FingerprintSVG lap={lap} size={520} segments={240} />
        <div
          className="absolute left-0 top-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${lap.accent} 50%, transparent 100%)`,
            boxShadow: `0 0 18px ${lap.accent}88`,
          }}
        />
      </div>

      {/* Sectors */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { id: "S1", ms: lap.sectors.s1_ms },
          { id: "S2", ms: lap.sectors.s2_ms },
          { id: "S3", ms: lap.sectors.s3_ms },
        ].map((s) => (
          <div key={s.id} className="panel-inset px-3 py-2.5">
            <p className="label-mono">SECTOR_{s.id.slice(1)}</p>
            <p className="font-mono text-lg font-bold mt-0.5">
              {s.ms == null ? "—" : (s.ms / 1000).toFixed(3)}
              <span className="text-apex-muted text-xs font-normal ml-1">s</span>
            </p>
          </div>
        ))}
      </div>

      {/* Mini velocity curve */}
      <div className="panel mt-4 p-4">
        <p className="label-mono mb-2">VELOCITY_CURVE · {lap.telemetry.samples} samples</p>
        <MiniVelocity lap={lap} />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat
          label="PEAK"
          value={Math.round(Math.max(...lap.telemetry.speed)).toString()}
          unit="km/h"
        />
        <Stat label="COMPOUND" value={lap.compound ?? "—"} unit="" />
        <Stat
          label="LAP"
          value={lap.lap_number?.toString() ?? "—"}
          unit="n"
        />
      </div>

      {/* Era + accent */}
      <div
        className="mt-5 rounded border px-4 py-3"
        style={{
          borderColor: lap.accent + "55",
          background: lap.accent + "10",
        }}
      >
        <p className="label-mono" style={{ color: lap.accent }}>
          ERA · {lap.era}
        </p>
        <p className="font-serif text-[13px] text-foreground/80 mt-1 leading-snug">
          Accent {lap.accent.toUpperCase()} reserved for this lap across the
          gallery and telemetry views.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-6">
        <button
          type="button"
          onClick={onOpenTelemetry}
          className="group flex items-center justify-center gap-3 rounded-md bg-apex-red text-white px-5 py-3 glow-red transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <span className="label-mono !text-white">OPEN_IN_TELEMETRY</span>
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            strokeWidth={2}
          />
        </button>
        {poster && (
          <Link
            href={poster}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded border border-apex-border px-4 py-2.5 text-foreground hover:bg-apex-surface-2 transition-colors"
          >
            <Download className="size-3.5" strokeWidth={1.6} />
            <span className="label-mono">DOWNLOAD_POSTER · 11×14</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function MiniVelocity({ lap }: { lap: Lap }) {
  const W = 480;
  const H = 80;
  const xMax = lap.telemetry.distance[lap.telemetry.distance.length - 1] ?? 1;
  const yMax = Math.max(...lap.telemetry.speed);

  const { pathD, fillD } = useMemo(() => {
    const pts = lap.telemetry.distance.map((d, i) => ({
      x: (d / xMax) * W,
      y: H - ((lap.telemetry.speed[i] ?? 0) / yMax) * H,
    }));
    const g = line<{ x: number; y: number }>()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveMonotoneX);
    const d = g(pts) ?? "";
    return {
      pathD: d,
      fillD: `${d} L ${pts[pts.length - 1]?.x ?? 0} ${H} L 0 ${H} Z`,
    };
  }, [lap, xMax, yMax]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-20">
      <defs>
        <linearGradient id={`mini-${lap.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lap.accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={lap.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#mini-${lap.id})`} />
      <path d={pathD} fill="none" stroke={lap.accent} strokeWidth={1.4} />
    </svg>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="panel-inset px-3 py-2.5">
      <p className="label-mono">{label}</p>
      <p className="font-mono text-base font-bold mt-0.5">
        {value}
        {unit && (
          <span className="text-apex-muted text-[10px] font-normal ml-1 tracking-widest">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}
