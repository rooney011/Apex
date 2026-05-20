"""
Pull the latest available pole-lap telemetry.
  - 2025 British GP qualifying pole
  - Most recent 2026 race qualifying pole that exists in FastF1
Auto-discovers which 2026 rounds have telemetry yet.
"""

from dataclasses import dataclass
from pathlib import Path
import warnings

import fastf1
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.collections import LineCollection
from matplotlib.colors import LinearSegmentedColormap, Normalize

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

CACHE_DIR = Path(__file__).parent / "fastf1_cache"
fastf1.Cache.enable_cache(str(CACHE_DIR))

OUTPUT_DIR = Path(__file__).parent / "renders" / "latest"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BG = "#06060e"


# Distinct colour palettes per "discovered" driver.
ACCENT_LIBRARY = {
    "HAM": ("#00e8ff", ["#5db8d8", "#a8d8e8", "#dff0f6", "#f0f7fa", "#ffffff"]),  # cyan
    "VER": ("#ff4a3a", ["#751212", "#c52f2f", "#ff6f5a", "#ffb09a", "#ffe6dc"]),  # red
    "RUS": ("#7bf2b8", ["#1f4a36", "#3a8a68", "#6dc998", "#aeebc8", "#e8fff2"]),  # green
    "NOR": ("#ffa733", ["#5a3000", "#a8651a", "#e89540", "#fcc282", "#fff0d4"]),  # papaya
    "PIA": ("#a878ff", ["#3a1860", "#6a32a8", "#9a5cf0", "#cba8ff", "#ece0ff"]),  # purple
    "LEC": ("#ff2a6d", ["#530a26", "#a82454", "#ff5285", "#ffa8c4", "#ffe1ec"]),  # ferrari pink
    "SAI": ("#ff9b3d", ["#5a2e00", "#a85a14", "#ef8b30", "#ffc488", "#fff1d6"]),
    "ALO": ("#1edc8b", ["#0e3d2a", "#1f7a55", "#2bc683", "#a4ebc8", "#e3fff0"]),
    "HUL": ("#7ec8ff", ["#143b66", "#3d76b0", "#7bb6ee", "#bedaf5", "#eaf3ff"]),
    "TSU": ("#ffd84f", ["#4a3500", "#a07a14", "#ddb73a", "#ffe793", "#fff8d8"]),
    "GAS": ("#5fb7ff", ["#0c2a52", "#2a5fa5", "#5fa8eb", "#a8cef5", "#e0ecfa"]),
    "ANT": ("#bff200", ["#3a4e00", "#7ea200", "#bfdf00", "#dfee70", "#f3faa8"]),
    "HAD": ("#ff8e8e", ["#5a1e1e", "#a04848", "#ee7a7a", "#f4b8b8", "#ffe0e0"]),
    "BOT": ("#ffb000", ["#7a5a18", "#cf962d", "#f5c66b", "#ffe5a8", "#fff6dc"]),
}
DEFAULT_PALETTE = ("#e6e6e6", ["#3a3a3a", "#7a7a7a", "#b8b8b8", "#dadada", "#fafafa"])


@dataclass
class Entry:
    year: int
    code: str
    name: str
    team: str
    era_tag: str
    track: str
    accent: str
    line_cmap: list[str]


def smooth(arr, window):
    if window <= 1:
        return arr.astype(float)
    return pd.Series(arr.astype(float)).rolling(
        window=window, center=True, min_periods=1,
    ).mean().values


def prep(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=["X", "Y", "Speed", "Throttle"]).reset_index(drop=True)
    if (df.iloc[0][["X", "Y"]] != df.iloc[-1][["X", "Y"]]).any():
        df = pd.concat([df, df.iloc[[0]]], ignore_index=True)
    if df["Brake"].dtype == bool:
        df["Brake"] = df["Brake"].astype(int)
    else:
        df["Brake"] = (df["Brake"].astype(str).str.lower() == "true").astype(int)
    df["X"] = smooth(df["X"].values, 3)
    df["Y"] = smooth(df["Y"].values, 3)
    df["SpeedSmooth"] = smooth(df["Speed"].values, 9)
    df["ThrottleSmooth"] = smooth(df["Throttle"].values, 5)
    return df


