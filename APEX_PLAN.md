# APEX — Project Plan v2

> Supersedes `PROJECT_PLAN.md`. The "Lap Fingerprints" editorial direction is archived; this is a full product pivot.

---

## What this is

A web-based **race engineer's telemetry OS**. Pick a lap, watch it replay across velocity / G-force / throttle / brake channels, see the racing line extrude through a 3D track ribbon, and tune a generative fingerprint render of any lap you want.

- **Brand:** APEX — single brand, everywhere
- **Aesthetic:** dark HUD, F1 red (`#FF1801`), cinematic photography, mono telemetry labels, postprocessed 3D

## North star

1. A reasonable F1 fan opens it and within 5 seconds says *"what is this"* — not bounce.
2. You can scrub through a real lap and watch four channels update in lockstep.
3. The 3D track view feels worth sitting with, not a tech demo.
4. You can render a personalised fingerprint of any baked lap and download it.
5. 60fps on a recent laptop; degrades cleanly on a phone.

---

## Tech stack (advanced, no plain HTML/CSS)

### Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router, RSC, PPR) | streaming, edge, route handlers |
| Language | **TypeScript** (strict) | type the telemetry payloads |
| Styling | **Tailwind CSS v4** + **shadcn/ui** + **Radix** | design system, a11y primitives |
| 3D | **React Three Fiber** + **drei** + **three.js** | scene graph in React |
| 3D postprocess | **@react-three/postprocessing** | bloom, vignette, chromatic aberration |
| Shaders | custom **GLSL** | track ribbon glow, particle trail |
| Motion | **Framer Motion** + **GSAP / ScrollTrigger** | page transitions + scroll scrub |
| Scroll | **Lenis** | smooth, momentum |
| Charts | **D3.js** + **visx** | velocity curve, G-load polar, throttle bars |
| State | **Zustand** | selected lap, scrub time, active channel |
| Data | **TanStack Query** | fetch + cache |
| Fonts | **Inter** · **Source Serif 4** · **JetBrains Mono** | per Stitch tokens |

### Backend (Python)
| Layer | Choice |
|---|---|
| API | **FastAPI** (Python 3.13) |
| Cache | **Redis** (FastF1 cold pulls are slow) |
| Workers | **uvicorn** dev / **hypercorn** prod |
| Data | **FastF1** (primary) + **OpenF1** (live) + **Jolpica F1** (historical/Ergast successor) |

Endpoints:
- `GET /api/laps/{year}/{round}/{driver}/{session}` — full telemetry JSON
- `GET /api/seasons` — index of available laps
- `GET /api/live/next-session` — proxied OpenF1 stream

### Infra
- FE: **Vercel** (Next.js native)
- BE: **Fly.io** or **Railway**
- Bake: 6 hero laps shipped as static JSON in `/public/laps/` so landing works without a live BE

---

## Data sources (researched)

| Source | Use | Limit |
|---|---|---|
| **FastF1** | telemetry, GPS, sectors, weather | 2018+ only, cold pulls slow |
| **OpenF1** | live timing during race weekends | live + recent only |
| **Jolpica F1** (Ergast successor) | historical results, championships | no telemetry |
| **Sketchfab / Hum3D** | F1 car GLB models | licence-check per model |
| **PolyHaven** | HDRI environments (free CC0) | use for 3D lighting |

### Featured laps to pre-bake
1. HAM 2020 Silverstone — the original hero
2. VER 2023 Silverstone — ground-effect era
3. RUS 2024 Silverstone — same-track contrast
4. VER 2025 Silverstone — latest
5. HAM 2018 Monza — qualifying speed record (oldest FastF1 supports)
6. LEC 2024 Monaco — different track shape, slowest pole

---

## Phases

### Phase 0 — Foundation · 2 days
- Scaffold Next.js 15 at `D:\F1\apex\`
- Install all FE deps (R3F, drei, postprocessing, framer, gsap, lenis, d3, visx, zustand, query, shadcn)
- Tailwind v4 + tokens (red `#FF1801`, neutrals, fonts via `next/font`)
- App shell: sidebar (channel nav) + topbar (LAP_TIME pill + tabs + sync indicator) + main slot
- Routing: `/telemetry`, `/gallery`, `/canvas`, `/collector`
- Splash → fade-in HUD
- **Deliverable:** empty but on-brand shell at `localhost:3000`

