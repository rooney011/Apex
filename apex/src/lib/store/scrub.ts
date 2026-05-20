"use client";

import { create } from "zustand";
import { HERO_LAP_ID } from "@/lib/data/types";

export type ChannelId =
  | "velocity"
  | "gforce"
  | "throttle"
  | "braking"
  | "sectors";

type ScrubState = {
  /* Which lap is loaded in the telemetry view */
  activeLapId: string;
  setActiveLapId: (id: string) => void;

  /* Which channel the centre chart is showing */
  activeChannel: ChannelId;
  setActiveChannel: (ch: ChannelId) => void;

  /* Scrub position: distance along the lap, in metres */
  scrubDistance: number;
  setScrubDistance: (d: number) => void;

  /* True when the user is actively dragging the scrub handle — disables
     mouse-hover preview so a drag doesn't fight a hover. */
  isScrubbing: boolean;
  setScrubbing: (s: boolean) => void;

  /* Global command palette visibility — opened by the topbar search button,
     by Cmd/Ctrl+K, or programmatically from anywhere. */
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
};

export const useScrubStore = create<ScrubState>((set) => ({
  activeLapId: HERO_LAP_ID,
  setActiveLapId: (id) => set({ activeLapId: id, scrubDistance: 0 }),

  activeChannel: "velocity",
  setActiveChannel: (ch) => set({ activeChannel: ch }),

  scrubDistance: 0,
  setScrubDistance: (d) => set({ scrubDistance: d }),

  isScrubbing: false,
  setScrubbing: (s) => set({ isScrubbing: s }),

  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
}));

/* Given a baked lap, find the sample index nearest to `distance`.
   Lap distance is monotonically increasing, so a binary search is enough.
   Used by every chart + diagnostic panel to read the current value. */
export function indexForDistance(
  distances: number[],
  target: number,
): number {
  if (distances.length === 0) return 0;
  if (target <= distances[0]) return 0;
  if (target >= distances[distances.length - 1]) return distances.length - 1;

  let lo = 0;
  let hi = distances.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (distances[mid] > target) hi = mid;
    else lo = mid;
  }
  // pick the closer of lo / hi
  return target - distances[lo] < distances[hi] - target ? lo : hi;
}
