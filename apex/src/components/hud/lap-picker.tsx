"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLapIndex } from "@/lib/data/client";
import { useScrubStore } from "@/lib/store/scrub";
import { cn } from "@/lib/utils";

export function LapPicker() {
  const { data, isLoading } = useLapIndex();
  const activeLapId = useScrubStore((s) => s.activeLapId);
  const setActiveLapId = useScrubStore((s) => s.setActiveLapId);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = data?.laps.find((l) => l.id === activeLapId);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-3 rounded-md border border-apex-border px-3 py-2",
          "hover:bg-apex-surface-2 transition-colors text-left",
          open && "bg-apex-surface-2",
        )}
      >
        <div>
          <p className="label-mono">ACTIVE_LAP</p>
          <p className="font-mono text-[12px] font-bold mt-0.5 text-foreground">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" />
                loading…
              </span>
            ) : active ? (
              `${active.driver_code} · ${active.year} · ${active.track}`
            ) : (
              "—"
            )}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-apex-muted transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={1.6}
        />
      </button>

      {open && data && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 z-30 w-[360px] panel p-1",
            "shadow-[0_18px_46px_rgba(0,0,0,0.45)]",
          )}
        >
          <p className="label-mono px-3 py-2">SELECT_LAP · {data.baked_count}</p>
          <ul className="max-h-[420px] overflow-y-auto">
            {data.laps.map((l) => {
              const isActive = l.id === activeLapId;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLapId(l.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded px-3 py-2.5 text-left",
                      "transition-colors hover:bg-apex-surface-2",
                      isActive && "bg-apex-bg",
                    )}
                  >
                    <span
                      className="size-1.5 rounded-full shrink-0"
                      style={{ background: l.accent }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[13px] font-medium truncate">
                        {l.driver_name}
                      </p>
                      <p className="label-mono mt-0.5 !text-[9px]">
                        {l.year} · {l.track} · {l.session}
                      </p>
                    </div>
                    <p className="font-mono text-[11px] text-apex-muted">
                      {l.lap_time_str}
                    </p>
                    {isActive && (
                      <Check className="size-3 text-apex-red" strokeWidth={2} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
