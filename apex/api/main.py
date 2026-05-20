"""
APEX FastAPI service — exposes FastF1 telemetry as JSON.

Run:
    uvicorn apex.api.main:app --reload --port 8000

The bake script ships 6 hero laps to apex/public/laps/*.json so the FE
works without this service running. This API unlocks any lap 2018+.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path

import fastf1
import httpx
from fastapi import FastAPI, HTTPException, Path as PathParam
from fastapi.middleware.cors import CORSMiddleware

from .lap_payload import build_lap_payload

CACHE_DIR = Path(__file__).resolve().parents[2] / "fastf1_cache"
CACHE_DIR.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))

app = FastAPI(
    title="APEX API",
    description="FastF1 telemetry exposed as JSON for the APEX HUD.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    # Any subdomain of vercel.app + any custom domain you point at it.
    # Public data API, read-only, no cookies — wide CORS is acceptable.
    allow_origin_regex=r"^https://([a-z0-9-]+\.)?vercel\.app$|^https://apex\.[a-z0-9-]+\.[a-z]+$",
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "service": "apex-api", "version": "0.1.0"}


# ---------------------------------------------------------------------------
# Seasons — list of available years + races
# ---------------------------------------------------------------------------

@app.get("/api/seasons")
async def seasons() -> dict:
    years = list(range(2018, datetime.now(timezone.utc).year + 1))
    return {"available_years": years, "fastf1_min_year": 2018}


@app.get("/api/seasons/{year}")
async def season(year: int = PathParam(..., ge=2018, le=2099)) -> dict:
    """Return the FastF1 event schedule for a season — round numbers, names, dates."""
    try:
        schedule = fastf1.get_event_schedule(year, include_testing=False)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"FastF1 error: {exc}")

    rows = []
    for _, row in schedule.iterrows():
        rows.append({
            "round": int(row["RoundNumber"]),
            "name": str(row["EventName"]),
            "country": str(row.get("Country") or ""),
            "location": str(row.get("Location") or ""),
            "event_date": str(row.get("EventDate") or ""),
            "format": str(row.get("EventFormat") or ""),
        })
    return {"year": year, "rounds": rows}


# ---------------------------------------------------------------------------
# Lap telemetry
# ---------------------------------------------------------------------------

@app.get("/api/laps/{year}/{event}/{driver}/{session_code}")
async def lap(
    year: int,
    event: str,
    driver: str,
    session_code: str,
) -> dict:
    """Pull the driver's fastest lap from {year}/{event} during {session_code}.

    `event` is FastF1's event name (e.g. "british-grand-prix" — underscores or
    dashes are converted to spaces). `session_code` is Q | R | S | FP1 | FP2 | FP3.
    """
    event_clean = event.replace("-", " ").replace("_", " ")
    session_clean = session_code.upper()
    driver_clean = driver.upper()

    if session_clean not in {"Q", "R", "S", "FP1", "FP2", "FP3", "SQ"}:
        raise HTTPException(status_code=400, detail=f"Bad session: {session_code}")

    try:
        payload = await asyncio.to_thread(
            build_lap_payload, year, event_clean, session_clean, driver_clean
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Lap load failed: {exc}")
    return payload


# ---------------------------------------------------------------------------
# Live — next session via OpenF1
# ---------------------------------------------------------------------------

OPENF1_BASE = "https://api.openf1.org/v1"


@app.get("/api/live/next-session")
async def next_session() -> dict | None:
    """OpenF1 wants its `>=` operator literal in the URL (not percent-encoded),
    so we build the query string by hand rather than relying on httpx params."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    url = f"{OPENF1_BASE}/sessions?date_start>={now}"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.get(url)
            res.raise_for_status()
            sessions = res.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenF1 fetch failed: {exc}")

    if not sessions:
        return None

    sessions.sort(key=lambda s: s.get("date_start") or "")
    nxt = sessions[0]

    return {
        "session_key": nxt.get("session_key"),
        "session_name": nxt.get("session_name"),
        "session_type": nxt.get("session_type"),
        "country": nxt.get("country_name"),
        "circuit": nxt.get("circuit_short_name"),
        "date_start": nxt.get("date_start"),
        "date_end": nxt.get("date_end"),
        "year": nxt.get("year"),
    }
