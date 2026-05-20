/* Tiny helpers used by the chart layer. None of these need to live in the store. */

import type { Lap } from "@/lib/data/types";

export function pairXY(
  xs: number[],
  ys: (number | null | undefined)[],
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < xs.length; i++) {
    const v = ys[i];
    if (v == null) continue;
    out.push({ x: xs[i], y: v });
  }
  return out;
}

/* Rolling-mean smoothing. Used to soften GPS heading before computing curvature. */
export function rollingMean(arr: number[], window: number): number[] {
  if (window <= 1) return arr.slice();
  const half = Math.floor(window / 2);
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let n = 0;
    for (let k = i - half; k <= i + half; k++) {
      if (k >= 0 && k < arr.length) {
        sum += arr[k];
        n += 1;
      }
    }
    out[i] = sum / n;
  }
  return out;
}

/* Approximate lateral G from GPS curvature + speed.
   Returns an array aligned with telemetry.distance — lateral G in g units. */
export function computeLateralG(lap: Lap): number[] {
  const { x, y, speed, distance } = lap.telemetry;
  const n = x.length;
  if (n < 3 || y.length !== n) return new Array(speed.length).fill(0);

  // Per-sample heading
  const heading = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    heading[i] = Math.atan2(y[i + 1] - y[i], x[i + 1] - x[i]);
  }
  heading[n - 1] = heading[n - 2];
  const hSmooth = rollingMean(heading, 9);

  const out = new Array(speed.length).fill(0);
  for (let i = 1; i < n; i++) {
    const dD = Math.max(0.001, distance[i] - distance[i - 1]);
    let dh = hSmooth[i] - hSmooth[i - 1];
    // Unwrap angle to (-pi, pi]
    while (dh > Math.PI) dh -= 2 * Math.PI;
    while (dh < -Math.PI) dh += 2 * Math.PI;
    const curvature = dh / dD;
    const v = (speed[i] ?? 0) / 3.6; // km/h -> m/s
    out[i] = (v * v * curvature) / 9.81;
  }
  // Smooth the result so it reads as bands, not noise
  return rollingMean(out, 11);
}

/* Approximate longitudinal G from change in speed over distance. */
export function computeLongitudinalG(lap: Lap): number[] {
  const { speed, distance } = lap.telemetry;
  const n = speed.length;
  const out = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const dD = Math.max(0.001, distance[i] - distance[i - 1]);
    const vMid = (((speed[i] ?? 0) + (speed[i - 1] ?? 0)) / 2) / 3.6;
    const dv = ((speed[i] ?? 0) - (speed[i - 1] ?? 0)) / 3.6;
    out[i] = (vMid * dv) / dD / 9.81;
  }
  return rollingMean(out, 9);
}

/* Sample reading at a given distance — used by diagnostic panels. */
export type Reading = {
  index: number;
  distance: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number | null;
  rpm: number | null;
  drs: number | null;
};

export function readingAt(lap: Lap, index: number): Reading {
  const t = lap.telemetry;
  const i = Math.max(0, Math.min(t.samples - 1, index));
  return {
    index: i,
    distance: t.distance[i] ?? 0,
    speed: t.speed[i] ?? 0,
    throttle: t.throttle[i] ?? 0,
    brake: t.brake[i] ?? 0,
    gear: t.ngear[i] ?? null,
    rpm: t.rpm[i] ?? null,
    drs: t.drs[i] ?? null,
  };
}
