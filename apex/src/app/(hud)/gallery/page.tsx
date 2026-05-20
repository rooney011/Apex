import type { Metadata } from "next";
import { GalleryView } from "@/components/gallery/gallery-view";
import { loadLap, loadLapIndex } from "@/lib/data/server";

export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const index = await loadLapIndex();
  /* Load every baked lap server-side so the gallery is paint-ready */
  const laps = await Promise.all(index.laps.map((l) => loadLap(l.id)));
  return <GalleryView laps={laps} />;
}
