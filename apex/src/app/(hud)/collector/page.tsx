import type { Metadata } from "next";
import { CollectorView } from "@/components/collector/collector-view";

export const metadata: Metadata = { title: "Collector" };

export default function CollectorPage() {
  return <CollectorView />;
}