def fetch_session(year, race_name):
    print(f"  loading {year} {race_name} Q...")
    session = fastf1.get_session(year, race_name, "Q")
    session.load(telemetry=True, weather=False, messages=False)
    pole_lap = session.laps.pick_fastest()
    tel = pole_lap.get_car_data().add_distance()
    try:
        pos = pole_lap.get_pos_data()
        tel = tel.merge_channels(pos)
    except Exception as e:
        print(f"    (no GPS: {e})")
    return session, pole_lap, prep(tel)


# -----------------------------------------------------------------------------
# Rendering (shared with render_eras.py)
# -----------------------------------------------------------------------------
def make_segments(x, y):
    pts = np.array([x, y]).T.reshape(-1, 1, 2)
    return np.concatenate([pts[:-1], pts[1:]], axis=1)


def midpoints(arr):
    return (arr[:-1] + arr[1:]) / 2.0


def strip_axes(ax):
    ax.set_facecolor(BG)
    ax.set_aspect("equal")
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)


def set_bounds(ax, x, y, aspect=11 / 14, pad_frac=0.06):
    cx, cy = (x.max() + x.min()) / 2, (y.max() + y.min()) / 2
    xr, yr = x.max() - x.min(), y.max() - y.min()
    half_y = max(yr / 2, xr / (2 * aspect)) * (1 + pad_frac)
    half_x = half_y * aspect
    ax.set_xlim(cx - half_x, cx + half_x)
    ax.set_ylim(cy - half_y, cy + half_y)


def draw_neural(ax, df, entry, line_scale=1.0, brake_scale=1.0):
    x, y = df["X"].values, df["Y"].values
    throttle = df["ThrottleSmooth"].values
    brake = df["Brake"].values
    speed = df["SpeedSmooth"].values

    segs = make_segments(x, y)
    seg_throttle = midpoints(throttle)
    seg_speed = midpoints(speed)
    seg_brake = midpoints(brake.astype(float))

    sn = (seg_speed - seg_speed.min()) / (seg_speed.max() - seg_speed.min() + 1e-9)
    widths = (1.8 + 5.5 * (1 - sn)) * line_scale

    cmap = LinearSegmentedColormap.from_list(f"line_{entry.code}_{entry.year}", entry.line_cmap)
    colors = cmap(Normalize(0, 100)(seg_throttle))

    for mult, alpha in [(4.5, 0.05), (2.6, 0.10)]:
        ax.add_collection(LineCollection(
            segs, colors=colors, linewidths=widths * mult,
            alpha=alpha, capstyle="round",
        ))
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=widths, alpha=1.0, capstyle="round",
    ))

    brake_idx = np.where(seg_brake > 0.5)[0]
    if len(brake_idx):
        bx = (x[brake_idx] + x[brake_idx + 1]) / 2
        by = (y[brake_idx] + y[brake_idx + 1]) / 2
        ax.scatter(bx, by, s=110 * brake_scale, c="#ff2818",
                   alpha=0.22, edgecolors="none", zorder=8)
        ax.scatter(bx, by, s=28 * brake_scale, c="#ff8050",
                   alpha=0.95, edgecolors="none", zorder=9)
        ax.scatter(bx, by, s=6 * brake_scale, c="white",
                   alpha=1.0, edgecolors="none", zorder=10)

    ax.scatter([x[0]], [y[0]], s=110, marker="o", c="none",
               edgecolors=entry.accent, linewidths=1.4, alpha=0.9, zorder=11)
    ax.scatter([x[0]], [y[0]], s=11, c=entry.accent,
               alpha=0.95, zorder=12)


def fmt_lap(td) -> str:
    s = str(td).split()[-1].split(".")
    return s[0].lstrip("0:") + "." + s[-1][:3]


def render_card(entry, lap_obj, df, filename):
    fig, ax = plt.subplots(figsize=(11, 14))
    fig.set_facecolor(BG)
    strip_axes(ax)
    set_bounds(ax, df["X"].values, df["Y"].values, pad_frac=0.08)
    draw_neural(ax, df, entry)

    fig.text(0.5, 0.956, entry.name, ha="center", color="white",
             fontsize=38, weight="bold", family="serif")
    fig.text(0.5, 0.919, f"{entry.team}  ·  {entry.year}",
             ha="center", color=entry.accent, fontsize=12, family="serif")
    fig.text(0.5, 0.895, entry.era_tag, ha="center",
             color="#9098b0", fontsize=10, family="monospace")
    fig.text(0.5, 0.060, f"{entry.track.upper()}  ·  POLE  ·  {fmt_lap(lap_obj['LapTime'])}",
             ha="center", color="#bcc6df",
             fontsize=12, family="monospace", weight="bold")

    out = OUTPUT_DIR / filename
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor=BG, pad_inches=0.3)
    plt.close(fig)
    print(f"  saved {out.name}")
    return out


