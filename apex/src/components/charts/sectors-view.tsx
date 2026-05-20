"use client";

import { useMemo } from "react";
import type { Lap } from "@/lib/data/types";

type Props = { lap: Lap; scrubIndex: number };

/* Sectors view — three big pills + a per-sector mini speed trace under each. */
export function SectorsView({ lap, scrubIndex }: Props) {
  const t = lap.telemetry;
  const totalMs = lap.lap_time_ms;
  const s = lap.sectors;

  const sectors = useMemo(() => {
    const ranges: { ms: number | null; from: number; to: number }[] = [];
    let cursor = 0;
    const list = [s.s1_ms, s.s2_ms, s.s3_ms];
    for (const ms of list) {
      if (ms == null) {
        ranges.push({ ms: null, from: cursor, to: cursor });
        continue;
      }
      const next = cursor + ms;
      ranges.push({ ms, from: cursor, to: next });
      cursor = next;
    }
    return ranges;
  }, [s]);

  const scrubDist = t.distance[scrubIndex] ?? 0;
  const totalDist = t.distance[t.distance.length - 1] ?? 1;

  /* Distance-based sector cursors. We don't know exact GPS sector boundaries
     from FastF1's lap object, so we approximate by mapping the time fraction
     onto the lap distance — close enough for visual feedback. */
  const sectorBoundaries = sectors.map(
    (r) => (r.to / Math.max(1, totalMs)) * totalDist,
  );
  const activeSector =
    scrubDist < sectorBoundaries[0]
      ? 0
      : scrubDist < sectorBoundaries[1]
      ? 1
      : 2;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {sectors.map((sec, i) => {
          const ms = sec.ms;
          const isActive = i === activeSector;
          return (
            <div
              key={i}
              className={
                "panel relative p-5 transition-colors " +
                (isActive
                  ? "border-apex-red/80 shadow-[0_0_22px_rgba(255,24,1,0.18)]"
                  : "")
              }
            >
              <p className="label-mono">SECTOR_{i + 1}</p>
              <p
                className={
                  "font-mono text-4xl font-bold tracking-tight mt-2 " +
                  (isActive ? "text-apex-red text-glow-red" : "text-foreground")
                }
              >
                {ms == null ? "—" : (ms / 1000).toFixed(3)}
                <span className="text-apex-muted text-sm font-normal ml-2">s</span>
              </p>
              <div className="mt-4 h-1 rounded-full bg-apex-bg overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width:
                      i < activeSector
                        ? "100%"
                        : i > activeSector
                        ? "0%"
                        : `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((scrubDist -
                                (i === 0 ? 0 : sectorBoundaries[i - 1])) /
                                Math.max(
                                  1,
                                  sectorBoundaries[i] -
                                    (i === 0 ? 0 : sectorBoundaries[i - 1]),
                                )) *
                                100,
                            ),
                          )}%`,
                    background: "#ff1801",
                  }}
                />
              </div>
              <p className="label-mono mt-3">
                {sec.ms == null
                  ? "no-data"
                  : ((sec.to - sec.from) / totalMs * 100).toFixed(1) + "% of lap"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="panel p-5">
        <p className="label-mono">LAP_OVERVIEW · DISTANCE_VS_SECTOR</p>
        <SectorTimeline
          scrubDist={scrubDist}
          totalDist={totalDist}
          boundaries={sectorBoundaries}
        />
      </div>
    </div>
  );
}

function SectorTimeline({
  scrubDist,
  totalDist,
  boundaries,
}: {
  scrubDist: number;
  totalDist: number;
  boundaries: number[];
}) {
  const W = 880;
  const H = 80;
  const pad = 12;
  const innerW = W - pad * 2;

  const segs = [
    { from: 0, to: boundaries[0] },
    { from: boundaries[0], to: boundaries[1] },
    { from: boundaries[1], to: totalDist },
  ];

  const colours = ["#7bf2b8", "#ffb84a", "#ff1801"];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-20"
      preserveAspectRatio="none"
    >
      {segs.map((seg, i) => {
        const x1 = pad + (seg.from / totalDist) * innerW;
        const x2 = pad + (seg.to / totalDist) * innerW;
        return (
          <g key={i}>
            <rect
              x={x1}
              y={H / 2 - 10}
              width={Math.max(2, x2 - x1)}
              height={20}
              fill={colours[i]}
              opacity={0.14}
              rx={3}
            />
            <line
              x1={x1}
              x2={x2}
              y1={H / 2}
              y2={H / 2}
              stroke={colours[i]}
              strokeWidth={2}
            />
            <text
              x={(x1 + x2) / 2}
              y={H / 2 - 18}
              textAnchor="middle"
              fill="#8a8a96"
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 9,
                letterSpacing: "0.18em",
              }}
            >
              S{i + 1}
            </text>
          </g>
        );
      })}

      {/* Scrub indicator */}
      <g
        transform={`translate(${pad + (scrubDist / totalDist) * innerW}, 0)`}
        pointerEvents="none"
      >
        <line
          x1={0}
          x2={0}
          y1={H / 2 - 22}
          y2={H / 2 + 22}
          stroke="#ff1801"
          strokeWidth={1.5}
        />
        <polygon
          points={"0,52 -4,60 4,60"}
          fill="#ff1801"
          transform={`translate(0, ${H / 2 - 30})`}
        />
      </g>
    </svg>
  );
}
