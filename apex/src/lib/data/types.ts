/* JSON shape of a baked hero lap. Matches bake_hero_laps.py exactly. */

export type LapTelemetry = {
  samples: number;
  distance: number[];
  x: number[];
  y: number[];
  speed: number[];
  throttle: number[];
  brake: (number | null)[];
  ngear: (number | null)[];
  rpm: (number | null)[];
  drs: (number | null)[];
};

export type LapSectors = {
  s1_ms: number | null;
  s2_ms: number | null;
  s3_ms: number | null;
};

export type Lap = {
  id: string;
  year: number;
  race: string;
  session: string;
  track: string;
  era: string;
  accent: string;
  driver_code: string;
  driver_name: string;
  team: string;
  team_color: string;
  lap_time_str: string;
  lap_time_ms: number;
  lap_number: number | null;
  compound: string | null;
  sectors: LapSectors;
  telemetry: LapTelemetry;
};

export type LapSummary = Pick<
  Lap,
  | "id"
  | "year"
  | "race"
  | "track"
  | "session"
  | "driver_code"
  | "driver_name"
  | "team"
  | "team_color"
  | "accent"
  | "era"
  | "lap_time_str"
  | "lap_time_ms"
  | "compound"
> & { samples: number };

export type LapIndex = {
  baked_count: number;
  laps: LapSummary[];
};

export const HERO_LAP_ID = "ham_2020_silverstone_q";