### Phase 1 — Data Pipeline · 1–2 days
- FastAPI service at `D:\F1\apex\api\`
- Pre-bake 6 hero laps to `public/laps/*.json`
- Redis cache layer (optional for dev)
- **Deliverable:** real telemetry JSON the FE can consume

### Phase 2 — Telemetry View · 3–4 days
*Stitch images 3, 5, 7, 8.*
- Sidebar channels: `VELOCITY · G-FORCE · THROTTLE · BRAKING · SECTORS`
- Center: D3 chart for active channel, line drawn via SVG path
- Right column: photo panel + `DIAGNOSTIC_STATUS` block
- Bottom: sequential log table (per-second readouts)
- Scrub bar synced across all panels via Zustand
- **Deliverable:** pick any baked lap, drill into any channel

### Phase 3 — Hero 3D View · 4–5 days
*Cinematic feel of Stitch image 4.*
- R3F scene as the landing hero
- **Track ribbon:** tube extruded along GPS coords, height = speed, vertex color = throttle, custom bloom shader
- F1 car GLB rotating slowly above start/finish
- HDRI environment, postprocess (bloom + vignette + chromatic aberration)
- Idle camera orbit; click-drag to fly
- **Deliverable:** jaw-drop opener

### Phase 4 — Gallery / Narrative · 2 days
*Stitch image 9 — "THE APEX NARRATIVE".*
- Grid of fingerprint cards (matplotlib renders already in `phase2b_output/`)
- Card click → side panel with that lap's mini-telemetry
- "Silverstone Through Eras" as a curated story
- **Deliverable:** storytelling layer over the data

### Phase 5 — Canvas / Lab · 3 days
*Stitch image 10 — sliders + live preview.*
- Param panel: smoothing, width curve, palette, glow, brake-burst alpha
- WebGL canvas re-renders fingerprint in real time
- Export PNG (4K) + SVG
- Save preset to Collector
- **Deliverable:** a tool, not just a viewer

### Phase 6 — Collector · 1–2 days
- IndexedDB-backed local collection of saved laps + presets
- Thumbnail grid + metadata
- Shareable URL-encoded preset links
- **Deliverable:** persistence + sharing

### Phase 7 — Polish + Deploy · 2 days
- Lenis smooth scroll
- Optional sound design (channel-switch tick, lap whoosh) — off by default
- Mobile fallback (collapses sidebar, simplifies 3D)
- Lighthouse perf > 90
- Vercel + Fly.io deploy
- **Deliverable:** live URL

**Total:** ~3 weeks of evening work. Each phase shippable independently.

---

## Asset asks (you generate these, I'll wire them in)

### Photography — dark, cinematic, red/orange highlights, 16:9 or 4:5
1. `01_wheel.jpg` — steering wheel close-up with a track map glowing on the dash. Matches Stitch image 4.
2. `02_tire.jpg` — worn slick tire macro, heat marks. Matches Stitch image 6.
3. `03_cockpit_pov.jpg` — driver's eye view, main straight, slight motion blur.
4. `04_garage.jpg` — pit garage at night, neon edge lighting.
5. `05_pu.jpg` — V6 hybrid power unit detail, exposed.
6. `06_silverstone_aerial.jpg` — drone shot, golden hour.

Save to `D:\F1\apex\public\photos\`.

### 3D
7. `car.glb` — generic open-wheel single-seater, dark + red livery. I can fall back to a free Sketchfab one if needed.
8. `studio_red.hdr` — dark studio HDRI with red rim lighting, 4K.

Save to `D:\F1\apex\public\models\`.

### Video (optional)
9. `splash_loop.mp4` — 6s loop, F1 car rear-3/4 driving away in slow-mo, red tail lights, dark scene. Used as splash background. Keep under 5MB.

If any asset is delayed I'll start without it — placeholders swap to real assets with a one-filename change.

---

## What stays from v1

- All the matplotlib fingerprint renders in `phase*_output/` — reused in the Gallery
- The FastF1 cache directory — keep, FastAPI uses the same one
- `manifest.json` — replaced by the FastAPI `/api/seasons` endpoint
- `site/` (the v2 editorial site) — kept as `site_v1_archive/` for reference

## What's deprecated

- `site/index.html`, `site/style.css`, `site/script.js` — replaced by the Next.js app
- Editorial "Playfair Display / Lap Fingerprints" branding — replaced by APEX
- Cyan accent — replaced by red `#FF1801`

---

## Locked decisions (2026-05-19)

- ✅ **FastAPI backend** — unlocks any lap from 2018+, deployed to Fly.io alongside Vercel FE
- ✅ **Full 3D hero** — Phase 3 stays in scope, R3F + GLSL track ribbon + F1 car GLB
- ✅ **APEX everywhere** — single clean brand, no CHICANE_OS dual-naming
- ✅ **Live OpenF1 strip** — top-right shows next session countdown / live timing during race weekends
