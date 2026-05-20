"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookmarkPlus,
  Compass,
  Database,
  Download,
  Flame,
  Gauge,
  Images,
  Keyboard,
  Layers,
  Library,
  Link2,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

export function AboutView() {
  return (
    <div className="relative min-h-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[1280px] mx-auto">
      <Header />

      <Section
        anchor="story"
        kicker="STORY · 001"
        title={
          <>
            What is{" "}
            <span className="italic font-serif text-apex-red">APEX</span>?
          </>
        }
      >
        <Lede>
          APEX is a personal project that turns raw Formula 1 telemetry into a
          race engineer&apos;s operating system — for an audience of one.
          Every fast lap streams a wall of data: GPS, throttle, brake, speed,
          gear, RPM, DRS. Engineering teams see that data live, in lockstep,
          and it&apos;s how they make a fast car faster. APEX takes the same
          architecture and rebuilds it for a fan who wants to feel the lap
          rather than just watch it.
        </Lede>
        <Body>
          The product is split into five modules. Each one shows the same
          telemetry through a different lens — a 3D opener, a working cockpit,
          an editorial gallery, a generative lab, and a personal library. The
          underlying lap is the same; the way you read it is different.
        </Body>
      </Section>

      <ModulesGrid />

      <Section
        anchor="howto"
        kicker="FIELD_GUIDE"
        title={
          <>
            How to <span className="italic font-serif text-apex-red">drive</span>{" "}
            it
          </>
        }
      >
        <Lede>
          The site auto-loads with Hamilton&apos;s 2020 Silverstone pole as the
          default lap. Most actions ripple across modules — pick a lap in the
          Gallery, switch to Telemetry, and you&apos;re looking at the same
          lap there too.
        </Lede>
      </Section>

      <HowToHud />
      <HowToTelemetry />
      <HowToGallery />
      <HowToCanvas />
      <HowToCollector />

      <SyncSensorsSection />

      <ShortcutsSection />

      <DataSources />

      <TechStack />

      <CreditsSection />
    </div>
  );
}

/* ----------------------------- pieces ----------------------------- */

