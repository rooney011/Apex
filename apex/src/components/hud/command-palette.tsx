"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Circle,
  Compass,
  CornerDownLeft,
  Flame,
  Gauge,
  Home,
  Images,
  Info,
  Layers,
  Library,
  RefreshCw,
  Search,
  SkipBack,
  Slash,
  type LucideIcon,
  Radar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLapIndex } from "@/lib/data/client";
import type { LapSummary } from "@/lib/data/types";
import { useScrubStore, type ChannelId } from "@/lib/store/scrub";
import { cn } from "@/lib/utils";
import { showToast } from "./toast";

type CommandGroup = "navigate" | "channels" | "actions" | "laps";

type Command = {
  id: string;
  title: string;
  subtitle?: string;
  group: CommandGroup;
  icon: LucideIcon;
  accent?: string;
  meta?: string;
  keywords?: string[];
  run: () => void;
};

const GROUP_LABEL: Record<CommandGroup, string> = {
  navigate: "NAVIGATE",
  channels: "CHANNELS",
  actions: "ACTIONS",
  laps: "LAPS",
};

const GROUP_ORDER: CommandGroup[] = ["navigate", "channels", "actions", "laps"];

const CHANNEL_ICON: Record<ChannelId, LucideIcon> = {
  velocity: Activity,
  gforce: Compass,
  throttle: Flame,
  braking: Slash,
  sectors: Radar,
};

