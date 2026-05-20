"use client";

import { forwardRef, useMemo } from "react";
import { rollingMean } from "@/lib/chart/derive";
import { ASPECT_RATIOS, PALETTES, type RenderParams, paletteAt } from "@/lib/canvas/params";
import type { Lap } from "@/lib/data/types";

type Props = {
  lap: Lap;
  params: RenderParams;
  /* If provided, override the SVG's natural aspect (used by the on-screen
     preview to keep things tidy; export uses null to preserve aspect). */
  className?: string;
};

/* Parameterised fingerprint renderer. Same visual language as the gallery
   FingerprintSVG but every knob exposed via RenderParams. The forwardRef is
   wired so the export bar can grab the actual <svg> node and serialize it. */
export const ConfigurableFingerprint = forwardRef<SVGSVGElement, Props>(
  function ConfigurableFingerprint({ lap, params, className }, ref) {
    const palette = PALETTES[params.paletteId];
    const aspect = ASPECT_RATIOS[params.aspect];
    const W = aspect.w;
    const H = aspect.h;
    const accent = params.accentOverride ?? lap.accent;
    const bg = params.bgOverride ?? palette.bg;

    const built = useMemo(() => {
      const t = lap.telemetry;
      const n = t.x.length;
      if (n === 0 || t.y.length === 0) return null;

      /* Smooth GPS first */
      const xs = rollingMean(t.x, params.smoothing);
      const ys = rollingMean(t.y, params.smoothing);

      const stride = Math.max(1, Math.floor(n / params.segments));

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < n; i++) {
        if (xs[i] < minX) minX = xs[i];
        if (xs[i] > maxX) maxX = xs[i];
        if (ys[i] < minY) minY = ys[i];
        if (ys[i] > maxY) maxY = ys[i];
      }
      const spanX = maxX - minX || 1;
      const spanY = maxY - minY || 1;

      /* Reserve a compact bottom band for the caption (smaller than before so
         the map gets more room). When caption is off, no reservation. */
      const captionH = params.caption ? Math.max(56, H * 0.055) : 0;
      const captionGap = params.caption ? 14 : 0;
      const padX = Math.max(36, W * 0.04);
      const padTop = Math.max(36, H * 0.04);
      const padBottom = Math.max(36, H * 0.04) + captionH + captionGap;
      const innerW = W - padX * 2;
      const innerH = H - padTop - padBottom;
      const scale = Math.min(innerW / spanX, innerH / spanY);

      const innerLeft = padX + (innerW - spanX * scale) / 2;
      const innerBottom = padTop + (innerH + spanY * scale) / 2;

      /* SVG y grows down. F1 GPS y grows up. Flip while centering inside
         the inner area: minY ends up at the bottom, maxY at the top. */
      const project = (x: number, y: number) => ({
        px: innerLeft + (x - minX) * scale,
        py: innerBottom - (y - minY) * scale,
      });

      type Seg = {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        thr: number;
        isBrake: boolean;
      };
      const segs: Seg[] = [];
      for (let i = 0; i < n - stride; i += stride) {
        const a = project(xs[i], ys[i]);
        const b = project(xs[i + stride], ys[i + stride]);
        segs.push({
          x1: a.px,
          y1: a.py,
          x2: b.px,
          y2: b.py,
          thr: (t.throttle[i] ?? 0) / 100,
          isBrake: (t.brake[i] ?? 0) > 0,
        });
      }

      /* Brake bursts */
      const brakes: Array<{ px: number; py: number }> = [];
      if (params.showBrakes) {
        let i = 0;
        while (i < n) {
          if ((t.brake[i] ?? 0) > 0) {
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
            const p = project(xs[bestI], ys[bestI]);
            brakes.push(p);
            i = j + 1;
          } else {
            i++;
          }
        }
      }

      const start = params.showStart ? project(xs[0], ys[0]) : null;

      /* Caption block sits in the bottom band; centre vertically in that band */
      const captionTop = H - padBottom + captionGap;
      const captionMid = captionTop + captionH / 2;

      return { segs, brakes, start, captionTop, captionMid, captionH };
    }, [lap, params.segments, params.smoothing, params.showBrakes, params.showStart, params.caption, W, H]);

    if (!built) return null;

    const glowBlur = 0.5 + params.glow * 1.4;
    const haloAlpha = 0.25 + params.glow * 0.4;
    const haloWidth = params.strokeWidth * 1.9;

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className={className}
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <rect x={0} y={0} width={W} height={H} fill={bg} />

        <defs>
          <filter id="cf-glow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation={glowBlur} />
          </filter>
        </defs>

        {/* Halo pass */}
        <g filter="url(#cf-glow)" opacity={haloAlpha}>
          {built.segs.map((s, i) => (
            <line
              key={`h${i}`}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={s.isBrake ? palette.brake : paletteAt(palette, s.thr)}
              strokeWidth={haloWidth}
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
              stroke={s.isBrake ? palette.brake : paletteAt(palette, s.thr)}
              strokeWidth={params.strokeWidth}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Brake bursts */}
        {built.brakes.map((b, i) => (
          <g key={i} opacity={params.brakeAlpha}>
            <circle
              cx={b.px}
              cy={b.py}
              r={params.brakeSize * 2.4}
              fill={palette.brake}
              opacity={0.25}
            />
            <circle cx={b.px} cy={b.py} r={params.brakeSize} fill={palette.brake} />
          </g>
        ))}

        {/* Start pip */}
        {built.start && (
          <g opacity={0.9}>
            <circle
              cx={built.start.px}
              cy={built.start.py}
              r={params.brakeSize * 1.6}
              fill="none"
              stroke={accent}
              strokeWidth={1.4}
            />
            <circle
              cx={built.start.px}
              cy={built.start.py}
              r={params.brakeSize * 0.55}
              fill={accent}
            />
          </g>
        )}

        {/* Caption — 3 lines stacked inside the reserved bottom band */}
        {params.caption && (
          <g>
            <text
              x={W / 2}
              y={built.captionMid - H * 0.018}
              textAnchor="middle"
              fill={accent}
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: H * 0.012,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
              }}
            >
              APEX · LAP_FINGERPRINT
            </text>
            <text
              x={W / 2}
              y={built.captionMid + H * 0.008}
              textAnchor="middle"
              fill="#f4f4f6"
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: H * 0.022,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {lap.driver_name} · {lap.race} {lap.year}
            </text>
            <text
              x={W / 2}
              y={built.captionMid + H * 0.032}
              textAnchor="middle"
              fill="#8a8a96"
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: H * 0.011,
                letterSpacing: "0.24em",
              }}
            >
              {lap.lap_time_str} · {lap.compound ?? "—"} · {palette.label}
            </text>
          </g>
        )}
      </svg>
    );
  },
);
