"use client";

import type { RenderParams } from "@/lib/canvas/params";

const STORAGE_KEY = "apex.collector.v1";

export type SavedPreset = {
  id: string;
  name: string;
  lapId: string;
  params: RenderParams;
  createdAt: number;
};

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadAll(): SavedPreset[] {
  const ls = safeLocalStorage();
  if (!ls) return [];
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedPreset[];
  } catch {
    return [];
  }
}

function writeAll(list: SavedPreset[]): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(list));
    /* fire so other tabs / Collector tab listening can refresh */
    window.dispatchEvent(new CustomEvent("apex:collector-changed"));
  } catch (e) {
    console.warn("Collector persist failed:", e);
  }
}

export function saveOne(
  input: Omit<SavedPreset, "id" | "createdAt">,
): SavedPreset {
  const item: SavedPreset = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `pst_${Math.random().toString(36).slice(2)}_${Date.now()}`,
    createdAt: Date.now(),
  };
  const next = [item, ...loadAll()].slice(0, 200); // cap to keep storage tidy
  writeAll(next);
  return item;
}

export function deleteOne(id: string): void {
  writeAll(loadAll().filter((p) => p.id !== id));
}

export function clearAll(): void {
  writeAll([]);
}

/* Subscribe to changes — re-fires on every save/delete/clear including from
   other tabs (storage events) and from this tab (custom event). */
export function onCollectorChange(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) fn();
  };
  const onCustom = () => fn();
  window.addEventListener("storage", onStorage);
  window.addEventListener("apex:collector-changed", onCustom as EventListener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(
      "apex:collector-changed",
      onCustom as EventListener,
    );
  };
}