function Header() {
  return (
    <header className="mb-12">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="label-mono text-apex-red"
      >
        MODULE // ABOUT
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="font-sans text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mt-2"
        style={{ letterSpacing: "-0.03em" }}
      >
        A field guide to{" "}
        <span className="italic font-serif text-apex-red">APEX</span>.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease }}
        className="font-serif text-foreground/75 mt-4 max-w-2xl text-[15px] leading-relaxed"
      >
        What this is. Why it exists. What every button does — including the
        red <span className="font-mono text-apex-red">SYNC_SENSORS</span>{" "}
        that nobody asked about. Skim or read it through.
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.25, ease }}
        className="label-mono mt-3"
      >
        BUILT_BY{" "}
        <a
          href="https://github.com/rooney011"
          target="_blank"
          rel="noopener noreferrer"
          className="text-apex-red hover:text-foreground transition-colors"
        >
          ANEESH
        </a>{" "}
        · ONE_PERSON_ENGINEERING_TEAM
      </motion.p>

      <nav className="mt-7 flex flex-wrap gap-2">
        {[
          { href: "#story", label: "The story" },
          { href: "#modules", label: "Five modules" },
          { href: "#howto", label: "How to use" },
          { href: "#sync", label: "SYNC_SENSORS" },
          { href: "#shortcuts", label: "Shortcuts" },
          { href: "#data", label: "Data sources" },
          { href: "#stack", label: "Tech stack" },
          { href: "#credits", label: "Credits" },
        ].map((j) => (
          <a
            key={j.href}
            href={j.href}
            className="label-mono rounded border border-apex-border bg-apex-surface px-2.5 py-1.5 hover:border-apex-red hover:text-apex-red transition-colors"
          >
            {j.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function ModulesGrid() {
  const items: Array<{
    href: string;
    icon: LucideIcon;
    code: string;
    title: string;
    body: string;
    accent: string;
  }> = [
    {
      href: "/",
      icon: Sparkles,
      code: "00",
      title: "Hero",
      body: "The 3D landing. F1 car GLB lit by an HDRI, bloom + chromatic aberration, slow orbit. Click-drag to fly the camera.",
      accent: "#ff1801",
    },
    {
      href: "/telemetry",
      icon: Gauge,
      code: "01",
      title: "Telemetry",
      body: "The cockpit. Velocity / G-force / throttle / brake / sectors, scrub bar, live diagnostic readouts, sequential log.",
      accent: "#00e8ff",
    },
    {
      href: "/gallery",
      icon: Images,
      code: "02",
      title: "Gallery",
      body: "Generative fingerprints from telemetry. Featured era story for Silverstone, full lap grid, inspector drawer.",
      accent: "#7bf2b8",
    },
    {
      href: "/canvas",
      icon: Layers,
      code: "03",
      title: "Canvas",
      body: "Real-time render lab. Five palettes, four aspects, sliders for everything. Export PNG up to 4K or vector SVG.",
      accent: "#ffb84a",
    },
    {
      href: "/collector",
      icon: Library,
      code: "04",
      title: "Collector",
      body: "Personal library of saved presets. Share-link URLs that round-trip the full lap + parameter state.",
      accent: "#ff4a3a",
    },
  ];

  return (
    <section id="modules" className="mt-2 mb-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
        className="mb-5"
      >
        <p className="label-mono text-apex-red">MODULES · 005</p>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight mt-2">
          Five lenses on the{" "}
          <span className="italic font-serif text-apex-red">same lap</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it, i) => (
          <motion.div
            key={it.href}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: i * 0.05, ease }}
          >
            <Link
              href={it.href}
              className="group panel relative block p-5 hover:border-apex-red/50 transition-colors h-full"
            >
              <span
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{
                  background: it.accent,
                  boxShadow: `0 0 12px ${it.accent}66`,
                }}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <it.icon
                    className="size-4 text-apex-red"
                    strokeWidth={1.7}
                  />
                  <p className="label-mono">MODULE · {it.code}</p>
                </div>
                <ArrowRight
                  className="size-3.5 text-apex-muted group-hover:text-apex-red group-hover:translate-x-1 transition-all"
                  strokeWidth={2}
                />
              </div>
              <h3 className="font-sans text-xl font-bold tracking-tight">
                {it.title}
              </h3>
              <p className="font-serif text-[14px] text-foreground/80 mt-2 leading-relaxed">
                {it.body}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- how-to ---------------------------- */

function HowToHud() {
  return (
    <Section
      anchor="howto-hud"
      kicker="00 · THE HUD SHELL"
      title="The bones of every screen"
      tight
    >
      <Body>
        Across Telemetry, Gallery, Canvas, Collector and this page, the same
        chrome wraps everything:
      </Body>
      <Steps>
        <Step
          n="01"
          title="Sidebar (left)"
          body="The APEX logomark, the five telemetry channels (Velocity / G-Force / Throttle / Braking / Sectors), the red SYNC_SENSORS button, and a link to your Collector."
        />
        <Step
          n="02"
          title="Topbar (top)"
          body={
            <>
              Lap-time pill on the far left, tab nav (Telemetry, Gallery,
              Canvas, Collector, About), the NEXT_SESSION countdown, then the
              right-side tools: <Mono>SEARCH</Mono> (opens the command
              palette), <Mono>BELL</Mono> (live data status popover), and{" "}
              <Mono>LIBRARY</Mono> (jumps to Collector).
            </>
          }
        />
        <Step
          n="03"
          title="Main content (centre)"
          body="Whatever route you're on lives here. Each module fills the space differently — Telemetry uses a two-column grid, Gallery is a card layout, Canvas splits into preview + controls."
        />
        <Step
          n="04"
          title="Footer (bottom)"
          body="Thin build strip showing the APEX OS version and data sources."
        />
        <Step
          n="05"
          title="Splash on first load"
          body="A short looping video of a car driving away in slow motion plays behind the APEX wordmark for ~1.8 seconds while fonts settle."
        />
        <Step
          n="06"
          title="On mobile"
          body="The sidebar collapses behind a hamburger button in the topbar. Tap it for the same channel nav as desktop."
        />
      </Steps>
    </Section>
  );
}

function HowToTelemetry() {
  return (
    <Section
      anchor="howto-telemetry"
      kicker="01 · TELEMETRY"
      title="The cockpit"
      tight
    >
      <Body>
        The main module. Read a lap channel by channel and scrub through it
        like a video editor would.
      </Body>
      <Steps>
        <Step
          n="01"
          title="Pick a lap"
          body={
            <>
              Click <Mono>ACTIVE_LAP</Mono> in the top-right (or use the
              command palette via <Mono>⌘K</Mono>). The dropdown lists every
              baked lap — driver, year, track, time. Selecting one resets the
              scrub to the moment of peak speed for dramatic first paint.
            </>
          }
        />
        <Step
          n="02"
          title="Switch channels"
          body={
            <>
              Click any of <Mono>VELOCITY</Mono> / <Mono>G-FORCE</Mono> /{" "}
              <Mono>THROTTLE</Mono> / <Mono>BRAKING</Mono> /{" "}
              <Mono>SECTORS</Mono> in the sidebar. The big centre chart
              swaps, the channel kicker updates, and the diagnostic prose on
              the right re-evaluates based on what&apos;s happening at the
              current scrub point.
            </>
          }
        />
        <Step
          n="03"
          title="Scrub through the lap"
          body={
            <>
              Drag the scrub bar at the bottom or click anywhere on the track.
              Arrow keys also work: <Mono>←</Mono>/<Mono>→</Mono> step 1%,{" "}
              <Mono>Shift</Mono>+arrow steps 5%, <Mono>Home</Mono>/
              <Mono>End</Mono> snap to the ends. The S1/S2/S3 markers are
              tick lines on the scrub track.
            </>
          }
        />
        <Step
          n="04"
          title="Read the diagnostic panel (right)"
          body="Live readouts at the scrub point: speed, lat-G, throttle, brake state, gear, RPM, DRS, distance. Underneath, a SYSTEM_LOG paragraph that changes phrasing depending on whether the driver is braking, mid-corner, or at full throttle."
        />
        <Step
          n="05"
          title="Watch the sequential log"
          body="Eight rows of telemetry centered on your scrub position. The current row is highlighted red. Useful for seeing the exact sample-by-sample data."
        />
      </Steps>
    </Section>
  );
}

function HowToGallery() {
  return (
    <Section
      anchor="howto-gallery"
      kicker="02 · GALLERY"
      title="The narrative"
      tight
    >
      <Steps>
        <Step
          n="01"
          title="Browse the featured story"
          body="The Silverstone Through Eras strip at the top tells a curated story across four pole laps — Hamilton 2020 through Verstappen 2025. The fastest lap is flagged FASTEST; the rest show a delta."
        />
        <Step
          n="02"
          title="Open the inspector drawer"
          body="Click any card. A drawer slides in from the right with the bigger fingerprint, sector pills, a mini velocity curve, and the lap's era + accent block. Esc to dismiss."
        />
        <Step
          n="03"
          title="Cross-link to Telemetry"
          body={
            <>
              From the inspector, hit <Mono>OPEN_IN_TELEMETRY</Mono>. APEX
              sets that lap as your active lap and you can flip over to{" "}
              <Mono>/telemetry</Mono> to drill into the channels.
            </>
          }
        />
        <Step
          n="04"
          title="Download the poster (when available)"
          body="Some laps ship with a print-ready 11×14 poster PNG. The inspector exposes a download link for those."
        />
        <Step
          n="05"
          title="Read the field notes"
          body="At the bottom, four editorial cards on tyres, the geometry of a corner, garage observation, and the power unit. They&apos;re commentary, not interactive."
        />
      </Steps>
    </Section>
  );
}

function HowToCanvas() {
  return (
    <Section
      anchor="howto-canvas"
      kicker="03 · CANVAS"
      title="The lab"
      tight
    >
      <Body>
        Real-time generative renderer. Every slider repaints the fingerprint
        as you move it. There&apos;s no save-and-render — what you see is
        what gets exported.
      </Body>
      <Steps>
        <Step
          n="01"
          title="Pick a preset (recommended start)"
          body={
            <>
              Five presets sit at the top of the controls: <Mono>Neural
              Trace</Mono>, <Mono>Poster Print</Mono>,{" "}
              <Mono>Phone Wallpaper</Mono>, <Mono>Ferrari Tribute</Mono>,{" "}
              <Mono>Studio Mono</Mono>. Each snaps every knob at once.
              Treat them as starting points, not final answers.
            </>
          }
        />
        <Step
          n="02"
          title="Pick a palette"
          body={
            <>
              Five gradient swatches: <Mono>NEURAL</Mono>,{" "}
              <Mono>ICE</Mono>, <Mono>FERRARI</Mono>, <Mono>EMBER</Mono>,{" "}
              <Mono>MONO</Mono>. They control the throttle-to-colour ramp
              along the line.
            </>
          }
        />
        <Step
          n="03"
          title="Pick an aspect"
          body="Square (1:1), Poster (11:14, vertical), Phone (9:16, taller), Wide (16:9). The preview frame updates instantly."
        />
        <Step
          n="04"
          title="Tune the geometry + light + elements sliders"
          body={
            <>
              <Mono>SEGMENTS</Mono> controls resolution.{" "}
              <Mono>SMOOTHING</Mono> kills GPS jitter.{" "}
              <Mono>STROKE</Mono> changes line thickness. <Mono>GLOW</Mono>{" "}
              drives the halo bloom. <Mono>BRAKE_OPACITY</Mono>/
              <Mono>SIZE</Mono> control the red bursts. Toggles for brake
              bursts / start pip / caption.
            </>
          }
        />
        <Step
          n="05"
          title="Save the render"
          body={
            <>
              The <Mono>PRESERVE</Mono> panel has two buttons:
              <br />
              <BookmarkPlus className="inline size-3 text-apex-red mr-1" />
              <Mono>SAVE</Mono> — names the preset and stores it in your
              Collector. <br />
              <Link2 className="inline size-3 text-apex-red mr-1" />
              <Mono>SHARE_LINK</Mono> — copies a URL with the full state
              encoded in <Mono>#p=…</Mono>. Anyone who opens it sees the
              exact same render.
            </>
          }
        />
        <Step
          n="06"
          title="Export"
          body={
            <>
              <Download className="inline size-3 text-apex-red mr-1" />
              <Mono>PNG · 1024 / 2048 / 4096</Mono> for raster, or the big
              red <Mono>DOWNLOAD_SVG</Mono> for vector. PNG bakes the bloom
              into pixels; SVG keeps everything resolution-independent.
            </>
          }
        />
      </Steps>
    </Section>
  );
}

function HowToCollector() {
  return (
    <Section
      anchor="howto-collector"
      kicker="04 · COLLECTOR"
      title="The archive"
      tight
    >
      <Body>
        Personal library that lives in your browser&apos;s localStorage —
        nothing leaves the device unless you share a link.
      </Body>
      <Steps>
        <Step
          n="01"
          title="See your saved presets"
          body="Each card renders the fingerprint with the params you saved, plus driver / year / track / palette / aspect / relative timestamp."
        />
        <Step
          n="02"
          title="Restore by clicking a card or OPEN"
          body="That deep-links into Canvas with your saved params + active lap. The toast says 'Preset restored from share link'."
        />
        <Step
          n="03"
          title="Share or delete"
          body={
            <>
              <Mono>SHARE</Mono> copies the URL-encoded preset to your
              clipboard. <Mono>DELETE</Mono> removes a single entry.{" "}
              <Mono>CLEAR_ALL</Mono> in the header wipes everything.
            </>
          }
        />
        <Step
          n="04"
          title="Auto-sync across tabs"
          body="If two Collector tabs are open and you save from Canvas in a third, both Collector tabs refresh automatically."
        />
      </Steps>
    </Section>
  );
}

/* --------------------------- SYNC SENSORS --------------------------- */

function SyncSensorsSection() {
  return (
    <section id="sync" className="mt-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
      >
        <p className="label-mono text-apex-red">SIGNATURE_ACTION</p>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight mt-2">
          <span className="font-mono text-apex-red text-glow-red">
            SYNC_SENSORS
          </span>{" "}
          — what it does
        </h2>
        <p className="font-serif text-foreground/80 mt-4 text-[15px] leading-relaxed max-w-2xl">
          The big red button in the sidebar. In a real Formula 1 garage,{" "}
          <em>sync sensors</em> means &quot;force a fresh telemetry pull from
          the car&apos;s data link.&quot; APEX honours the metaphor.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mt-7">
        <div className="panel p-6 relative">
          <div
            className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-apex-red to-transparent"
            aria-hidden
          />
          <p className="label-mono text-apex-red flex items-center gap-2">
            <RefreshCw className="size-3" strokeWidth={2} />
            WHAT_HAPPENS_ON_CLICK
          </p>
          <ol className="space-y-3 mt-4 font-serif text-[14px] leading-relaxed text-foreground/85 list-decimal pl-5">
            <li>
              The button changes to <Mono>SYNCING...</Mono> with a spinner.
            </li>
            <li>
              APEX invalidates the TanStack Query cache for{" "}
              <Mono>[&quot;lap&quot;, &lt;activeLapId&gt;]</Mono> and{" "}
              <Mono>[&quot;lap-index&quot;]</Mono>.
            </li>
            <li>
              Any component reading those queries immediately re-fetches from
              source. For baked laps that&apos;s{" "}
              <Mono>/laps/&lt;id&gt;.json</Mono>. When the FastAPI service
              is deployed, it would be <Mono>/api/laps/...</Mono>.
            </li>
            <li>
              On success a toast confirms{" "}
              <em>&quot;Telemetry re-synced from source&quot;</em> and the
              button returns to <Mono>SYNC_SENSORS</Mono>.
            </li>
          </ol>
        </div>

        <div className="panel p-6">
          <p className="label-mono text-apex-amber">WHEN_TO_USE_IT</p>
          <ul className="space-y-3 mt-4 font-serif text-[14px] leading-relaxed text-foreground/85">
            <li className="flex gap-3">
              <span className="text-apex-red font-mono shrink-0">→</span>
              <span>
                You re-ran <Mono>bake_hero_laps.py</Mono> and changed a
                lap&apos;s telemetry; the JSON on disk is new but the FE
                still has the old version cached in memory.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-apex-red font-mono shrink-0">→</span>
              <span>
                You deployed a new version of the FastAPI service that
                returns updated payloads.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-apex-red font-mono shrink-0">→</span>
              <span>
                You suspect a rendered chart doesn&apos;t match what&apos;s on
                disk and want to force a known-fresh read.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-apex-red font-mono shrink-0">→</span>
              <span>
                You just want the haptic of a race engineer hitting a button.
                Valid.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="panel mt-4 p-5 flex items-start gap-4">
        <Sparkles className="size-5 text-apex-amber shrink-0 mt-1" strokeWidth={1.6} />
        <p className="font-serif text-[14px] leading-relaxed text-foreground/85">
          <strong>Quick note:</strong> a normal page refresh (
          <Mono>F5</Mono>) does the same thing — both bust the cache. The
          button exists because the HUD metaphor is consistent, and because{" "}
          <em>SYNC_SENSORS</em> is far more on-brand than &quot;invalidate
          cache.&quot;
        </p>
      </div>
    </section>
  );
}

/* --------------------------- shortcuts --------------------------- */

function ShortcutsSection() {
  const rows: Array<{ keys: string[]; what: string; where: string }> = [
    { keys: ["⌘K", "Ctrl+K"], what: "Open the command palette", where: "anywhere in the HUD" },
    { keys: ["↑", "↓"], what: "Move selection in the palette", where: "command palette" },
    { keys: ["↵"], what: "Execute the highlighted command", where: "command palette" },
    { keys: ["Esc"], what: "Close palette / drawer / popover", where: "anywhere" },
    { keys: ["←", "→"], what: "Step scrub by 1% of lap distance", where: "telemetry" },
    { keys: ["Shift+←", "Shift+→"], what: "Step scrub by 5%", where: "telemetry" },
    { keys: ["Home"], what: "Snap scrub to start", where: "telemetry" },
    { keys: ["End"], what: "Snap scrub to end", where: "telemetry" },
    { keys: ["Click+drag"], what: "Orbit the 3D camera", where: "hero" },
    { keys: ["Scroll"], what: "Zoom the 3D camera", where: "hero" },
  ];

  return (
    <section id="shortcuts" className="mt-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="mb-5"
      >
        <p className="label-mono text-apex-red flex items-center gap-2">
          <Keyboard className="size-3" strokeWidth={2} /> SHORTCUTS
        </p>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight mt-2">
          Things you can do{" "}
          <span className="italic font-serif text-apex-red">without</span>{" "}
          the mouse
        </h2>
      </motion.div>
      <div className="panel overflow-hidden">
        <table className="w-full font-sans text-[13px]">
          <thead className="bg-apex-bg/40">
            <tr className="text-apex-muted">
              <Th>Keys</Th>
              <Th>What it does</Th>
              <Th>Where</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={i > 0 ? "border-t border-apex-border/60" : ""}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {r.keys.map((k) => (
                      <kbd
                        key={k}
                        className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded border border-apex-border bg-apex-bg font-mono text-[11px] text-foreground"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground/85">{r.what}</td>
                <td className="px-4 py-3">
                  <span className="label-mono">{r.where.toUpperCase()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* --------------------------- data + stack --------------------------- */

function DataSources() {
  const sources = [
    {
      name: "FastF1",
      role: "Primary telemetry source",
      detail:
        "Python library that wraps the F1 timing API. Covers every session 2018+ with GPS, throttle, brake, speed, gear, RPM, DRS and sector splits. Pre-baked into static JSON for the six headline laps + four extras.",
      icon: Database,
    },
    {
      name: "OpenF1",
      role: "Live session data",
      detail:
        "Public REST API for real-time and recent F1 data. Powers the NEXT_SESSION countdown in the topbar and the bell-icon status popover. Queried through the optional FastAPI backend.",
      icon: Activity,
    },
    {
      name: "Jolpica F1",
      role: "Historical results (Ergast successor)",
      detail:
        "Historical race results, championship standings, driver/team metadata. Not telemetry — used for context like driver-of-the-day, season finishing positions etc.",
      icon: Compass,
    },
  ];
  return (
    <section id="data" className="mt-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="mb-5"
      >
        <p className="label-mono text-apex-red">DATA_SOURCES</p>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight mt-2">
          Where the numbers{" "}
          <span className="italic font-serif text-apex-red">come from</span>
        </h2>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {sources.map((s) => (
          <div key={s.name} className="panel p-5">
            <s.icon className="size-4 text-apex-red mb-3" strokeWidth={1.6} />
            <h3 className="font-sans text-lg font-bold tracking-tight">
              {s.name}
            </h3>
            <p className="label-mono mt-1">{s.role}</p>
            <p className="font-serif text-[13px] text-foreground/80 mt-3 leading-relaxed">
              {s.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TechStack() {
  const groups = [
    {
      title: "Frontend",
      items: [
        "Next.js 16 (App Router)",
        "React 19",
        "TypeScript (strict)",
        "Tailwind CSS v4",
        "shadcn / Radix",
      ],
    },
    {
      title: "3D + motion",
      items: [
        "Three.js",
        "React Three Fiber",
        "@react-three/drei",
        "@react-three/postprocessing",
        "Framer Motion",
        "GSAP",
      ],
    },
    {
      title: "Data + charts",
      items: [
        "D3.js",
        "Zustand",
        "TanStack Query",
        "Custom GLSL-free SVG renderers",
      ],
    },
    {
      title: "Backend",
      items: ["FastAPI (Python 3.13)", "FastF1", "Uvicorn", "Docker → Fly.io"],
    },
  ];
  return (
    <section id="stack" className="mt-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="mb-5"
      >
        <p className="label-mono text-apex-red">TECH_STACK</p>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight mt-2">
          Built with
        </h2>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {groups.map((g) => (
          <div key={g.title} className="panel p-4">
            <p className="label-mono text-apex-red mb-2">{g.title.toUpperCase()}</p>
            <ul className="space-y-1.5">
              {g.items.map((i) => (
                <li
                  key={i}
                  className="font-mono text-[12px] text-foreground/85 flex items-start gap-2"
                >
                  <span className="text-apex-red mt-0.5">·</span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function CreditsSection() {
  return (
    <section id="credits" className="mt-14 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="panel p-6 sm:p-8 relative overflow-hidden"
      >
        <div
          className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-apex-red to-transparent"
          aria-hidden
        />
        <p className="label-mono text-apex-red">CREDITS · COLOPHON</p>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight mt-2 max-w-3xl">
          A personal project. Designed and built by{" "}
          <span className="italic font-serif text-apex-red">Aneesh</span>.
        </h2>
        <p className="font-serif text-foreground/80 mt-4 leading-relaxed max-w-3xl">
          APEX is a personal exploration of what Formula 1 telemetry could look
          like if it was designed for someone outside the engineering bay.
          Every part of the design system, data pipeline, 3D scene, generative
          renderer and HUD chrome was hand-built across a few weeks of evening
          work. The data itself is real and public; the visual choices are
          editorial.
        </p>
        <p className="font-serif text-foreground/65 mt-3 leading-relaxed max-w-3xl text-[14px]">
          Not affiliated with Formula 1, the FIA, or any team. Source data
          credit goes to FastF1, OpenF1 and Jolpica. No commercial use, no
          team affiliation.
        </p>

        {/* Author signature block */}
        <div className="mt-6 panel-inset p-5 max-w-2xl">
          <p className="label-mono text-apex-red">SIGNED</p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2">
            <p
              className="font-serif italic text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
              style={{ letterSpacing: "-0.02em" }}
            >
              Aneesh
            </p>
            <a
              href="https://github.com/rooney011"
              target="_blank"
              rel="noopener noreferrer"
              className="label-mono text-apex-red hover:text-foreground transition-colors"
            >
              github.com/rooney011
            </a>
          </div>
          <p className="label-mono mt-3 !text-[10px] text-apex-muted">
            APEX_OS // 0.1.0 · BUILD_2026.05 · ONE_PERSON_ENGINEERING_TEAM
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-7">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-apex-red text-white px-5 py-2.5 glow-red transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <span className="label-mono !text-white">BACK_TO_HERO</span>
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
          <Link
            href="/telemetry"
            className="inline-flex items-center gap-2 rounded border border-apex-border px-4 py-2 hover:bg-apex-surface-2 transition-colors"
          >
            <Gauge className="size-3.5" strokeWidth={1.6} />
            <span className="label-mono">JUMP_TO_TELEMETRY</span>
          </Link>
          <a
            href="https://github.com/rooney011/Apex"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded border border-apex-border px-4 py-2 hover:bg-apex-surface-2 transition-colors"
          >
            <span className="label-mono">VIEW_SOURCE_ON_GITHUB</span>
          </a>
        </div>
      </motion.div>
    </section>
  );
}

/* --------------------------- primitives --------------------------- */

function Section({
  anchor,
  kicker,
  title,
  children,
  tight,
}: {
  anchor: string;
  kicker: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  tight?: boolean;
}) {
  return (
    <section id={anchor} className={tight ? "mt-10" : "mt-14"}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
      >
        <p className="label-mono text-apex-red">{kicker}</p>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight mt-2">
          {title}
        </h2>
      </motion.div>
      <div className="mt-5 max-w-3xl">{children}</div>
    </section>
  );
}

function Lede({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-serif text-[16px] leading-relaxed text-foreground/85">
      {children}
    </p>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-serif text-[14px] leading-relaxed text-foreground/80 mt-3">
      {children}
    </p>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="mt-5 space-y-3">{children}</ol>;
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li className="panel-inset relative p-4 pl-12">
      <span className="absolute left-3 top-3 font-mono text-[10px] text-apex-red label-mono">
        {n}
      </span>
      <p className="font-sans text-[14px] font-bold tracking-tight">{title}</p>
      <p className="font-serif text-[13px] leading-relaxed text-foreground/80 mt-1">
        {body}
      </p>
    </li>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[12px] tracking-wider rounded border border-apex-border bg-apex-bg px-1.5 py-0.5 text-apex-red">
      {children}
    </code>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-2.5 label-mono !text-[10px]">{children}</th>
  );
}

/* keep this referenced — Sun icon used for the upcoming dark/light toggle */
void Sun;
