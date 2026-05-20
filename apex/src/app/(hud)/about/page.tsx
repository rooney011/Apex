import type { Metadata } from "next";
import { AboutView } from "@/components/about/about-view";

export const metadata: Metadata = {
  title: "About",
  description:
    "What APEX is, why it exists, and how to drive every part of the telemetry OS — including SYNC_SENSORS and the full keyboard shortcut set.",
};

export default function AboutPage() {
  return <AboutView />;
}
