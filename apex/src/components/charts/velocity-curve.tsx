"use client";

import { useMemo } from "react";
import { line, curveMonotoneX } from "d3-shape";
import type { Lap } from "@/lib/data/types";
import { ChartFrame } from "./chart-frame";

type Props = { lap: Lap; scrubIndex: number };

const WIDTH = 880;
const HEIGHT = 260;
const MARGIN = { t: 36, r: 24, b: 30, l: 48 };

export function VelocityCurve({ lap, scrubIndex }: Props) {
  const t = lap.telemetry;
  const innerW = WIDTH - MARGIN.l - MARGIN.r;
  const innerH = HEIGHT - MARGIN.t - MARGIN.b;
  const xMax = t.distance[t.distance.length - 1] ?? 1;
  const yMax = useMemo(() => {
    const peak = Math.max(...t.speed);
    return Math.ceil(peak / 50) * 50;
  }, [t.speed]);

  const { pathD, fillD, scrubX, scrubY } = useMemo(() => {
    const points = t.distance.map((d, i) => ({
      x: (d / xMax) * innerW,
      y: innerH - ((t.speed[i] ?? 0) / yMax) * innerH,
    }));

    const lineGen = line<{ x: number; y: number }>()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveMonotoneX);

    const path = lineGen(points) ?? "";

    /* Area fill underneath = same line + close to baseline */
    const fill = `${path} L ${points[points.length - 1]?.x ?? 0} ${innerH} L 0 ${innerH} Z`;

    const i = Math.max(0, Math.min(points.length - 1, scrubIndex));
    return {
      pathD: path,
      fillD: fill,
      scrubX: points[i]?.x ?? 0,
      scrubY: points[i]?.y ?? 0,
    };
  }, [t.distance, t.speed, scrubIndex, innerW, innerH, xMax, yMax]);

  const speedNow = t.speed[scrubIndex] ?? 0;

  return (
    <ChartFrame
      width={WIDTH}
      height={HEIGHT}
      margin={MARGIN}
      kicker="GPS_REALTIME // VELOCITY_CURVE"
      bigValue={speedNow.toFixed(1)}
      bigUnit="km/h"
      yMax={yMax}
      xMax={xMax}
      scrubX={scrubX}
    >
      <defs>
        <linearGradient id="vel-fade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff1801" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ff1801" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#vel-fade)" />
      <path
        d={pathD}
        fill="none"
        stroke="#ff1801"
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 6px rgba(255,24,1,0.35))" }}
      />
      {/* Scrub dot */}
      <circle
        cx={scrubX}
        cy={scrubY}
        r={4}
        fill="#ffffff"
        stroke="#ff1801"
        strokeWidth={1.5}
      />
    </ChartFrame>
  );
}
