"use client";

import { useMemo } from "react";
import type { Lap } from "@/lib/data/types";
import { computeLateralG, computeLongitudinalG } from "@/lib/chart/derive";

type Props = { lap: Lap; scrubIndex: number };

/* G-load diagram — scatter of (lateral G, longitudinal G) per sample, with the
   scrub sample highlighted. Matches the polar-ish look of Stitch image 8. */
export function GLoadDiagram({ lap, scrubIndex }: Props) {
  const { latG, lonG, maxG } = useMemo(() => {
    const lat = computeLateralG(lap);
    const lon = computeLongitudinalG(lap);
    let m = 0;
    for (let i = 0; i < lat.length; i++) {
      const r = Math.hypot(lat[i], lon[i]);
      if (r > m) m = r;
    }
    return { latG: lat, lonG: lon, maxG: Math.max(2.5, Math.ceil(m * 2) / 2) };
  }, [lap]);

  const W = 880;
  const H = 260;
  const cx = 240;
  const cy = H / 2;
  const radius = 100;
  const scale = radius / maxG;

  const latNow = latG[scrubIndex] ?? 0;
  const lonNow = lonG[scrubIndex] ?? 0;
  const magNow = Math.hypot(latNow, lonNow);

  /* Build the dot positions */
  const dots = latG.map((lat, i) => ({
    cx: cx + lat * scale,
    cy: cy - lonG[i] * scale,
    o: 0.55,
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-full select-none"
      preserveAspectRatio="none"
    >
      {/* Kicker */}
      <text
        x={48}
        y={20}
        fill="#8a8a96"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 10,
          letterSpacing: "0.18em",
        }}
      >
        CH_02 // G_LOAD_DIAGRAM
      </text>
      <text
        x={W - 24}
        y={22}
        textAnchor="end"
        fill="#f4f4f6"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {magNow.toFixed(2)}
        <tspan
          dx={6}
          fill="#8a8a96"
          style={{ fontSize: 10, fontWeight: 400, letterSpacing: "0.18em" }}
        >
          G
        </tspan>
      </text>

      {/* Concentric G rings */}
      {[1, 2, 3, 4, 5].slice(0, Math.ceil(maxG)).map((g) => {
        const r = g * scale;
        if (r > radius * 1.1) return null;
        return (
          <g key={g}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#1f1f27"
              strokeWidth={1}
              strokeDasharray={g === 1 ? "" : "2 4"}
            />
            <text
              x={cx + r + 4}
              y={cy + 3}
              fill="#8a8a96"
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 9,
                letterSpacing: "0.1em",
              }}
            >
              {g}G
            </text>
          </g>
        );
      })}

      {/* Crosshair */}
      <line
        x1={cx - radius}
        x2={cx + radius}
        y1={cy}
        y2={cy}
        stroke="#26262e"
      />
      <line
        x1={cx}
        x2={cx}
        y1={cy - radius}
        y2={cy + radius}
        stroke="#26262e"
      />

      {/* Axis labels */}
      <text
        x={cx + radius + 14}
        y={cy + 14}
        fill="#8a8a96"
        style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 9 }}
      >
        LAT_G
      </text>
      <text
        x={cx}
        y={cy - radius - 8}
        textAnchor="middle"
        fill="#8a8a96"
        style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 9 }}
      >
        ACCEL
      </text>
      <text
        x={cx}
        y={cy + radius + 18}
        textAnchor="middle"
        fill="#8a8a96"
        style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 9 }}
      >
        BRAKE
      </text>

      {/* Dot trail */}
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={1.4}
          fill="#ff1801"
          opacity={d.o}
        />
      ))}

      {/* Current sample */}
      <circle
        cx={cx + latNow * scale}
        cy={cy - lonNow * scale}
        r={6}
        fill="#ffffff"
        stroke="#ff1801"
        strokeWidth={2}
      />

      {/* Right column — live readouts */}
      <g transform={`translate(${440}, 30)`}>
        <ReadoutRow label="LAT_G" value={latNow.toFixed(2)} unit="g" y={0} />
        <ReadoutRow label="LONG_G" value={lonNow.toFixed(2)} unit="g" y={42} />
        <ReadoutRow
          label="MAG_TOTAL"
          value={magNow.toFixed(2)}
          unit="g"
          y={84}
          accent
        />
        <ReadoutRow
          label="PEAK_LAT"
          value={Math.max(...latG.map(Math.abs)).toFixed(2)}
          unit="g"
          y={126}
        />
        <ReadoutRow
          label="PEAK_LONG"
          value={Math.max(...lonG.map(Math.abs)).toFixed(2)}
          unit="g"
          y={168}
        />
      </g>
    </svg>
  );
}

function ReadoutRow({
  label,
  value,
  unit,
  y,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  y: number;
  accent?: boolean;
}) {
  return (
    <g transform={`translate(0, ${y})`}>
      <text
        x={0}
        y={0}
        fill="#8a8a96"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 10,
          letterSpacing: "0.18em",
        }}
      >
        {label}
      </text>
      <text
        x={0}
        y={26}
        fill={accent ? "#ff1801" : "#f4f4f6"}
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 26,
          fontWeight: 700,
          filter: accent ? "drop-shadow(0 0 4px rgba(255,24,1,0.45))" : undefined,
        }}
      >
        {value}
        <tspan
          dx={6}
          fill="#8a8a96"
          style={{ fontSize: 11, fontWeight: 400, letterSpacing: "0.18em" }}
        >
          {unit}
        </tspan>
      </text>
    </g>
  );
}
