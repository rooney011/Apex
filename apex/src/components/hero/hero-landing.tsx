"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Lap } from "@/lib/data/types";
import { HeroOverlay } from "./hero-overlay";
import { SceneErrorBoundary } from "./scene-error-boundary";

/* The R3F canvas pulls in three.js + post stack — heavy. Dynamic-import with
   ssr:false so Next doesn't try to render it on the server. */
const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => <HeroLoading />,
});

type Props = { lap: Lap };

export function HeroLanding({ lap }: Props) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-apex-bg">
      <SceneErrorBoundary>
        <HeroScene lap={lap} />
      </SceneErrorBoundary>
      <HeroOverlay lap={lap} />
    </div>
  );
}

function HeroLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-apex-bg">
      <div className="flex flex-col items-center gap-3 text-apex-muted">
        <Loader2 className="size-5 animate-spin text-apex-red" strokeWidth={2} />
        <p className="label-mono">COMPILING_RENDER_PIPELINE</p>
      </div>
    </div>
  );
}
