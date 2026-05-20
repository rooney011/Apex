"use client";

import { useMemo } from "react";
import type { Lap } from "@/lib/data/types";
import { indexForDistance, useScrubStore } from "@/lib/store/scrub";

type Props = { lap: Lap; rows?: number };

/* Rolling log table windowed around the current scrub sample.
   Mimics the SEQUENTIAL_LOG panel from Stitch image 3. */
export function SequentialLog({ lap, rows = 8 }: Props) {
  const scrubDistance = useScrubStore((s) => s.scrubDistance);
  const idx = useMemo(
    () => indexForDistance(lap.telemetry.distance, scrubDistance),
    [lap.telemetry.distance, scrubDistance],
  );

  const t = lap.telemetry;
  const half = Math.floor(rows / 2);
  const start = Math.max(0, Math.min(t.samples - rows, idx - half));
  const slice = Array.from({ length: rows }, (_, k) => start + k);

  return (
    <div className="panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-apex-border">
        <p className="label-mono">SEQUENTIAL_LOG</p>
        <p className="label-mono !text-[9px] text-apex-green">LIVE_FEED_MS</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr className="text-apex-muted">
              <Th>SAMPLE</Th>
              <Th>DIST</Th>
              <Th>SPEED</Th>
              <Th>THR</Th>
              <Th>BRK</Th>
              <Th>GEAR</Th>
              <Th>RPM</Th>
              <Th>DRS</Th>
            </tr>
          </thead>
          <tbody>
            {slice.map((i) => {
              const isCurrent = i === idx;
              return (
                <tr
                  key={i}
                  className={
                    "border-t border-apex-border/60 " +
                    (isCurrent ? "bg-apex-red/8" : "")
                  }
                >
                  <Td accent={isCurrent}>{i.toString().padStart(4, "0")}</Td>
                  <Td>{((t.distance[i] ?? 0) / 1000).toFixed(3)}</Td>
                  <Td>{(t.speed[i] ?? 0).toFixed(1)}</Td>
                  <Td>{(t.throttle[i] ?? 0).toFixed(0)}</Td>
                  <Td accent={(t.brake[i] ?? 0) > 0 ? "red" : undefined}>
                    {(t.brake[i] ?? 0) > 0 ? "ON" : "—"}
                  </Td>
                  <Td>{t.ngear[i] ?? "—"}</Td>
                  <Td>{t.rpm[i] != null ? t.rpm[i] : "—"}</Td>
                  <Td>{(t.drs[i] ?? 0) >= 8 ? "OPEN" : "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-2 label-mono !text-[10px]">{children}</th>
  );
}

function Td({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean | "red";
}) {
  return (
    <td
      className={
        "px-4 py-1.5 " +
        (accent === "red"
          ? "text-apex-red font-bold"
          : accent
          ? "text-foreground font-bold"
          : "text-foreground/80")
      }
    >
      {children}
    </td>
  );
}
