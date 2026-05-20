"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { APEX_BUILD, APEX_LOGO_SUB, CHANNELS } from "@/lib/nav";
import { useScrubStore } from "@/lib/store/scrub";
import { cn } from "@/lib/utils";

/* Replaces the hidden sidebar on mobile.
   Topbar renders the trigger; this component owns the drawer surface. */
export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const activeChannel = useScrubStore((s) => s.activeChannel);
  const setActiveChannel = useScrubStore((s) => s.setActiveChannel);

  /* Lock body scroll when open. Esc to dismiss. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex size-9 items-center justify-center rounded text-apex-muted hover:text-foreground hover:bg-apex-surface-2 transition-colors"
        aria-label="open navigation"
      >
        <Menu className="size-4" strokeWidth={1.6} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-apex-bg/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[280px] flex flex-col bg-apex-surface border-r border-apex-border md:hidden"
            >
              {/* Brand + close */}
              <div className="px-5 pt-6 pb-5 border-b border-apex-border flex items-start justify-between">
                <div>
                  <h1 className="font-sans text-2xl font-bold tracking-tight text-apex-red text-glow-red">
                    APEX
                  </h1>
                  <p className="label-mono mt-1.5">{APEX_LOGO_SUB}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="size-8 grid place-items-center rounded text-apex-muted hover:text-foreground hover:bg-apex-surface-2 transition-colors"
                  aria-label="close navigation"
                >
                  <X className="size-4" strokeWidth={1.6} />
                </button>
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
                          onClick={() => {
                            setActiveChannel(ch.id);
                            setOpen(false);
                          }}
                          className={cn(
                            "group relative w-full rounded-md border border-transparent",
                            "flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
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
                              "size-4",
                              isActive ? "text-apex-red" : "text-apex-muted",
                            )}
                            strokeWidth={1.6}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="label-mono leading-none">{ch.code}</p>
                            <p className="font-sans text-[13px] font-medium leading-tight mt-1">
                              {ch.label}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "label-mono",
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

              <div className="border-t border-apex-border px-4 py-3">
                <p className="label-mono !text-[10px] truncate">{APEX_BUILD}</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
