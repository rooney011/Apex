import type { Metadata } from "next";
import { CanvasView } from "@/components/canvas/canvas-view";
import { loadLap } from "@/lib/data/server";
import { HERO_LAP_ID } from "@/lib/data/types";

export const metadata: Metadata = { title: "Canvas · Generative Lab" };

export default async function CanvasPage() {
  const initialLap = await loadLap(HERO_LAP_ID);
  return <CanvasView initialLap={initialLap} />;
}
