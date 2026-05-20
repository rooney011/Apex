"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import type { Lap } from "@/lib/data/types";
import { FingerprintSVG } from "./fingerprint-svg";

type Props = {
  laps: Lap[];
  onOpen: (id: string) => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

/* Featured "Silverstone Through Eras" — filters the provided lap set to the
   four Silverstone poles and lays them out as a left-to-right timeline. */
export function EraStory({ laps, onOpen }: Props) {
  const silverstone = laps
    .filter((l) => l.track === "Silverstone")
    .sort((a, b) => a.year - b.year);

  if (silverstone.length === 0) return null;

  const fastest = silverstone.reduce(
    (best, l) => (l.lap_time_ms < best.lap_time_ms ? l : best),
    silverstone[0],
  );

  return (
    <section className="relative">
      <header className="relative mb-7 overflow-hidden rounded-lg border border-apex-border bg-apex-surface">
        {/* Aerial backdrop */}
        <div className="absolute inset-0">
          <Image
            src="/photos/06_silverstone_aerial.png"
            alt="Silverstone aerial"
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,6,10,0.5) 0%, rgba(6,6,10,0.85) 70%, rgba(6,6,10,0.98) 100%)",
            }}
          />
        </div>

        <div className="relative px-6 py-10">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease }}
            className="label-mono text-apex-red"
          >
            FEATURE_STORY · 001
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="font-sans text-4xl md:text-5xl font-bold tracking-tight mt-2"
          >
            Silverstone Through{" "}
            <span className="italic font-serif text-apex-red">Eras</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
            className="font-serif text-foreground/80 mt-4 max-w-2xl text-[15px] leading-relaxed"
          >
            Same circuit. Four pole laps. Read left to right and watch Formula
            1 itself evolve — late hybrid Mercedes to first-gen ground effect
            to today&apos;s RB21. The colour, the brake bursts and the
            geometry are all written into every metre.
          </motion.p>
        </div>
      </header>

      <div className="relative">
        {/* Timeline rail */}
        <div className="absolute left-0 right-0 top-[152px] h-px bg-gradient-to-r from-transparent via-apex-border to-transparent" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {silverstone.map((lap, i) => {
            const isFastest = lap.id === fastest.id;
            const deltaMs = lap.lap_time_ms - fastest.lap_time_ms;
            const delta =
              deltaMs === 0 ? "FASTEST" : `+${(deltaMs / 1000).toFixed(3)}s`;
            return (
              <motion.button
                key={lap.id}
                type="button"
                onClick={() => onOpen(lap.id)}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: 0.06 * i, ease }}
                whileHover={{ y: -4 }}
                className="group panel relative text-left p-4 transition-colors hover:border-apex-red/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="font-mono text-2xl font-black"
                    style={{ color: lap.accent }}
                  >
                    {lap.year}
                  </p>
                  <span
                    className={
                      "label-mono rounded border px-2 py-0.5 " +
                      (isFastest
                        ? "border-apex-red/60 text-apex-red text-glow-red"
                        : "border-apex-border")
                    }
                  >
                    {delta}
                  </span>
                </div>

                <p className="label-mono">{lap.era}</p>

                <div className="aspect-square w-full mt-3 mb-3 rounded bg-apex-bg overflow-hidden grid-overlay">
                  <FingerprintSVG lap={lap} size={300} segments={140} />
                </div>

                {/* Timeline pip */}
                <div className="flex items-center justify-center -mt-1 mb-2">
                  <div
                    className="size-2.5 rounded-full ring-2 ring-apex-bg"
                    style={{
                      background: lap.accent,
                      boxShadow: `0 0 12px ${lap.accent}88`,
                    }}
                  />
                </div>

                <p className="font-sans text-base font-semibold tracking-tight">
                  {lap.driver_name}
                </p>
                <p className="label-mono mt-0.5">
                  {lap.team || "—"} · {lap.lap_time_str}
                </p>

                <span className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight
                    className="size-3.5 text-apex-red"
                    strokeWidth={2}
                  />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, delay: 0.4, ease }}
        className="panel relative mt-6 p-5"
      >
        <div
          className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-apex-red to-transparent"
          aria-hidden
        />
        <p className="label-mono text-apex-red">FIELD_NOTE</p>
        <p className="font-serif text-[15px] leading-relaxed text-foreground/85 mt-2 max-w-3xl">
          The surprise hidden in the data:{" "}
          <span className="text-foreground font-semibold">
            {fastest.driver_name}&apos;s {fastest.year} lap is still the
            fastest pole at this venue
          </span>{" "}
          in the modern era. Four seasons of ground-effect cars have not matched
          the late-hybrid Mercedes here.
        </p>
      </motion.div>
    </section>
  );
}