export function CommandPalette() {
  const open = useScrubStore((s) => s.paletteOpen);
  const setOpen = useScrubStore((s) => s.setPaletteOpen);
  const activeLapId = useScrubStore((s) => s.activeLapId);
  const setActiveLapId = useScrubStore((s) => s.setActiveLapId);
  const setActiveChannel = useScrubStore((s) => s.setActiveChannel);
  const setScrubDistance = useScrubStore((s) => s.setScrubDistance);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useLapIndex();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Build the command set every render so it stays in sync with the lap index. */
  const allCommands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];

    /* Navigate */
    cmds.push(
      navCommand("nav-hero", "Go to Hero", Home, "/", router, ["home", "landing"]),
      navCommand("nav-telemetry", "Go to Telemetry", Gauge, "/telemetry", router, [
        "data",
        "charts",
      ]),
      navCommand("nav-gallery", "Go to Gallery", Images, "/gallery", router, [
        "fingerprints",
      ]),
      navCommand("nav-canvas", "Go to Canvas", Layers, "/canvas", router, [
        "generative",
        "lab",
        "render",
      ]),
      navCommand("nav-collector", "Go to Collector", Library, "/collector", router, [
        "saved",
        "presets",
      ]),
      navCommand("nav-about", "Go to About", Info, "/about", router, [
        "help",
        "guide",
        "docs",
        "how to",
        "shortcuts",
      ]),
    );

    /* Channels */
    const channels: { id: ChannelId; label: string; code: string }[] = [
      { id: "velocity", label: "VELOCITY", code: "CH_01" },
      { id: "gforce", label: "G-FORCE", code: "CH_02" },
      { id: "throttle", label: "THROTTLE", code: "CH_03" },
      { id: "braking", label: "BRAKING", code: "CH_04" },
      { id: "sectors", label: "SECTORS", code: "CH_05" },
    ];
    for (const ch of channels) {
      cmds.push({
        id: `ch-${ch.id}`,
        title: `Show ${ch.label}`,
        subtitle: `${ch.code} · in Telemetry`,
        group: "channels",
        icon: CHANNEL_ICON[ch.id],
        keywords: [ch.code.toLowerCase(), ch.label.toLowerCase()],
        run: () => {
          setActiveChannel(ch.id);
          router.push("/telemetry");
        },
      });
    }

    /* Actions */
    cmds.push(
      {
        id: "act-sync",
        title: "Sync sensors",
        subtitle: "Re-fetch the active lap from source",
        group: "actions",
        icon: RefreshCw,
        keywords: ["refresh", "reload", "cache", "bust"],
        run: () => {
          queryClient.invalidateQueries({ queryKey: ["lap", activeLapId] });
          queryClient.invalidateQueries({ queryKey: ["lap-index"] });
          showToast("Telemetry re-synced from source");
        },
      },
      {
        id: "act-snap-start",
        title: "Snap to start of lap",
        subtitle: "Move scrub to T=0",
        group: "actions",
        icon: SkipBack,
        keywords: ["beginning", "reset"],
        run: () => {
          setScrubDistance(0);
          router.push("/telemetry");
        },
      },
      {
        id: "act-open-canvas",
        title: "Open active lap in Canvas",
        subtitle: "Tune the render",
        group: "actions",
        icon: Layers,
        keywords: ["render", "tune", "lab"],
        run: () => router.push("/canvas"),
      },
    );

    /* Laps — uses the index payload so we don't have to load every lap JSON */
    if (data?.laps) {
      for (const l of data.laps) {
        cmds.push({
          id: `lap-${l.id}`,
          title: `${l.driver_name} · ${l.year} ${l.track}`,
          subtitle: `${l.race} · ${l.session} · ${l.lap_time_str}`,
          group: "laps",
          icon: Circle,
          accent: l.accent,
          meta: l.lap_time_str,
          keywords: lapKeywords(l),
          run: () => {
            setActiveLapId(l.id);
            router.push("/telemetry");
          },
        });
      }
    }

    return cmds;
  }, [router, queryClient, activeLapId, setActiveLapId, setActiveChannel, setScrubDistance, data]);

  /* Filter — contains-match across title / subtitle / keywords */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    const tokens = q.split(/\s+/).filter(Boolean);
    return allCommands.filter((c) => {
      const haystack = (
        c.title +
        " " +
        (c.subtitle ?? "") +
        " " +
        (c.keywords?.join(" ") ?? "")
      ).toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [allCommands, query]);

  /* Group filtered while preserving original order */
  const grouped = useMemo(() => {
    const g: Record<CommandGroup, Command[]> = {
      navigate: [],
      channels: [],
      actions: [],
      laps: [],
    };
    for (const c of filtered) g[c.group].push(c);
    return g;
  }, [filtered]);

  /* Reset selection when the result set changes */
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, allCommands.length]);

  /* Global ⌘K / Ctrl+K toggle */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  /* When open: ESC to close, arrows to move, Enter to execute */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[selectedIndex];
        if (cmd) {
          cmd.run();
          setOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, selectedIndex, setOpen]);

  /* Focus the input when opening, reset query when closing */
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery("");
    }
  }, [open]);

  /* Auto-scroll the selected row into view */
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${selectedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-apex-bg/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed left-1/2 top-[15vh] z-[61] -translate-x-1/2",
              "w-[92%] max-w-[620px] panel overflow-hidden",
              "shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-apex-border">
              <Search className="size-4 text-apex-muted" strokeWidth={1.6} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a lap, channel, action…"
                className="flex-1 bg-transparent outline-none font-sans text-[14px] placeholder:text-apex-muted/60"
              />
              <Kbd>ESC</Kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="label-mono px-4 py-10 text-center">no_matches</p>
              ) : (
                GROUP_ORDER.filter((g) => grouped[g].length > 0).map((g) => (
                  <div key={g} className="py-1">
                    <p className="label-mono px-4 py-1.5">{GROUP_LABEL[g]}</p>
                    {grouped[g].map((c) => {
                      const idx = filtered.indexOf(c);
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          data-cmd-index={idx}
                          onClick={() => {
                            c.run();
                            setOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            isSelected ? "bg-apex-surface-2" : "hover:bg-apex-surface-2/60",
                          )}
                        >
                          {/* Icon — accent dot for lap rows */}
                          {c.accent ? (
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{
                                background: c.accent,
                                boxShadow: `0 0 8px ${c.accent}88`,
                              }}
                            />
                          ) : (
                            <c.icon
                              className={cn(
                                "size-4 shrink-0",
                                isSelected ? "text-apex-red" : "text-apex-muted",
                              )}
                              strokeWidth={1.6}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-sans text-[13px] truncate",
                                isSelected ? "text-foreground" : "text-foreground/85",
                              )}
                            >
                              {c.title}
                            </p>
                            {c.subtitle && (
                              <p className="label-mono mt-0.5 !text-[9px] truncate">
                                {c.subtitle}
                              </p>
                            )}
                          </div>
                          {c.meta && (
                            <span className="font-mono text-[11px] text-apex-muted shrink-0">
                              {c.meta}
                            </span>
                          )}
                          {isSelected && (
                            <ArrowRight
                              className="size-3.5 text-apex-red shrink-0"
                              strokeWidth={2}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-apex-border bg-apex-bg/40">
              <div className="flex items-center gap-3 label-mono">
                <KbdRow>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd> navigate
                </KbdRow>
                <KbdRow>
                  <Kbd>
                    <CornerDownLeft className="size-2.5" strokeWidth={2} />
                  </Kbd>{" "}
                  execute
                </KbdRow>
                <KbdRow>
                  <Kbd>⌘K</Kbd> toggle
                </KbdRow>
              </div>
              <p className="label-mono">{filtered.length} results</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function navCommand(
  id: string,
  title: string,
  icon: LucideIcon,
  path: string,
  router: ReturnType<typeof useRouter>,
  keywords: string[] = [],
): Command {
  return {
    id,
    title,
    subtitle: path,
    group: "navigate",
    icon,
    keywords,
    run: () => router.push(path),
  };
}

function lapKeywords(l: LapSummary): string[] {
  return [
    l.driver_code,
    l.driver_name,
    l.track,
    l.race,
    l.session,
    String(l.year),
    l.team,
    l.compound ?? "",
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase());
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border border-apex-border bg-apex-bg font-mono text-[10px] text-apex-muted">
      {children}
    </span>
  );
}

function KbdRow({ children }: { children: ReactNode }) {
  return <span className="flex items-center gap-1.5">{children}</span>;
}