# -----------------------------------------------------------------------------
# 2026 race auto-discovery
# -----------------------------------------------------------------------------
def find_latest_2026_race():
    print("\nDiscovering most recent 2026 race with available telemetry...")
    try:
        schedule = fastf1.get_event_schedule(2026, include_testing=False)
    except Exception as e:
        print(f"  no 2026 schedule yet: {e}")
        return None

    # Walk schedule backwards until we find one with telemetry available
    candidates = schedule.sort_values("EventDate", ascending=False)
    for _, ev in candidates.iterrows():
        race_name = ev["EventName"]
        try:
            sess = fastf1.get_session(2026, race_name, "Q")
            sess.load(telemetry=True, weather=False, messages=False)
            if len(sess.laps) > 0:
                pole = sess.laps.pick_fastest()
                if pole is not None and pole["Driver"]:
                    print(f"  ✓ 2026 {race_name} — pole {pole['Driver']}")
                    return race_name
        except Exception as e:
            continue
    return None


def normalize_driver_meta(lap_obj):
    """Return (code, name, team, accent, palette) for a driver-row lap."""
    code = str(lap_obj["Driver"])
    team = str(lap_obj.get("Team", "")).upper()
    accent, palette = ACCENT_LIBRARY.get(code, DEFAULT_PALETTE)
    # Name lookup (lazy/manual; we use what fastf1 gives via DriverNumber→FullName)
    return code, code, team, accent, palette


def main():
    new_entries = []

    # ----------------- 2025 British GP -----------------
    try:
        _, pole_lap, df = fetch_session(2025, "British Grand Prix")
        code, _, team, accent, palette = normalize_driver_meta(pole_lap)
        # try to upgrade name with FirstName/LastName if present
        try:
            name = f"{pole_lap['LastName']}".upper() if pole_lap.get("LastName") else code
        except Exception:
            name = code
        e = Entry(
            year=2025, code=code, name=name, team=team or "—",
            era_tag="GROUND EFFECT  ·  W16-ERA",
            track="Silverstone",
            accent=accent, line_cmap=palette,
        )
        render_card(e, pole_lap, df, f"era_2025_{code}.png")
        new_entries.append((e, pole_lap, df, "British"))
    except Exception as e:
        print(f"2025 fetch failed: {e}")

    # ----------------- Latest 2026 race -----------------
    latest_2026 = find_latest_2026_race()
    if latest_2026:
        try:
            _, pole_lap, df = fetch_session(2026, latest_2026)
            code, _, team, accent, palette = normalize_driver_meta(pole_lap)
            try:
                name = f"{pole_lap['LastName']}".upper() if pole_lap.get("LastName") else code
            except Exception:
                name = code
            e = Entry(
                year=2026, code=code, name=name, team=team or "—",
                era_tag="NEW REGS  ·  2026 ENGINE",
                track=latest_2026.replace(" Grand Prix", ""),
                accent=accent, line_cmap=palette,
            )
            render_card(e, pole_lap, df, f"latest_2026_{code}.png")
            new_entries.append((e, pole_lap, df, latest_2026))
        except Exception as exc:
            print(f"2026 {latest_2026} fetch failed: {exc}")
    else:
        print("No 2026 race data available yet.")

    # Persist a simple JSON manifest of what was pulled
    import json
    manifest = []
    for e, lap_obj, df, race in new_entries:
        manifest.append({
            "year": e.year,
            "driver_code": e.code,
            "driver_name": e.name,
            "team": e.team,
            "track": e.track,
            "race": race,
            "laptime": fmt_lap(lap_obj["LapTime"]),
            "accent": e.accent,
            "era_tag": e.era_tag,
        })
    with open(OUTPUT_DIR / "manifest.json", "w") as fp:
        json.dump(manifest, fp, indent=2)
    print(f"\nManifest written to {OUTPUT_DIR / 'manifest.json'}")
    print(f"\n{len(new_entries)} new entries.")


if __name__ == "__main__":
    main()
