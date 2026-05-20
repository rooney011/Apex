"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

type Toast = {
  id: string;
  message: string;
  tone?: "success" | "error";
};

let counter = 0;
const listeners = new Set<(t: Toast) => void>();

export function showToast(message: string, tone: Toast["tone"] = "success"): void {
  const t: Toast = { id: `t${++counter}`, message, tone };
  listeners.forEach((fn) => fn(t));
}

/* Mount once near the root of a client-only route. Listens for `showToast()`
   calls anywhere in the tree and dismisses each after ~2.6s. */
export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const fn = (t: Toast) => {
      setItems((prev) => [...prev, t]);
      const id = window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, 2600);
      return () => window.clearTimeout(id);
    };
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={
              "pointer-events-auto panel px-4 py-3 flex items-center gap-3 " +
              (t.tone === "error" ? "border-apex-red" : "border-apex-border")
            }
          >
            <span
              className={
                "size-6 grid place-items-center rounded-full " +
                (t.tone === "error"
                  ? "bg-apex-red/20 text-apex-red"
                  : "bg-apex-green/20 text-apex-green")
              }
            >
              {t.tone === "error" ? (
                <X className="size-3" strokeWidth={2.4} />
              ) : (
                <Check className="size-3" strokeWidth={2.4} />
              )}
            </span>
            <p className="font-sans text-[13px] text-foreground">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
