import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { Lap, LapIndex } from "./types";

/* Server-side loaders that read the baked JSON straight from /public.
   Avoids the round-trip through Next.js's own dev server for SSR. */

const LAPS_DIR = path.join(process.cwd(), "public", "laps");

export async function loadLap(slug: string): Promise<Lap> {
  const raw = await fs.readFile(path.join(LAPS_DIR, `${slug}.json`), "utf-8");
  return JSON.parse(raw) as Lap;
}

export async function loadLapIndex(): Promise<LapIndex> {
  const raw = await fs.readFile(path.join(LAPS_DIR, "index.json"), "utf-8");
  return JSON.parse(raw) as LapIndex;
}
