"use client";

import { useMemo } from "react";
import type { Lap } from "@/lib/data/types";

type Props = {
  lap: Lap;
  size?: number;
  segments?: number;
  showBrakes?: boolean;
  showStart?: boolean;
  className?: string;
};

/* Generative fingerprint rendered directly from telemetry — no PNG dependency.
   Each lap becomes a single SVG: GPS line as multi-segment path, per-segment
   stroke colour interpolated by throttle, red bursts at brake events. */
export function FingerprintSVG({
  lap,
  size = 320,
  segments = 160,
  showBrakes = true,
  showStart = true,
  className,
}: Props) {
  const built = useMemo(() => {
    const t = lap.telemetry;
    const n = t.x.length;
    if (n === 0 || t.y.length === 0) {
      return null;
    }
    const stride = Math.max(1, Math.floor(n / segments));

    /* Bounds for centering */
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      if (t.x[i] < minX) minX = t.x[i];
      if (t.x[i] > maxX) maxX = t.x[i];
      if (t.y[i] < minY) minY = t.y[i];
      if (t.y[i] > maxY) maxY = t.y[i];
    }
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const span = Math.max(spanX, spanY);
    const PAD = 18;
    const inner = size - PAD * 2;
    const scale = inner / span;
    const ox = PAD + (inner - spanX * scale) / 2 - minX * scale;
    const oy = PAD + (inner - spanY * scale) / 2 - minY * scale;

    /* SVG y grows down; F1 GPS y grows up. Flip vertically. */
    const project = (x: number, y: number) => ({
      px: ox + x * scale,
      py: size - (oy + y * scale),
    });

    type Seg = { x1: number; y1: number; x2: number; y2: number; thr: number; isBrake: boolean };
    const segs: Seg[] = [];
    for (let i = 0; i < n - stride; i += stride) {
      const a = project(t.x[i], t.y[i]);
      const b = project(t.x[i + stride], t.y[i + stride]);
      segs.push({
        x1: a.px,
        y1: a.py,
        x2: b.px,
        y2: b.py,
        thr: (t.throttle[i] ?? 0) / 100,
        isBrake: (t.brake[i] ?? 0) > 0,
      });
    }

    /* Brake events — sample contiguous brake spans and keep ~12 anchor points */
    const brakes: Array<{ px: number; py: number; r: number }> = [];
    if (showBrakes) {
      let i = 0;
      while (i < n) {
        if ((t.brake[i] ?? 0) > 0) {
          /* Pick the deepest-decel index inside the contiguous brake span */
          let j = i;
          let bestI = i;
          let bestDecel = 0;
          while (j < n && (t.brake[j] ?? 0) > 0) {
            if (j > 0) {
              const dv = (t.speed[j - 1] ?? 0) - (t.speed[j] ?? 0);
              if (dv > bestDecel) {
                bestDecel = dv;
                bestI = j;
              }
            }
            j++;
          }
          const p = project(t.x[bestI], t.y[bestI]);
          brakes.push({ px: p.px, py: p.py, r: 3.2 });
          i = j + 1;
        } else {
          i++;
        }
      }
    }

    const start = showStart ? project(t.x[0], t.y[0]) : null;

    return { segs, brakes, start };
  }, [lap, segments, size, showBrakes, showStart]);

  if (!built) return null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        <filter id="fp-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Halo pass — broad blurred copy below for the bloom feel */}
      <g style={{ filter: "url(#fp-glow)" }} opacity={0.7}>
        {built.segs.map((s, i) => (
          <line
            key={`h${i}`}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={strokeColor(s.thr, s.isBrake, 0.55)}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Crisp pass */}
      <g>
        {built.segs.map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={strokeColor(s.thr, s.isBrake, 1)}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Brake bursts */}
      {built.brakes.map((b, i) => (
        <g key={i}>
          <circle cx={b.px} cy={b.py} r={b.r * 2.6} fill="#ff1801" opacity={0.25} />
          <circle cx={b.px} cy={b.py} r={b.r} fill="#ff5040" />
        </g>
      ))}

      {/* Start pip */}
      {built.start && (
        <g>
          <circle
            cx={built.start.px}
            cy={built.start.py}
            r={4.5}
            fill="none"
            stroke="#00e8ff"
            strokeWidth={1.2}
            opacity={0.85}
          />
          <circle
            cx={built.start.px}
            cy={built.start.py}
            r={1.4}
            fill="#00e8ff"
          />
        </g>
      )}
    </svg>
  );
}

/* throttle 0..1 → cool→hot ramp; brake event override. Alpha for the halo pass. */
function strokeColor(thr: number, isBrake: boolean, alpha: number): string {
  if (isBrake) {
    return alpha < 1 ? `rgba(255, 80, 64, ${alpha})` : "#ff5040";
  }
  // Lerp cool→warm→white
  if (thr < 0.5) {
    const k = thr * 2;
    const r = Math.round(77 + (255 - 77) * k);
    const g = Math.round(199 + (138 - 199) * k);
    const b = Math.round(255 + (74 - 255) * k);
    return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
  }
  const k = (thr - 0.5) * 2;
  const r = Math.round(255 + (255 - 255) * k);
  const g = Math.round(138 + (255 - 138) * k);
  const b = Math.round(74 + (255 - 74) * k);
  return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
}
