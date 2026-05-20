"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { APEX_BUILD, APEX_LOGO_SUB, CHANNELS } from "@/lib/nav";
import { useScrubStore } from "@/lib/store/scrub";
import { cn } from "@/lib/utils";

/* Replaces the hidden sidebar on mobile.
   Topbar renders the trigger; the drawer surface itself is portalled to
   document.body so it escapes any stacking context further up the tree
   (the topbar has `relative z-50` which would otherwise trap it). */
export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const activeChannel = useScrubStore((s) => s.activeChannel);
  const setActiveChannel = useScrubStore((s) => s.setActiveChannel);
  const pathname = usePathname();
  const aboutActive = pathname === "/about";

  /* Portal target only exists in the browser */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Close on route change so the user actually sees what they navigated to */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Lock body scroll while open + ESC to dismiss */
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

  const drawer = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mdrawer-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[90] bg-apex-bg/70 backdrop-blur-sm md:hidden"
          />
          <motion.aside
            key="mdrawer-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 top-0 bottom-0 z-[100] w-[280px] max-w-[85vw] flex flex-col bg-apex-surface border-r border-apex-border md:hidden shadow-[20px_0_60px_rgba(0,0,0,0.5)]"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
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
            <nav className="flex-1 px-3 py-4 overflow-y-auto overscroll-contain">
              <p className="label-mono px-2 pb-3">TELEMETRY · CHANNELS</p>
              <ul className="flex flex-col gap-1">
                {CHANNELS.map((ch) => {
                  const isActive = activeChannel === ch.id;
                  const Icon = ch.icon;
                  return (
                    <li key={ch.id}>
                      <Link
                        href="/telemetry"
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
                            isActive
                              ? "bg-apex-red glow-red opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <Icon
                          className={cn(
                            "size-4 shrink-0",
                            isActive ? "text-apex-red" : "text-apex-muted",
                          )}
                          strokeWidth={1.6}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="label-mono leading-none">{ch.code}</p>
                          <p className="font-sans text-[13px] font-medium leading-tight mt-1 truncate">
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
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Quick routes — gives mobile users access to every module */}
              <div className="mt-5 pt-4 border-t border-apex-border/70">
                <p className="label-mono px-2 pb-2">MODULES</p>
                <ul className="flex flex-col gap-1">
                  <DrawerLink
                    href="/telemetry"
                    label="Telemetry"
                    code="01"
                    active={pathname === "/telemetry"}
                    onClick={() => setOpen(false)}
                  />
                  <DrawerLink
                    href="/gallery"
                    label="Gallery"
                    code="02"
                    active={pathname === "/gallery"}
                    onClick={() => setOpen(false)}
                  />
                  <DrawerLink
                    href="/canvas"
                    label="Canvas"
                    code="03"
                    active={pathname === "/canvas"}
                    onClick={() => setOpen(false)}
                  />
                  <DrawerLink
                    href="/collector"
                    label="Collector"
                    code="04"
                    active={pathname === "/collector"}
                    onClick={() => setOpen(false)}
                  />
                </ul>
              </div>

              {/* About */}
              <div className="mt-5 pt-4 border-t border-apex-border/70">
                <p className="label-mono px-2 pb-2">SUPPORT</p>
                <Link
                  href="/about"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group relative w-full rounded-md border border-transparent",
                    "flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    aboutActive
                      ? "bg-apex-bg border-apex-border"
                      : "hover:bg-apex-bg/60",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-opacity",
                      aboutActive ? "bg-apex-red glow-red opacity-100" : "opacity-0",
                    )}
                  />
                  <Info
                    className={cn(
                      "size-4 shrink-0",
                      aboutActive ? "text-apex-red" : "text-apex-muted",
                    )}
                    strokeWidth={1.6}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="label-mono leading-none">DOC_00</p>
                    <p className="font-sans text-[13px] font-medium leading-tight mt-1">
                      About APEX
                    </p>
                  </div>
                  <span className="relative flex size-2 shrink-0">
                    {!aboutActive && (
                      <span className="absolute inset-0 rounded-full bg-apex-red animate-ping opacity-60" />
                    )}
                    <span
                      className={cn(
                        "relative rounded-full size-2",
                        aboutActive ? "bg-apex-muted" : "bg-apex-red",
                      )}
                    />
                  </span>
                </Link>
              </div>
            </nav>

            <div className="border-t border-apex-border px-4 py-3">
              <p className="label-mono !text-[10px] truncate">{APEX_BUILD}</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex size-9 items-center justify-center rounded text-apex-muted hover:text-foreground hover:bg-apex-surface-2 transition-colors shrink-0"
        aria-label="open navigation"
        aria-expanded={open}
      >
        <Menu className="size-4" strokeWidth={1.6} />
      </button>
      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}

function DrawerLink({
  href,
  label,
  code,
  active,
  onClick,
}: {
  href: string;
  label: string;
  code: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "group relative w-full rounded-md border border-transparent",
          "flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
          active ? "bg-apex-bg border-apex-border" : "hover:bg-apex-bg/60",
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-opacity",
            active ? "bg-apex-red glow-red opacity-100" : "opacity-0",
          )}
        />
        <span
          className={cn(
            "font-mono text-[10px] tracking-[0.18em] shrink-0 w-6",
            active ? "text-apex-red" : "text-apex-muted",
          )}
        >
          {code}
        </span>
        <p className="font-sans text-[13px] font-medium flex-1 min-w-0 truncate">
          {label}
        </p>
        {active && (
          <span className="label-mono text-apex-red shrink-0">HERE</span>
        )}
      </Link>
    </li>
  );
}
