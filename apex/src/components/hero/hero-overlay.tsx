"use client";

import { motion } from "framer-motion";
import { ArrowRight, MousePointerClick } from "lucide-react";
import Link from "next/link";
import type { Lap } from "@/lib/data/types";

type Props = { lap: Lap };

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroOverlay({ lap }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Top bar with brand + secondary nav */}
      <header className="pointer-events-auto absolute top-0 inset-x-0 px-6 py-5 flex items-start justify-between">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <h1 className="font-sans text-xl font-bold tracking-tight text-apex-red text-glow-red">
            APEX
          </h1>
          <p className="label-mono mt-1">FORMULA · 1 · TELEMETRY_OS</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="flex items-center gap-3"
        >
          <Link
            href="/gallery"
            className="label-mono hover:text-foreground transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/canvas"
            className="label-mono hover:text-foreground transition-colors"
          >
            Canvas
          </Link>
          <Link
            href="/telemetry"
            className="label-mono hover:text-foreground transition-colors"
          >
            Telemetry
          </Link>
        </motion.div>
      </header>

      {/* Centre block */}
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="w-full max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="label-mono"
          >
            ACTIVE_FEED &middot; HAMILTON &middot; SILVERSTONE 2020
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease }}
            className="font-sans text-6xl md:text-8xl font-black tracking-tight mt-4"
            style={{ letterSpacing: "-0.04em" }}
          >
            Every lap has a{" "}
            <span
              className="italic font-serif text-apex-red text-glow-red"
              style={{ fontStyle: "italic" }}
            >
              fingerprint.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease }}
            className="font-serif text-base md:text-lg text-foreground/75 mt-6 max-w-xl mx-auto leading-relaxed"
          >
            APEX takes raw Formula 1 telemetry and unfolds it as a 3D ribbon —
            elevation by speed, colour by throttle, red flares at every brake
            point. The pattern is unique to every driver, every lap.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95, ease }}
            className="pointer-events-auto mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/telemetry"
              className="group inline-flex items-center gap-3 rounded-md bg-apex-red text-white px-6 py-3.5 glow-red transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              <span className="label-mono !text-white">ENTER_TELEMETRY</span>
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-md border border-apex-border bg-apex-surface/60 backdrop-blur px-5 py-3 text-foreground hover:bg-apex-surface transition-colors"
            >
              <span className="label-mono">Browse the gallery</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom strip — lap stats + interaction hint */}
      <footer className="pointer-events-none absolute bottom-0 inset-x-0 px-6 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatPill
            label="LAP_TIME"
            value={lap.lap_time_str}
            delay={1.1}
            accent
          />
          <StatPill
            label="PEAK_VELOCITY"
            value={`${Math.round(Math.max(...lap.telemetry.speed))} km/h`}
            delay={1.18}
          />
          <StatPill
            label="TELEMETRY_PTS"
            value={lap.telemetry.samples.toString()}
            delay={1.26}
          />
          <StatPill
            label="ERA"
            value={lap.era}
            delay={1.34}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 1.6, ease }}
          className="mt-4 flex items-center justify-center gap-2 text-apex-muted"
        >
          <MousePointerClick className="size-3.5" strokeWidth={1.6} />
          <p className="label-mono">drag to orbit · scroll to zoom</p>
        </motion.div>
      </footer>
    </div>
  );
}

function StatPill({
  label,
  value,
  delay,
  accent,
}: {
  label: string;
  value: string;
  delay: number;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
      className="rounded border border-apex-border bg-apex-surface/55 backdrop-blur px-4 py-3"
    >
      <p className="label-mono">{label}</p>
      <p
        className={
          "font-mono text-base font-bold mt-1 truncate " +
          (accent ? "text-apex-red text-glow-red" : "text-foreground")
        }
      >
        {value}
      </p>
    </motion.div>
  );
}
