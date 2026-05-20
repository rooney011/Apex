"""
Bake the headline lap set to static JSON for the APEX frontend.

Each lap is written to apex/public/laps/<slug>.json. A roll-up index.json
lists every baked lap with summary metadata so the FE can build menus
without loading every payload.

Re-running is safe — FastF1's on-disk cache means repeat pulls hit local
parquet rather than the F1 timing servers.
"""

from __future__ import annotations

import json
import math
import warnings
from dataclasses import dataclass
from pathlib import Path

import fastf1
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

CACHE_DIR = Path(__file__).parent / "fastf1_cache"
CACHE_DIR.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))

OUT_DIR = Path(__file__).parent / "apex" / "public" / "laps"
OUT_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class LapSpec:
    slug: str
    year: int
    event: str           # name FastF1 accepts (e.g. "British Grand Prix")
    session: str         # "Q" / "R" / "S"
    driver: str          # 3-letter code
    track: str
    era: str
    accent: str          # hex, drives the gallery card highlight


HERO_LAPS: list[LapSpec] = [
    LapSpec(
        slug="ham_2020_silverstone_q",
        year=2020, event="British Grand Prix", session="Q", driver="HAM",
        track="Silverstone",
        era="HYBRID  ·  V6 1.6L",
        accent="#00e8ff",
    ),
    LapSpec(
        slug="ham_2018_monza_q",
        year=2018, event="Italian Grand Prix", session="Q", driver="HAM",
        track="Monza",
        era="HYBRID  ·  V6 1.6L",
        accent="#3fc9ff",
    ),
    LapSpec(
        slug="ver_2023_silverstone_q",
        year=2023, event="British Grand Prix", session="Q", driver="VER",
        track="Silverstone",
        era="GROUND EFFECT  ·  RB19",
        accent="#ff4a3a",
    ),
    LapSpec(
        slug="rus_2024_silverstone_q",
        year=2024, event="British Grand Prix", session="Q", driver="RUS",
        track="Silverstone",
        era="GROUND EFFECT  ·  W15",
        accent="#7bf2b8",
    ),
    LapSpec(
        slug="ver_2025_silverstone_q",
        year=2025, event="British Grand Prix", session="Q", driver="VER",
        track="Silverstone",
        era="GROUND EFFECT  ·  RB21",
        accent="#ff1801",
    ),
    LapSpec(
        slug="lec_2024_monaco_q",
        year=2024, event="Monaco Grand Prix", session="Q", driver="LEC",
        track="Monaco",
        era="GROUND EFFECT  ·  SF-24",
        accent="#ffb84a",
    ),
    LapSpec(
        slug="lec_2024_monza_q",
        year=2024, event="Italian Grand Prix", session="Q", driver="LEC",
        track="Monza",
        era="GROUND EFFECT  ·  SF-24",
        accent="#dc0000",
    ),
    LapSpec(
        slug="nor_2024_zandvoort_q",
        year=2024, event="Dutch Grand Prix", session="Q", driver="NOR",
        track="Zandvoort",
        era="GROUND EFFECT  ·  MCL38",
        accent="#ff8700",
    ),
    LapSpec(
        slug="ham_2024_lasvegas_q",
        year=2024, event="Las Vegas Grand Prix", session="Q", driver="HAM",
        track="Las Vegas",
        era="GROUND EFFECT  ·  W15",
        accent="#27f4d2",
    ),
    LapSpec(
        slug="pia_2025_australia_q",
        year=2025, event="Australian Grand Prix", session="Q", driver="PIA",
        track="Albert Park",
        era="GROUND EFFECT  ·  MCL39",
        accent="#ffc24d",
    ),
]


