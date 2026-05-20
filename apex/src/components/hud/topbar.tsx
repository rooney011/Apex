"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Library, Search } from "lucide-react";
import { HERO_LAP_TIME, TOP_TABS } from "@/lib/nav";
import { useScrubStore } from "@/lib/store/scrub";
import { cn } from "@/lib/utils";
import { MobileDrawer } from "./mobile-drawer";

export function Topbar() {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "relative z-50 h-14 shrink-0 border-b border-apex-border bg-apex-surface/80 backdrop-blur",
        "flex items-center gap-2 sm:gap-3 px-3 sm:px-4",
      )}
    >
      <MobileDrawer />

      {/* Lap-time pill — only on lg+ where there's space */}
      <div className="hidden lg:flex items-center gap-3 pr-4 border-r border-apex-border">
        <span className="label-mono">LAP_TIME</span>
        <span className="font-mono text-base font-bold tracking-wider text-foreground">
          {HERO_LAP_TIME}
        </span>
        <span className="relative flex size-2">
          <span className="absolute inset-0 rounded-full bg-apex-red animate-ping opacity-60" />
          <span className="relative rounded-full size-2 bg-apex-red" />
        </span>
      </div>

      {/* Tab nav — horizontally scrollable on tiny widths so it never breaks */}
      <nav className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {TOP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "group relative flex items-center gap-1.5 sm:gap-2 rounded-md px-2 sm:px-3 py-1.5 shrink-0",
                "font-sans text-[13px] font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-apex-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.6} />
              {/* Hide labels on very narrow screens; icons keep the row scannable */}
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              <span
                className={cn(
                  "absolute -bottom-[15px] left-2 right-2 h-[2px] rounded-full transition-all",
                  isActive
                    ? "bg-apex-red opacity-100 glow-red"
                    : "opacity-0 group-hover:opacity-30 bg-apex-muted",
                )}
              />
            </Link>
          );
        })}
      </nav>

      {/* Live strip — hidden under md to keep the topbar from cramming */}
      <LiveStrip />

      {/* Right tools — only md+ have room for them */}
      <div className="hidden md:flex items-center gap-1 border-l border-apex-border pl-3 shrink-0">
        <CommandPaletteTrigger />
        <NotificationsButton />
        <Link
          href="/collector"
          aria-label="Open your collection"
          title="Open your collection"
          className="flex size-8 items-center justify-center rounded-md text-apex-muted hover:text-foreground hover:bg-apex-surface-2 transition-colors"
        >
          <Library className="size-4" strokeWidth={1.6} />
        </Link>
      </div>
    </header>
  );
}

/* Search button: just trips the global palette open. Keyboard ⌘K / Ctrl+K
   is handled by the palette itself. */
function CommandPaletteTrigger() {
  const setOpen = useScrubStore((s) => s.setPaletteOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      title="Open command palette (⌘K / Ctrl+K)"
      aria-label="Open command palette"
      className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-md text-apex-muted hover:text-foreground hover:bg-apex-surface-2 transition-colors"
    >
      <Search className="size-3.5" strokeWidth={1.6} />
      <span className="label-mono hidden lg:inline">SEARCH</span>
      <span className="hidden lg:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border border-apex-border bg-apex-bg font-mono text-[10px] text-apex-muted">
        ⌘K
      </span>
    </button>
  );
}

