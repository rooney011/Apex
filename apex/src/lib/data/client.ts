"use client";

import { useQuery } from "@tanstack/react-query";
import type { Lap, LapIndex } from "./types";

/* Client-side hooks for interactive lap switching (used from Phase 2 on).
   Reads the same /public/laps/*.json the SSR path uses. */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as T;
}

export function useLap(slug: string | null | undefined) {
  return useQuery<Lap>({
    queryKey: ["lap", slug],
    queryFn: () => fetchJson<Lap>(`/laps/${slug}.json`),
    enabled: Boolean(slug),
    staleTime: Infinity, // baked data is immutable
  });
}

export function useLapIndex() {
  return useQuery<LapIndex>({
    queryKey: ["lap-index"],
    queryFn: () => fetchJson<LapIndex>("/laps/index.json"),
    staleTime: Infinity,
  });
}
