"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Splash() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    /* Hold the splash long enough for fonts + the first frame of the video to
       land — most browsers cache after the first visit. */
    const t = setTimeout(() => setIsVisible(false), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="apex-splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] grid place-items-center bg-apex-bg overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,24,1,0.10), transparent 70%), #06060a",
          }}
        >
          {/* Looping video backdrop */}
          <video
            src="/video/splash_loop.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-45"
            aria-hidden
          />
          {/* Tint over video to keep the foreground readable */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(6,6,10,0.4) 0%, rgba(6,6,10,0.95) 80%)",
            }}
            aria-hidden
          />

          <div className="relative flex flex-col items-center gap-6">
            <SpinnerMark />
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center"
            >
              <p className="font-sans text-3xl font-bold tracking-tight text-apex-red text-glow-red">
                APEX
              </p>
              <p className="label-mono mt-2">INITIALISING_HUD</p>
            </motion.div>
            <DotsLoader />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SpinnerMark() {
  return (
    <svg
      viewBox="0 0 80 80"
      width="64"
      height="64"
      className="text-apex-red"
      aria-hidden
    >
      <circle
        cx="40"
        cy="40"
        r="30"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />
      <motion.circle
        cx="40"
        cy="40"
        r="30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="60 200"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "40px 40px" }}
      />
      <circle cx="40" cy="40" r="3" fill="currentColor" />
    </svg>
  );
}

function DotsLoader() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-apex-red"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.2,
            delay: i * 0.18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