/* Bell: tiny popover showing the OpenF1 next-session info. */
function NotificationsButton() {
  const [open, setOpen] = useState(false);
  /* The popover content reuses the same value the topbar countdown computes
     (a fake "next Sunday 14:00"). When the FastAPI backend is up the strip
     swap is one line. */
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Upcoming sessions"
        aria-label="Notifications"
        className="relative flex size-8 items-center justify-center rounded-md text-apex-muted hover:text-foreground hover:bg-apex-surface-2 transition-colors"
      >
        <Bell className="size-4" strokeWidth={1.6} />
        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-apex-amber" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 panel p-4">
            <p className="label-mono text-apex-red mb-2">NOTIFICATIONS</p>
            <div className="space-y-3">
              <div>
                <p className="label-mono text-apex-amber">NEXT_SESSION</p>
                <p className="font-sans text-[13px] mt-0.5">
                  Live countdown in topbar. Sourced from OpenF1 via{" "}
                  <code className="font-mono text-apex-red">/api/live/next-session</code>,
                  cached 60s.
                </p>
              </div>
              <div className="border-t border-apex-border pt-3">
                <p className="label-mono text-apex-green">DATA_SOURCES</p>
                <p className="font-mono text-[11px] mt-0.5 text-apex-muted">
                  FastF1 · OpenF1 · Jolpica
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type LiveSession = {
  session_name: string | null;
  session_type: string | null;
  country: string | null;
  circuit: string | null;
  date_start: string | null;
};

type LiveStatus = "loading" | "ok" | "empty" | "error";

async function fetchNextSession(
  attempt = 0,
): Promise<{ status: LiveStatus; session: LiveSession | null }> {
  try {
    const res = await fetch("/api/live/next-session", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`status ${res.status}`);
    }
    const data = await res.json();
    if (data?.session?.date_start) {
      return { status: "ok", session: data.session as LiveSession };
    }
    /* Route handler explicitly returned no upcoming session — true offseason. */
    return { status: "empty", session: null };
  } catch {
    /* Retry up to twice with a small backoff before declaring failure. */
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      return fetchNextSession(attempt + 1);
    }
    return { status: "error", session: null };
  }
}

function LiveStrip() {
  /* Live tick for the countdown */
  const [now, setNow] = useState<Date | null>(null);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [status, setStatus] = useState<LiveStatus>("loading");

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { status, session } = await fetchNextSession();
      if (!alive) return;
      setStatus(status);
      setSession(session);
    };
    load();
    /* Re-pull every 5 minutes so the countdown doesn't stale if the page
       stays open for hours. */
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!now || status === "loading") {
    return (
      <div className="hidden lg:flex items-center gap-3 rounded-md border border-apex-border px-3 py-1.5 shrink-0">
        <span className="label-mono text-apex-muted">NEXT_SESSION</span>
        <span className="font-mono text-[12px] text-foreground">--:--:--</span>
      </div>
    );
  }

  /* Truly no upcoming session (route returned 200 + session=null). */
  if (status === "empty") {
    return (
      <div className="hidden lg:flex items-center gap-3 rounded-md border border-apex-border px-3 py-1.5 shrink-0">
        <span className="label-mono text-apex-muted">CALENDAR</span>
        <span className="font-mono text-[12px] text-foreground">OFFSEASON</span>
      </div>
    );
  }

  /* Couldn't reach the upstream — say so, don't lie about offseason. */
  if (status === "error" || !session?.date_start) {
    return (
      <div className="hidden lg:flex items-center gap-3 rounded-md border border-apex-border px-3 py-1.5 shrink-0">
        <span className="label-mono text-apex-muted">DATA</span>
        <span className="font-mono text-[12px] text-apex-amber">OFFLINE</span>
        <span className="size-1.5 rounded-full bg-apex-amber animate-pulse" />
      </div>
    );
  }

  const target = new Date(session.date_start);
  const ms = Math.max(0, target.getTime() - now.getTime());
  const dd = Math.floor(ms / 86400000);
  const hh = Math.floor((ms / 3600000) % 24);
  const mm = Math.floor((ms / 60000) % 60);
  const ss = Math.floor((ms / 1000) % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");

  const tag = session.country
    ? `${session.country.toUpperCase()} · ${session.session_name?.toUpperCase() ?? "SESSION"}`
    : "NEXT_SESSION";

  return (
    <div
      className="hidden lg:flex items-center gap-3 rounded-md border border-apex-border px-3 py-1.5 shrink-0"
      title={
        session.session_name && session.circuit
          ? `${session.session_name} · ${session.circuit}`
          : "Next F1 session"
      }
    >
      <span className="label-mono text-apex-muted truncate max-w-[160px]">{tag}</span>
      <span className="font-mono text-[12px] text-foreground tracking-wider">
        {dd}d&nbsp;{pad(hh)}:{pad(mm)}:{pad(ss)}
      </span>
      <span className="size-1.5 rounded-full bg-apex-amber animate-pulse" />
    </div>
  );
}
