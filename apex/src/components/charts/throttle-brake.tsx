"use client";

import { useMemo } from "react";
import { line, curveStepAfter, curveMonotoneX } from "d3-shape";
import type { Lap } from "@/lib/data/types";
import { ChartFrame } from "./chart-frame";

type Props = { lap: Lap; scrubIndex: number };

const WIDTH = 880;
const HEIGHT = 260;
const MARGIN = { t: 36, r: 24, b: 30, l: 48 };

export function ThrottleBrake({ lap, scrubIndex }: Props) {
  const t = lap.telemetry;
  const innerW = WIDTH - MARGIN.l - MARGIN.r;
  const innerH = HEIGHT - MARGIN.t - MARGIN.b;
  const xMax = t.distance[t.distance.length - 1] ?? 1;
  const yMax = 100;

  const { thrPath, thrFill, brkPath, brakeZones, scrubX } = useMemo(() => {
    const pts = t.distance.map((d, i) => ({
      x: (d / xMax) * innerW,
      thr: innerH - ((t.throttle[i] ?? 0) / yMax) * innerH,
      brk: innerH - ((t.brake[i] ?? 0) * 100 / yMax) * innerH,
    }));

    const thrLine = line<(typeof pts)[number]>()
      .x((p) => p.x)
      .y((p) => p.thr)
      .curve(curveMonotoneX);

    const brkLine = line<(typeof pts)[number]>()
      .x((p) => p.x)
      .y((p) => p.brk)
      .curve(curveStepAfter);

    const thrD = thrLine(pts) ?? "";
    const thrF = `${thrD} L ${pts[pts.length - 1]?.x ?? 0} ${innerH} L 0 ${innerH} Z`;
    const brkD = brkLine(pts) ?? "";

    /* Contiguous brake bands so the eye picks up brake zones at a glance */
    const zones: Array<{ x: number; w: number }> = [];
    let start: number | null = null;
    for (let i = 0; i < t.brake.length; i++) {
      const on = (t.brake[i] ?? 0) > 0;
      if (on && start == null) start = i;
      if (!on && start != null) {
        zones.push({
          x: (t.distance[start] / xMax) * innerW,
          w: ((t.distance[i] - t.distance[start]) / xMax) * innerW,
        });
        start = null;
      }
    }
    if (start != null) {
      zones.push({
        x: (t.distance[start] / xMax) * innerW,
        w: ((t.distance[t.distance.length - 1] - t.distance[start]) / xMax) * innerW,
      });
    }

    const i = Math.max(0, Math.min(pts.length - 1, scrubIndex));
    return {
      thrPath: thrD,
      thrFill: thrF,
      brkPath: brkD,
      brakeZones: zones,
      scrubX: pts[i]?.x ?? 0,
    };
  }, [t.distance, t.throttle, t.brake, scrubIndex, innerW, innerH, xMax]);

  const throttleNow = t.throttle[scrubIndex] ?? 0;
  const isBrakingNow = (t.brake[scrubIndex] ?? 0) > 0;

  return (
    <ChartFrame
      width={WIDTH}
      height={HEIGHT}
      margin={MARGIN}
      kicker="CH_03 // THROTTLE_VS_BRAKE"
      bigValue={
        isBrakingNow
          ? `${throttleNow.toFixed(0)} · BRK`
          : throttleNow.toFixed(0)
      }
      bigUnit="%"
      yMax={yMax}
      xMax={xMax}
      yTicks={[0, 25, 50, 75, 100]}
      scrubX={scrubX}
    >
      <defs>
        <linearGradient id="thr-fade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7bf2b8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7bf2b8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Brake zones — vertical red bands */}
      {brakeZones.map((z, i) => (
        <rect
          key={i}
          x={z.x}
          y={0}
          width={z.w}
          height={MARGIN.b ? HEIGHT - MARGIN.t - MARGIN.b : 200}
          fill="#ff1801"
          opacity={0.07}
        />
      ))}

      <path d={thrFill} fill="url(#thr-fade)" />
      <path d={thrPath} fill="none" stroke="#7bf2b8" strokeWidth={1.6} />
      <path
        d={brkPath}
        fill="none"
        stroke="#ff1801"
        strokeWidth={1.4}
        strokeOpacity={0.85}
      />
    </ChartFrame>
  );
}
