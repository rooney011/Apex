/* Small helpers for rendering telemetry-flavoured numbers in the HUD. */

export function msToSectorTime(ms: number | null): string {
  if (ms == null) return "—";
  const s = ms / 1000;
  return `${s.toFixed(3)}`;
}

export function fmtKmH(v: number): string {
  return `${Math.round(v)}`;
}

export function fmtInt(v: number): string {
  return Math.round(v).toLocaleString("en-US");
}

export function fmtKm(meters: number): string {
  return (meters / 1000).toFixed(3);
}

export function fmtPct(v: number): string {
  return `${Math.round(v)}%`;
}
