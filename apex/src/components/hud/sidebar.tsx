"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { APEX_BUILD, APEX_LOGO_SUB, CHANNELS } from "@/lib/nav";
import { useScrubStore } from "@/lib/store/scrub";
import { cn } from "@/lib/utils";
import { showToast } from "./toast";

export function Sidebar() {
  const activeChannel = useScrubStore((s) => s.activeChannel);
  const setActiveChannel = useScrubStore((s) => s.setActiveChannel);
  const activeLapId = useScrubStore((s) => s.activeLapId);
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const onSync = async () => {
    setSyncing(true);
    try {
      /* Bust the cached lap + index payloads so any FE consumer re-fetches. */
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lap", activeLapId] }),
        queryClient.invalidateQueries({ queryKey: ["lap-index"] }),
      ]);
      /* Add a small floor so the spin reads as deliberate work, not a flicker */
      await new Promise((r) => setTimeout(r, 600));
      showToast("Telemetry re-synced from source");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <aside className="hidden md:flex w-[224px] shrink-0 flex-col border-r border-apex-border bg-apex-surface">
      {/* Brand block */}
      <div className="px-5 pt-6 pb-5 border-b border-apex-border">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-apex-red text-glow-red">
          APEX
        </h1>
        <p className="label-mono mt-1.5">{APEX_LOGO_SUB}</p>
      </div>

      {/* Channels list */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="label-mono px-2 pb-3">TELEMETRY · CHANNELS</p>
        <ul className="flex flex-col gap-1">
          {CHANNELS.map((ch) => {
            const isActive = activeChannel === ch.id;
            const Icon = ch.icon;
            return (
              <li key={ch.id}>
                <button
                  type="button"
                  onClick={() => setActiveChannel(ch.id)}
                  className={cn(
                    "group relative w-full rounded-md border border-transparent",
                    "flex items-center gap-3 px-3 py-2 text-left transition-colors",
                    isActive
                      ? "bg-apex-bg border-apex-border"
                      : "hover:bg-apex-bg/60",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-opacity",
                      isActive ? "bg-apex-red glow-red opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon
                    className={cn(
                      "size-4 transition-colors",
                      isActive ? "text-apex-red" : "text-apex-muted",
                    )}
                    strokeWidth={1.6}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="label-mono leading-none">{ch.code}</p>
                    <p
                      className={cn(
                        "font-sans text-[13px] font-medium leading-tight mt-1 truncate",
                        isActive ? "text-foreground" : "text-foreground/80",
                      )}
                    >
                      {ch.label}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "label-mono shrink-0",
                      isActive ? "text-apex-red" : "text-apex-muted/60",
                    )}
                  >
                    {isActive ? "ACTIVE" : "READY"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sync action — re-pulls the active lap + index from source */}
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          title="Re-fetch the active lap's telemetry from source (busts the TanStack cache)"
          className={cn(
            "w-full rounded-md bg-apex-red text-white px-3 py-2.5",
            "label-mono !text-white !text-[11px] tracking-[0.18em]",
            "flex items-center justify-center gap-2 transition-transform",
            "hover:brightness-110 active:scale-[0.99] glow-red",
            syncing && "opacity-70 cursor-wait",
          )}
        >
          {syncing ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <RefreshCw className="size-3.5" strokeWidth={2} />
          )}
          {syncing ? "SYNCING..." : "SYNC_SENSORS"}
        </button>
      </div>

      {/* Footer build strip */}
      <div className="border-t border-apex-border px-4 py-3 flex items-center justify-between">
        <p className="label-mono !text-[10px] truncate">{APEX_BUILD}</p>
        <Link
          href="/collector"
          className="label-mono hover:text-apex-red transition-colors"
        >
          COLLECTOR
        </Link>
      </div>
    </aside>
  );
}
