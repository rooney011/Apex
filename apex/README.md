# APEX

Formula 1 telemetry, reimagined as a race engineer's operating system.

- **Hero** — `/` — 3D track ribbon (GPS extruded by speed, throttle-coloured), F1 car GLB, postprocessed bloom
- **Telemetry** — `/telemetry` — D3 velocity / G-load / throttle / brake / sector views, scrub bar, diagnostic panel
- **Gallery** — `/gallery` — generative fingerprints rendered from telemetry, era story, inspector drawer
- **Canvas** — `/canvas` — slider-driven generative renderer, SVG + PNG (1024/2048/4096) export
- **Collector** — `/collector` — local library of saved presets + URL-encoded share links

## Stack

Frontend: **Next.js 16** (App Router), **TypeScript**, **Tailwind v4**, **shadcn**, **React Three Fiber** + **drei** + **postprocessing**, **framer-motion**, **D3**, **Zustand**, **TanStack Query**.

Backend (optional): **FastAPI** wrapping **FastF1**, **OpenF1**, **Jolpica F1**. Lives at `./api`.

## Run locally

```powershell
# Frontend
cd D:\F1\apex
npm install
npm run dev

# Backend (optional — only needed for "any lap 2018+" browsing)
D:\F1\.venv\Scripts\python.exe -m pip install -r D:\F1\apex\api\requirements.txt
cd D:\F1
D:\F1\.venv\Scripts\python.exe -m uvicorn apex.api.main:app --reload --port 8000
```

The site works without the backend — six hero laps ship pre-baked as static JSON in `public/laps/`.

## Re-bake hero laps

```powershell
D:\F1\.venv\Scripts\python.exe D:\F1\bake_hero_laps.py
```

## Deploy

### Frontend → Vercel

```bash
npx vercel link
npx vercel --prod
```

The repo's Next config has nothing custom — Vercel auto-detects everything.

If you want the live OpenF1 strip to call a deployed backend, set:

```
NEXT_PUBLIC_APEX_API_URL=https://your-api.fly.dev
```

### Backend → Fly.io (optional)

```bash
cd D:\F1\apex\api
fly launch --copy-config --no-deploy
fly deploy
```

See `apex/api/Dockerfile` + `apex/api/fly.toml`.

## File map

```
apex/
├── api/                    FastAPI service (Python)
│   ├── main.py             routes (health, seasons, laps, live)
│   ├── lap_payload.py      shared FastF1 -> JSON builder
│   ├── Dockerfile          Fly.io build
│   ├── fly.toml            Fly.io config
│   └── requirements.txt
├── public/
│   ├── laps/               6 baked lap JSONs + index
│   ├── fingerprints/       PNG posters for laps with renders
│   ├── photos/             cinematic imagery (cockpit, tire, garage, ...)
│   ├── models/             car.glb + studio_red.hdr
│   └── video/              splash loop
└── src/
    ├── app/                routes (App Router)
    ├── components/
    │   ├── canvas/         generative lab + export
    │   ├── charts/         D3 telemetry chart components
    │   ├── collector/      local preset library
    │   ├── gallery/        gallery + era story + inspector
    │   ├── hero/           3D landing scene + error boundary
    │   ├── hud/            sidebar / topbar / scrub / drawer / splash / toast
    │   └── providers/      TanStack Query
    └── lib/
        ├── canvas/         render params, share-link encoder, export
        ├── chart/          telemetry derivations (G, smoothing, reading)
        ├── collector/      localStorage CRUD + share
        ├── data/           lap types + server/client loaders
        └── store/          Zustand scrub store
```
