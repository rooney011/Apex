"use client";

import { useMemo } from "react";
import { line, curveMonotoneX } from "d3-shape";
import type { Lap } from "@/lib/data/types";
import { ChartFrame } from "./chart-frame";

type Props = { lap: Lap; scrubIndex: number };

const WIDTH = 880;
const HEIGHT = 260;
const MARGIN = { t: 36, r: 24, b: 30, l: 48 };

/* FastF1 only exposes brake as 0/1 — there's no analog pressure trace.
   We synthesise a pressure-like signal by combining the binary brake state
   with the rate of speed loss, so braking zones show as humps, not stripes.
   Reads as "PRESSURE" for visual purposes even though it's derived. */
export function BrakePressure({ lap, scrubIndex }: Props) {
  const t = lap.telemetry;
  const innerW = WIDTH - MARGIN.l - MARGIN.r;
  const innerH = HEIGHT - MARGIN.t - MARGIN.b;
  const xMax = t.distance[t.distance.length - 1] ?? 1;

  const { pressure, pressurePath, pressureFill, scrubX } = useMemo(() => {
    const n = t.distance.length;
    const raw = new Array<number>(n).fill(0);
    for (let i = 1; i < n; i++) {
      if ((t.brake[i] ?? 0) > 0) {
        const dD = Math.max(0.001, t.distance[i] - t.distance[i - 1]);
        const dv = (t.speed[i - 1] ?? 0) - (t.speed[i] ?? 0); // positive = slowing
        const decelKmH = Math.max(0, dv) / dD * 50; // amplification
        raw[i] = Math.min(100, decelKmH * 8);
      }
    }
    // Light smoothing so peaks aren't single-sample spikes
    const smoothed = raw.map((_, i) => {
      let s = 0;
      let c = 0;
      for (let k = i - 2; k <= i + 2; k++) {
        if (k >= 0 && k < n) {
          s += raw[k];
          c += 1;
        }
      }
      return s / c;
    });

    const pts = t.distance.map((d, i) => ({
      x: (d / xMax) * innerW,
      y: innerH - (smoothed[i] / 100) * innerH,
    }));
    const lineGen = line<(typeof pts)[number]>()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveMonotoneX);
    const d = lineGen(pts) ?? "";
    const f = `${d} L ${pts[pts.length - 1]?.x ?? 0} ${innerH} L 0 ${innerH} Z`;

    const i = Math.max(0, Math.min(pts.length - 1, scrubIndex));
    return {
      pressure: smoothed,
      pressurePath: d,
      pressureFill: f,
      scrubX: pts[i]?.x ?? 0,
    };
  }, [t.distance, t.brake, t.speed, scrubIndex, innerW, innerH, xMax]);

  const pNow = pressure[scrubIndex] ?? 0;

  return (
    <ChartFrame
      width={WIDTH}
      height={HEIGHT}
      margin={MARGIN}
      kicker="CH_04 // BRAKE_PRESSURE_PROFILE"
      bigValue={pNow.toFixed(0)}
      bigUnit="pct"
      yMax={100}
      xMax={xMax}
      yTicks={[0, 25, 50, 75, 100]}
      scrubX={scrubX}
    >
      <defs>
        <linearGradient id="brk-fade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff1801" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ff1801" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={pressureFill} fill="url(#brk-fade)" />
      <path
        d={pressurePath}
        fill="none"
        stroke="#ff1801"
        strokeWidth={1.6}
        style={{ filter: "drop-shadow(0 0 4px rgba(255,24,1,0.35))" }}
      />
    </ChartFrame>
  );
}
