"use client";

import { Download, FileImage, Loader2 } from "lucide-react";
import { useState } from "react";
import { exportPng, exportSvg, type PngResolution } from "@/lib/canvas/export";
import type { Aspect } from "@/lib/canvas/params";
import { cn } from "@/lib/utils";

type Props = {
  svgRef: React.RefObject<SVGSVGElement | null>;
  lapId: string;
  aspect: Aspect;
};

const RESOLUTIONS: PngResolution[] = [1024, 2048, 4096];

export function ExportBar({ svgRef, lapId, aspect }: Props) {
  const [busy, setBusy] = useState<"svg" | PngResolution | null>(null);

  const onSvg = () => {
    if (!svgRef.current) return;
    setBusy("svg");
    try {
      exportSvg(svgRef.current, lapId, aspect);
    } finally {
      setBusy(null);
    }
  };

  const onPng = async (res: PngResolution) => {
    if (!svgRef.current) return;
    setBusy(res);
    try {
      await exportPng(svgRef.current, lapId, aspect, res);
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="panel p-4">
      <p className="label-mono text-apex-red mb-3">EXPORT</p>

      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {RESOLUTIONS.map((r) => {
          const active = busy === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onPng(r)}
              disabled={busy !== null}
              className={cn(
                "panel-inset px-3 py-2.5 flex flex-col items-start gap-0.5 transition-colors",
                busy === null && "hover:bg-apex-surface-2",
                busy !== null && "opacity-50 cursor-not-allowed",
              )}
            >
              <span className="flex items-center gap-1.5 label-mono">
                {active ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <FileImage className="size-3" strokeWidth={1.8} />
                )}
                PNG · {r}
              </span>
              <span className="font-mono text-[10px] text-apex-muted">
                {r === 1024 ? "preview" : r === 2048 ? "print" : "wallpaper"}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onSvg}
        disabled={busy !== null}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-md bg-apex-red text-white px-4 py-2.5 glow-red",
          "transition-transform hover:scale-[1.01] active:scale-[0.99]",
          busy !== null && "opacity-50 cursor-not-allowed",
        )}
      >
        {busy === "svg" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" strokeWidth={2} />
        )}
        <span className="label-mono !text-white">DOWNLOAD_SVG</span>
      </button>

      <p className="label-mono !text-[9px] mt-2 text-apex-muted">
        SVG keeps full path data — scale to any size in print software without
        losing edges. PNG bakes the current bloom/blur into pixels.
      </p>
    </div>
  );
}
