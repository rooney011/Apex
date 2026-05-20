"use client";

import { useMemo } from "react";
import { Radio } from "lucide-react";
import Image from "next/image";
import { computeLateralG, readingAt } from "@/lib/chart/derive";
import type { Lap } from "@/lib/data/types";
import { indexForDistance, useScrubStore } from "@/lib/store/scrub";

type Props = { lap: Lap };

/* Right column on the telemetry view: cinematic photo placeholder + live
   readings + a diagnostic blurb that reacts to brake/throttle state. */
export function DiagnosticStatus({ lap }: Props) {
  const scrubDistance = useScrubStore((s) => s.scrubDistance);
  const idx = useMemo(
    () => indexForDistance(lap.telemetry.distance, scrubDistance),
    [lap.telemetry.distance, scrubDistance],
  );
  const r = readingAt(lap, idx);
  const latG = useMemo(() => computeLateralG(lap), [lap]);
  const lat = latG[idx] ?? 0;

  const status = inferStatus(r, lat);

  return (
    <div className="flex flex-col gap-3">
      {/* Cockpit photo */}
      <div className="panel relative overflow-hidden h-48">
        <Image
          src="/photos/01_wheel.png"
          alt="Formula 1 cockpit detail"
          fill
          sizes="(max-width: 1280px) 100vw, 320px"
          className="object-cover"
          priority
        />
        {/* Top kicker bar */}
        <div className="absolute inset-x-0 top-0 px-3 py-2 flex items-center justify-between bg-gradient-to-b from-apex-bg/85 to-transparent">
          <p className="label-mono text-apex-red flex items-center gap-1.5">
            <Radio className="size-3" strokeWidth={2} />
            FRONT_CAR_03 // COCKPIT_VIEW
          </p>
          <span className="label-mono !text-[9px] text-apex-green">LIVE_FEED</span>
        </div>
        {/* Bottom shade so the photo doesn't fight the next panel */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-apex-bg/95 to-transparent" />
      </div>

      {/* Live readouts panel */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="label-mono text-apex-red">DIAGNOSTIC_STATUS</p>
          <span className="label-mono !text-[9px] text-apex-green">SYNC_OK</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="SPEED" value={r.speed.toFixed(1)} unit="km/h" big />
          <Field label="LAT_G" value={lat.toFixed(2)} unit="g" />
          <Field label="THROTTLE" value={r.throttle.toFixed(0)} unit="%" />
          <Field
            label="BRAKE"
            value={r.brake > 0 ? "ON" : "OFF"}
            unit=""
            accent={r.brake > 0 ? "red" : "muted"}
          />
          <Field label="GEAR" value={r.gear?.toString() ?? "—"} unit="n" />
          <Field
            label="RPM"
            value={r.rpm != null ? Math.round(r.rpm).toLocaleString() : "—"}
            unit="rpm"
          />
          <Field label="DRS" value={drsLabel(r.drs)} unit="" />
          <Field
            label="DIST"
            value={(r.distance / 1000).toFixed(3)}
            unit="km"
          />
        </div>

        <div className="mt-4 pt-3 border-t border-apex-border">
          <p className="label-mono">SYSTEM_LOG</p>
          <p className="font-serif text-[12px] leading-snug text-foreground/85 mt-2">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  unit,
  big,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  big?: boolean;
  accent?: "red" | "muted";
}) {
  return (
    <div>
      <p className="label-mono">{label}</p>
      <p
        className={
          "font-mono font-bold mt-1 " +
          (big ? "text-2xl" : "text-base") +
          " " +
          (accent === "red"
            ? "text-apex-red text-glow-red"
            : accent === "muted"
            ? "text-apex-muted"
            : "text-foreground")
        }
      >
        {value}
        {unit && (
          <span className="ml-1 text-[10px] font-normal text-apex-muted tracking-widest">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function drsLabel(d: number | null | undefined): string {
  if (d == null) return "—";
  // FastF1 DRS values: 0/1 = off, 8/10/12/14 = on (varies)
  return d >= 8 ? "OPEN" : "CLOSED";
}

function inferStatus(
  r: ReturnType<typeof readingAt>,
  lat: number,
): string {
  if (r.brake > 0 && Math.abs(lat) > 1.5) {
    return `Trail-braking through a high-load corner. Lateral load ${lat.toFixed(
      2,
    )}g while brake pressure remains on — front tyres carrying combined load above optimum slip threshold.`;
  }
  if (r.brake > 0) {
    return `Braking. Decel zone — ${r.speed.toFixed(
      0,
    )} km/h, gear ${r.gear ?? "—"}. Pressure metrics within thermal limits.`;
  }
  if (Math.abs(lat) > 2.2) {
    return `Apex pass. ${Math.abs(lat).toFixed(
      2,
    )}g lateral; tyre temps holding inside operational window.`;
  }
  if (r.throttle >= 99) {
    return `Full throttle. ${r.speed.toFixed(
      0,
    )} km/h in gear ${r.gear ?? "—"}. ERS deployment optimal.`;
  }
  return `Cruise. ${r.speed.toFixed(0)} km/h at ${r.throttle.toFixed(
    0,
  )}% throttle. No diagnostic flags.`;
}