def fmt_lap_time(td: pd.Timedelta) -> str:
    """Pandas timedelta → m:ss.fff"""
    total = td.total_seconds()
    m = int(total // 60)
    s = total - m * 60
    return f"{m}:{s:06.3f}"


def safe_float_list(arr: np.ndarray | pd.Series, decimals: int = 3) -> list[float]:
    """Convert an array to a plain Python list, rounded, NaN-safe."""
    rounded = np.round(np.asarray(arr, dtype=float), decimals)
    return [None if (isinstance(v, float) and math.isnan(v)) else float(v) for v in rounded]


def safe_int_list(arr: np.ndarray | pd.Series) -> list[int | None]:
    out: list[int | None] = []
    for v in np.asarray(arr):
        try:
            if pd.isna(v):
                out.append(None)
            else:
                out.append(int(v))
        except (TypeError, ValueError):
            out.append(None)
    return out


def sector_ms(val) -> int | None:
    """Sector time → integer milliseconds, or None if missing."""
    if val is None or pd.isna(val):
        return None
    try:
        return int(val.total_seconds() * 1000)
    except AttributeError:
        return None


def bake_one(spec: LapSpec) -> dict:
    print(f"\n-> {spec.slug}  ({spec.year} {spec.event} | {spec.driver})")
    session = fastf1.get_session(spec.year, spec.event, spec.session)
    session.load(telemetry=True, weather=False, messages=False)

    laps = session.laps.pick_drivers(spec.driver)
    fastest = laps.pick_fastest()

    car = fastest.get_car_data().add_distance()
    try:
        pos = fastest.get_pos_data()
        tel = car.merge_channels(pos)
    except Exception as e:
        print(f"   (no GPS merge: {e}) — falling back to car data only")
        tel = car

    # Driver / team meta
    try:
        info = session.get_driver(spec.driver)
        driver_name = str(info.get("FullName") or info.get("LastName") or spec.driver).upper()
        team = str(info.get("TeamName") or "").upper()
        team_color = str(info.get("TeamColor") or "").strip()
        if team_color and not team_color.startswith("#"):
            team_color = "#" + team_color
    except Exception:
        driver_name = spec.driver
        team = ""
        team_color = spec.accent

    payload = {
        "id": spec.slug,
        "year": spec.year,
        "race": spec.event,
        "session": spec.session,
        "track": spec.track,
        "era": spec.era,
        "accent": spec.accent,
        "driver_code": spec.driver,
        "driver_name": driver_name,
        "team": team,
        "team_color": team_color or spec.accent,
        "lap_time_str": fmt_lap_time(fastest["LapTime"]),
        "lap_time_ms": int(fastest["LapTime"].total_seconds() * 1000),
        "lap_number": int(fastest["LapNumber"]) if not pd.isna(fastest["LapNumber"]) else None,
        "compound": str(fastest.get("Compound") or "") or None,
        "sectors": {
            "s1_ms": sector_ms(fastest.get("Sector1Time")),
            "s2_ms": sector_ms(fastest.get("Sector2Time")),
            "s3_ms": sector_ms(fastest.get("Sector3Time")),
        },
        "telemetry": {
            "samples": int(len(tel)),
            "distance": safe_float_list(tel["Distance"], 2),
            "x": safe_float_list(tel["X"], 1) if "X" in tel else [],
            "y": safe_float_list(tel["Y"], 1) if "Y" in tel else [],
            "speed": safe_float_list(tel["Speed"], 1),
            "throttle": safe_float_list(tel["Throttle"], 1),
            "brake": safe_int_list(tel["Brake"].astype(bool).astype(int)),
            "ngear": safe_int_list(tel["nGear"]),
            "rpm": safe_int_list(tel["RPM"]),
            "drs": safe_int_list(tel["DRS"]),
        },
    }

    out_path = OUT_DIR / f"{spec.slug}.json"
    out_path.write_text(json.dumps(payload, separators=(",", ":")))
    size_kb = out_path.stat().st_size / 1024
    print(
        f"   wrote {out_path.name}  |  {payload['telemetry']['samples']} samples  |  "
        f"{size_kb:.1f} KB  |  {payload['lap_time_str']}"
    )
    return payload


def main() -> None:
    summaries: list[dict] = []

    for spec in HERO_LAPS:
        try:
            payload = bake_one(spec)
        except Exception as e:
            print(f"   FAILED {spec.slug}: {type(e).__name__}: {e}")
            continue

        summaries.append({
            "id": payload["id"],
            "year": payload["year"],
            "race": payload["race"],
            "track": payload["track"],
            "session": payload["session"],
            "driver_code": payload["driver_code"],
            "driver_name": payload["driver_name"],
            "team": payload["team"],
            "team_color": payload["team_color"],
            "accent": payload["accent"],
            "era": payload["era"],
            "lap_time_str": payload["lap_time_str"],
            "lap_time_ms": payload["lap_time_ms"],
            "compound": payload["compound"],
            "samples": payload["telemetry"]["samples"],
        })

    summaries.sort(key=lambda s: (s["year"], s["lap_time_ms"]))

    index_path = OUT_DIR / "index.json"
    index_path.write_text(
        json.dumps(
            {"baked_count": len(summaries), "laps": summaries},
            indent=2,
        )
    )
    print(f"\nWrote index -> {index_path}  ({len(summaries)} laps)")


if __name__ == "__main__":
    main()
