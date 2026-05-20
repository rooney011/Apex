import { HeroLanding } from "@/components/hero/hero-landing";
import { loadLap } from "@/lib/data/server";
import { HERO_LAP_ID } from "@/lib/data/types";

export default async function Home() {
  const lap = await loadLap(HERO_LAP_ID);
  return <HeroLanding lap={lap} />;
}
