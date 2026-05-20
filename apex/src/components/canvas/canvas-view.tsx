"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PARAMS, type RenderParams } from "@/lib/canvas/params";
import { consumeHashPayload } from "@/lib/collector/share";
import { useLap } from "@/lib/data/client";
import type { Lap } from "@/lib/data/types";
import { useScrubStore } from "@/lib/store/scrub";
import { LapPicker } from "@/components/hud/lap-picker";
import { showToast } from "@/components/hud/toast";
import { ConfigurableFingerprint } from "./configurable-fingerprint";
import { ExportBar } from "./export-bar";
import { ParamPanel } from "./param-panel";
import { SaveBar } from "./save-bar";

type Props = { initialLap: Lap };

const ease = [0.22, 1, 0.36, 1] as const;

export function CanvasView({ initialLap }: Props) {
  const activeLapId = useScrubStore((s) => s.activeLapId);
  const setActiveLapId = useScrubStore((s) => s.setActiveLapId);
  const { data, isFetching } = useLap(activeLapId);
  const lap = data ?? initialLap;

  const [params, setParams] = useState<RenderParams>(DEFAULT_PARAMS);
  const svgRef = useRef<SVGSVGElement>(null);

  /* On mount, consume any #p=... share-link payload and restore both lap + params. */
  useEffect(() => {
    const payload = consumeHashPayload();
    if (!payload) return;
    setParams({ ...DEFAULT_PARAMS, ...payload.params });
    if (payload.lapId !== activeLapId) {
      setActiveLapId(payload.lapId);
    }
    showToast("Preset restored from share link");
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewWrapperStyle = useMemo(() => {
    /* Frame the preview by aspect: square gets 1:1; tall aspects get a tall
       wrapper so the visual reads correctly even on a wide screen. */
    switch (params.aspect) {
      case "poster":
        return { aspectRatio: "11 / 14" };
      case "phone":
        return { aspectRatio: "9 / 16" };
      case "wide":
        return { aspectRatio: "16 / 9" };
      default:
        return { aspectRatio: "1 / 1" };
    }
  }, [params.aspect]);

  return (
    <div className="relative min-h-full px-6 lg:px-8 py-6">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-6">
        <div>
          <p className="label-mono text-apex-red flex items-center gap-2">
            MODULE // CANVAS
            {isFetching && <Loader2 className="size-3 animate-spin" />}
          </p>
          <h1 className="font-sans text-4xl md:text-5xl font-bold tracking-tight mt-2">
            Generative{" "}
            <span className="italic font-serif text-apex-red">Lab</span>
          </h1>
          <p className="font-serif text-foreground/75 mt-3 max-w-xl text-[14px] leading-relaxed">
            Tune the render in real time. Every slider re-paints the SVG. When
            it looks right, pull it down as a vector or as a high-res PNG.
          </p>
        </div>
        <LapPicker />
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        {/* Preview column */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="flex flex-col gap-3"
        >
          <div className="panel p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="size-2.5 rounded-full"
                style={{
                  background: lap.accent,
                  boxShadow: `0 0 10px ${lap.accent}88`,
                }}
              />
              <p className="font-sans text-sm font-medium">
                {lap.driver_name} · {lap.year} · {lap.track}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Pill label="LAP">{lap.lap_time_str}</Pill>
              <Pill label="SAMPLES">{lap.telemetry.samples.toString()}</Pill>
              <Pill label="COMPOUND">{lap.compound ?? "—"}</Pill>
            </div>
          </div>

          <div className="panel relative overflow-hidden">
            <div
              className="w-full max-h-[80dvh] mx-auto"
              style={previewWrapperStyle}
            >
              <ConfigurableFingerprint
                ref={svgRef}
                lap={lap}
                params={params}
              />
            </div>
            {/* Subtle frame border */}
            <div
              className="absolute inset-0 pointer-events-none border-x border-apex-border/40"
              aria-hidden
            />
          </div>

          <p className="label-mono text-apex-muted/70 mt-1">
            tip · presets reset everything, individual sliders nudge from the
            current render
          </p>
        </motion.div>

        {/* Right column — controls */}
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease }}
          className="flex flex-col gap-4"
        >
          <SaveBar
            lapId={lap.id}
            driverName={lap.driver_name}
            params={params}
          />
          <ExportBar
            svgRef={svgRef}
            lapId={lap.id}
            aspect={params.aspect}
          />
          <ParamPanel params={params} setParams={setParams} />
        </motion.aside>
      </div>
    </div>
  );
}

function Pill({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-right">
      <p className="label-mono">{label}</p>
      <p className="font-mono text-xs font-bold mt-0.5">{children}</p>
    </div>
  );
}
