"use client";

import { Activity, Compass, Flame, Loader2, Radar, Slash } from "lucide-react";
import { useEffect, useMemo } from "react";
import { BrakePressure } from "@/components/charts/brake-pressure";
import { GLoadDiagram } from "@/components/charts/g-load";
import { SectorsView } from "@/components/charts/sectors-view";
import { ThrottleBrake } from "@/components/charts/throttle-brake";
import { VelocityCurve } from "@/components/charts/velocity-curve";
import { useLap } from "@/lib/data/client";
import type { Lap } from "@/lib/data/types";
import { indexForDistance, useScrubStore } from "@/lib/store/scrub";
import { DiagnosticStatus } from "./diagnostic-status";
import { LapPicker } from "./lap-picker";
import { ScrubBar } from "./scrub-bar";
import { SequentialLog } from "./sequential-log";

type Props = { initialLap: Lap };

export function TelemetryView({ initialLap }: Props) {
  const activeLapId = useScrubStore((s) => s.activeLapId);
  const activeChannel = useScrubStore((s) => s.activeChannel);
  const scrubDistance = useScrubStore((s) => s.scrubDistance);
  const setScrubDistance = useScrubStore((s) => s.setScrubDistance);

  /* SSR delivered initialLap (HERO_LAP_ID). Client query swaps when user picks
     a different lap. */
  const { data, isFetching } = useLap(activeLapId);
  const lap = data ?? initialLap;

  const idx = useMemo(
    () => indexForDistance(lap.telemetry.distance, scrubDistance),
    [lap.telemetry.distance, scrubDistance],
  );

  /* When the active lap changes, default the scrub to the moment of peak speed —
     more dramatic than starting at the line and gives every chart something
     interesting to show on first paint. */
  useEffect(() => {
    let peakI = 0;
    let peak = -Infinity;
    for (let i = 0; i < lap.telemetry.speed.length; i++) {
      if (lap.telemetry.speed[i] > peak) {
        peak = lap.telemetry.speed[i];
        peakI = i;
      }
    }
    setScrubDistance(lap.telemetry.distance[peakI] ?? 0);
  }, [lap.id, lap.telemetry.distance, lap.telemetry.speed, setScrubDistance]);

  return (
    <div className="relative min-h-full">
      {/* Accent strip */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${lap.accent} 50%, transparent 100%)`,
          boxShadow: `0 0 18px ${lap.accent}66`,
        }}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Header row */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 sm:gap-6 mb-5 sm:mb-6">
          <div>
            <p className="label-mono text-apex-red flex items-center gap-2">
              MODULE // {channelKicker(activeChannel)}
              {isFetching && (
                <Loader2 className="size-3 animate-spin" strokeWidth={2} />
              )}
            </p>
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-2">
              {lap.driver_name}
            </h1>
            <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] text-apex-muted mt-2 uppercase">
              {lap.team || "—"} · {lap.race} {lap.year} · SESSION {lap.session}
            </p>
            <div
              className="inline-block mt-3 rounded border px-2.5 py-1 font-mono text-[10px] tracking-[0.18em]"
              style={{
                borderColor: lap.accent + "55",
                color: lap.accent,
                background: lap.accent + "10",
              }}
            >
              {lap.era}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="panel px-4 sm:px-5 py-3 min-w-0 sm:min-w-[200px]">
              <p className="label-mono">LAP_TIME</p>
              <p
                className="font-mono text-2xl sm:text-3xl font-bold mt-1 text-glow-red"
                style={{ color: lap.accent }}
              >
                {lap.lap_time_str}
              </p>
              <p className="label-mono mt-1">
                LAP {lap.lap_number ?? "—"} · {lap.compound ?? "—"}
              </p>
            </div>
            <LapPicker />
          </div>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-3 sm:gap-4">
          {/* Centre column — active chart */}
          <div className="flex flex-col gap-3">
            <div className="panel p-4">
              <ActiveChart channel={activeChannel} lap={lap} scrubIndex={idx} />
            </div>

            {/* Secondary readouts always visible */}
            <div className="grid grid-cols-2 gap-3">
              <ChannelMini
                channelId="velocity"
                label="VELOCITY"
                value={`${(lap.telemetry.speed[idx] ?? 0).toFixed(1)}`}
                unit="km/h"
                icon={Activity}
              />
              <ChannelMini
                channelId="throttle"
                label="THROTTLE"
                value={`${(lap.telemetry.throttle[idx] ?? 0).toFixed(0)}`}
                unit="%"
                icon={Flame}
              />
              <ChannelMini
                channelId="braking"
                label="BRAKE"
                value={(lap.telemetry.brake[idx] ?? 0) > 0 ? "ON" : "OFF"}
                unit=""
                icon={Slash}
              />
              <ChannelMini
                channelId="gforce"
                label="GEAR · RPM"
                value={`${lap.telemetry.ngear[idx] ?? "—"} · ${
                  lap.telemetry.rpm[idx] != null
                    ? Math.round(lap.telemetry.rpm[idx]!).toLocaleString()
                    : "—"
                }`}
                unit=""
                icon={Compass}
              />
            </div>

            <SequentialLog lap={lap} rows={8} />
          </div>

          {/* Right column */}
          <DiagnosticStatus lap={lap} />
        </div>

        {/* Scrub bar pinned at the bottom of the view */}
        <div className="mt-3 sm:mt-4">
          <ScrubBar lap={lap} />
        </div>

        {/* Hint — only on screens with the keyboard hint relevance */}
        <p className="label-mono mt-3 text-apex-muted/70 hidden sm:block">
          tip · ←/→ to step ±1%, hold shift for ±5%, home/end to snap
        </p>
      </div>
    </div>
  );
}

function ActiveChart({
  channel,
  lap,
  scrubIndex,
}: {
  channel: ReturnType<typeof useScrubStore.getState>["activeChannel"];
  lap: Lap;
  scrubIndex: number;
}) {
  switch (channel) {
    case "velocity":
      return <VelocityCurve lap={lap} scrubIndex={scrubIndex} />;
    case "throttle":
      return <ThrottleBrake lap={lap} scrubIndex={scrubIndex} />;
    case "braking":
      return <BrakePressure lap={lap} scrubIndex={scrubIndex} />;
    case "gforce":
      return <GLoadDiagram lap={lap} scrubIndex={scrubIndex} />;
    case "sectors":
      return <SectorsView lap={lap} scrubIndex={scrubIndex} />;
  }
}

function ChannelMini({
  label,
  value,
  unit,
  icon: Icon,
  channelId,
}: {
  channelId: string;
  label: string;
  value: string;
  unit: string;
  icon: typeof Radar;
}) {
  return (
    <div className="panel px-4 py-3 flex items-center gap-3">
      <Icon className="size-4 text-apex-red shrink-0" strokeWidth={1.6} />
      <div className="flex-1 min-w-0">
        <p className="label-mono">{label}</p>
        <p className="font-mono text-base font-bold mt-0.5">
          {value}
          {unit && (
            <span className="ml-1 text-[10px] font-normal text-apex-muted tracking-widest">
              {unit}
            </span>
          )}
        </p>
      </div>
      <p className="label-mono !text-[9px] text-apex-muted/60">{channelId}</p>
    </div>
  );
}

function channelKicker(c: string): string {
  switch (c) {
    case "velocity":
      return "CH_01 · VELOCITY";
    case "gforce":
      return "CH_02 · G_LOAD";
    case "throttle":
      return "CH_03 · THROTTLE";
    case "braking":
      return "CH_04 · BRAKING";
    case "sectors":
      return "CH_05 · SECTORS";
    default:
      return c;
  }
}
