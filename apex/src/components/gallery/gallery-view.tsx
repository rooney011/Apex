"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { Lap } from "@/lib/data/types";
import { EraStory } from "./era-story";
import { FieldNotes } from "./field-notes";
import { GalleryCard } from "./gallery-card";
import { LapInspector } from "./lap-inspector";

type Props = { laps: Lap[] };

const ease = [0.22, 1, 0.36, 1] as const;

export function GalleryView({ laps }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = openId ? laps.find((l) => l.id === openId) ?? null : null;

  return (
    <div className="relative min-h-full px-6 lg:px-10 py-8">
      {/* Header */}
      <header className="mb-10">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="label-mono text-apex-red"
        >
          MODULE // GALLERY
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="font-sans text-5xl md:text-6xl font-black tracking-tight mt-2"
          style={{ letterSpacing: "-0.03em" }}
        >
          The Apex{" "}
          <span className="italic font-serif text-apex-red">Narrative</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="font-serif text-foreground/75 mt-4 max-w-2xl text-[15px] leading-relaxed"
        >
          Every fast lap in Formula 1 has its own signature — built from GPS,
          throttle, brake and speed. The cards below render those signatures
          directly from the baked telemetry. Click any lap to inspect it.
        </motion.p>
      </header>

      {/* Featured era story */}
      <div className="mb-14">
        <EraStory laps={laps} onOpen={setOpenId} />
      </div>

      {/* All laps grid */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="label-mono text-apex-red">ALL_LAPS</p>
            <h2 className="font-sans text-2xl font-bold tracking-tight mt-1">
              The collection
            </h2>
          </div>
          <p className="label-mono">{laps.length} laps baked</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {laps.map((lap, i) => (
            <GalleryCard
              key={lap.id}
              lap={lap}
              index={i}
              onOpen={setOpenId}
            />
          ))}
        </div>
      </section>

      {/* Field notes editorial strip */}
      <FieldNotes />

      {/* Inspector drawer */}
      <LapInspector lap={open} onClose={() => setOpenId(null)} />
    </div>
  );
}
