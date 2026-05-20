import type { Metadata } from "next";
import { TelemetryView } from "@/components/hud/telemetry-view";
import { loadLap } from "@/lib/data/server";
import { HERO_LAP_ID } from "@/lib/data/types";

export const metadata: Metadata = { title: "Telemetry" };

export default async function TelemetryPage() {
  const initialLap = await loadLap(HERO_LAP_ID);
  return <TelemetryView initialLap={initialLap} />;
}
