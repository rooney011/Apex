"use client";

import { motion } from "framer-motion";
import { Library, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { showToast } from "@/components/hud/toast";
import {
  clearAll,
  loadAll,
  onCollectorChange,
  type SavedPreset,
} from "@/lib/collector/storage";
import { SavedCard } from "./saved-card";

const ease = [0.22, 1, 0.36, 1] as const;

export function CollectorView() {
  const [presets, setPresets] = useState<SavedPreset[] | null>(null);

  /* Initial load + reactive refresh on storage changes (this tab + other tabs). */
  useEffect(() => {
    setPresets(loadAll());
    const off = onCollectorChange(() => setPresets(loadAll()));
    return off;
  }, []);

  const onClear = () => {
    if (!presets || presets.length === 0) return;
    if (
      !window.confirm(
        `Delete all ${presets.length} preset${presets.length === 1 ? "" : "s"}? This can't be undone.`,
      )
    )
      return;
    clearAll();
    showToast("Collector cleared");
  };

  return (
    <div className="relative min-h-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="label-mono text-apex-red"
          >
            MODULE // COLLECTOR
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-2"
          >
            Your{" "}
            <span className="italic font-serif text-apex-red">Collection</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="font-serif text-foreground/75 mt-3 max-w-xl text-[14px] leading-relaxed"
          >
            Personal archive of saved render presets. Each entry lives in your
            browser — share the URL to send a preset to someone else, and they
            can open the exact render in their own Canvas.
          </motion.p>
        </div>

        {presets && presets.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="label-mono">COUNT</p>
              <p className="font-mono text-sm font-bold mt-0.5">
                {presets.length}
              </p>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1.5 rounded border border-apex-border px-3 py-2 text-apex-muted hover:text-apex-red hover:border-apex-red transition-colors"
            >
              <Trash2 className="size-3.5" strokeWidth={1.6} />
              <span className="label-mono">CLEAR_ALL</span>
            </button>
          </div>
        )}
      </header>

      {presets === null ? (
        <LoadingState />
      ) : presets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {presets.map((p, i) => (
            <SavedCard key={p.id} preset={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="panel py-16 grid place-items-center">
      <p className="label-mono text-apex-muted">READING_LOCAL_STORAGE</p>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="panel relative overflow-hidden p-12 grid place-items-center grid-overlay"
    >
      <div className="text-center max-w-md">
        <div className="inline-flex size-14 rounded-md border border-apex-border bg-apex-bg/60 grid place-items-center mb-5">
          <Library className="size-6 text-apex-red" strokeWidth={1.6} />
        </div>
        <h2 className="font-sans text-2xl font-bold tracking-tight">
          The collection is empty
        </h2>
        <p className="font-serif text-foreground/75 mt-2 leading-relaxed">
          Open the Canvas, tune the render until it feels right, and hit{" "}
          <span className="font-mono text-apex-red">SAVE</span>. Your presets
          land here.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <Link
            href="/canvas"
            className="inline-flex items-center gap-2 rounded-md bg-apex-red text-white px-5 py-2.5 glow-red transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <span className="label-mono !text-white">OPEN_CANVAS</span>
          </Link>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded border border-apex-border px-4 py-2 text-foreground hover:bg-apex-surface-2 transition-colors"
          >
            <span className="label-mono">Browse Gallery</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
