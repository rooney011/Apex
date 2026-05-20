"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Lap } from "@/lib/data/types";
import { FingerprintSVG } from "./fingerprint-svg";

type Props = {
  lap: Lap;
  index: number;
  onOpen: (id: string) => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function GalleryCard({ lap, index, onOpen }: Props) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(lap.id)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.05, ease }}
      whileHover={{ y: -4 }}
      className="group panel relative text-left p-5 overflow-hidden transition-colors hover:border-apex-red/40"
    >
      {/* Accent bar */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{
          background: lap.accent,
          boxShadow: `0 0 18px ${lap.accent}66`,
        }}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="label-mono">
            {lap.year} · {lap.session}_SESSION
          </p>
          <p
            className="font-sans text-xl font-bold tracking-tight mt-1"
            style={{ color: "#ffffff" }}
          >
            {lap.driver_name}
          </p>
          <p className="label-mono mt-1 !text-[10px] text-apex-muted">
            {lap.team || "—"} · {lap.track}
          </p>
        </div>
        <p
          className="font-mono text-sm font-bold rounded border border-apex-border px-2 py-1 text-foreground"
          style={{ color: lap.accent }}
        >
          {lap.lap_time_str}
        </p>
      </div>

      <div className="aspect-square w-full rounded bg-apex-bg overflow-hidden grid-overlay relative">
        <FingerprintSVG lap={lap} size={320} segments={160} />
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${lap.accent}18, transparent 65%)`,
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="label-mono truncate">
          {lap.era || "—"}
        </p>
        <span className="flex items-center gap-1 label-mono text-apex-muted group-hover:text-apex-red transition-colors">
          INSPECT
          <ArrowUpRight className="size-3" strokeWidth={2} />
        </span>
      </div>
    </motion.button>
  );
}
