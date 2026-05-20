"""Shared FastF1 -> lap-JSON builder, used by both the bake script and the live API."""

from __future__ import annotations

import math
from typing import Any

import fastf1
import numpy as np
import pandas as pd


def fmt_lap_time(td: pd.Timedelta) -> str:
    total = td.total_seconds()
    m = int(total // 60)
    s = total - m * 60
    return f"{m}:{s:06.3f}"


def safe_float_list(arr, decimals: int = 3) -> list:
    rounded = np.round(np.asarray(arr, dtype=float), decimals)
    return [None if (isinstance(v, float) and math.isnan(v)) else float(v) for v in rounded]


def safe_int_list(arr) -> list:
    out = []
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
    if val is None or pd.isna(val):
        return None
    try:
        return int(val.total_seconds() * 1000)
    except AttributeError:
        return None


def build_lap_payload(
    year: int,
    event: str,
    session_code: str,
    driver_code: str,
) -> dict[str, Any]:
    """Load a session, pick the driver's fastest lap, return the same JSON shape
    the bake script writes to /public/laps/*.json."""
    session = fastf1.get_session(year, event, session_code)
    session.load(telemetry=True, weather=False, messages=False)

    laps = session.laps.pick_drivers(driver_code)
    fastest = laps.pick_fastest()

    car = fastest.get_car_data().add_distance()
    try:
        pos = fastest.get_pos_data()
        tel = car.merge_channels(pos)
    except Exception:
        tel = car

    try:
        info = session.get_driver(driver_code)
        driver_name = str(info.get("FullName") or info.get("LastName") or driver_code).upper()
        team = str(info.get("TeamName") or "").upper()
        team_color = str(info.get("TeamColor") or "").strip()
        if team_color and not team_color.startswith("#"):
            team_color = "#" + team_color
    except Exception:
        driver_name = driver_code
        team = ""
        team_color = "#888888"

    slug = f"{driver_code.lower()}_{year}_{session_code.lower()}"

    return {
        "id": slug,
        "year": year,
        "race": event,
        "session": session_code,
        "track": str(session.event.get("Location") or ""),
        "era": "",
        "accent": team_color or "#ff1801",
        "driver_code": driver_code,
        "driver_name": driver_name,
        "team": team,
        "team_color": team_color or "#888888",
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
