"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const ease = [0.22, 1, 0.36, 1] as const;

const NOTES = [
  {
    src: "/photos/02_tire.png",
    kicker: "FIELD_NOTE_01",
    title: "Asphalt friction coefficient",
    body: "The fingerprint's brake bursts are tyre temperature talking out loud — every red dot is a moment the contact patch hit its operational ceiling.",
  },
  {
    src: "/photos/03_cockpit_pov.png",
    kicker: "FIELD_NOTE_02",
    title: "The geometry of a split second",
    body: "Every turn-in point on the ribbon is a frame from the driver's eye. Telemetry strips emotion out of the equation; the fingerprint puts it back.",
  },
  {
    src: "/photos/04_garage.png",
    kicker: "FIELD_NOTE_03",
    title: "Synchronisation, not surveillance",
    body: "Race engineers see exactly this — channels in lockstep, layered until a pattern emerges. APEX is the same architecture, rebuilt for an audience of one.",
  },
  {
    src: "/photos/05_pu.png",
    kicker: "FIELD_NOTE_04",
    title: "Power unit signature",
    body: "1.6L V6 turbo hybrid. The white-hot stretches of the ribbon are the MGU-K and MGU-H working in concert with the combustion side.",
  },
];

export function FieldNotes() {
  return (
    <section className="mt-14">
      <header className="flex items-end justify-between mb-5">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease }}
            className="label-mono text-apex-red"
          >
            FIELD_NOTES
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease }}
            className="font-sans text-3xl md:text-4xl font-bold tracking-tight mt-2"
          >
            What the data is{" "}
            <span className="italic font-serif text-apex-red">actually</span>{" "}
            saying
          </motion.h2>
        </div>
        <p className="label-mono hidden md:block">04_ENTRIES</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NOTES.map((n, i) => (
          <motion.article
            key={n.src}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.06, ease }}
            className="panel relative overflow-hidden group"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={n.src}
                alt={n.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(6,6,10,0.0) 35%, rgba(6,6,10,0.85) 100%)",
                }}
              />
              <div className="absolute left-4 bottom-4">
                <p className="label-mono text-apex-red">{n.kicker}</p>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-sans text-xl font-bold tracking-tight">
                {n.title}
              </h3>
              <p className="font-serif text-[14px] leading-relaxed text-foreground/80 mt-2">
                {n.body}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
