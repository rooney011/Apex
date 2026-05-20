"""
Cross-era comparison: Silverstone through three Formula 1 eras.
  - HAM  2020 pole  (Mercedes hybrid peak)         1:24.303
  - VER  2023 pole  (Red Bull ground-effect era)   1:26.720
  - RUS  2024 pole  (Mercedes resurgence)          1:25.819

Renders individual fingerprints + a 3-up era grid, each with its own accent palette.
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

CACHE_DIR = Path(__file__).parent / "fastf1_cache"
fastf1.Cache.enable_cache(str(CACHE_DIR))

OUTPUT_DIR = Path(__file__).parent / "renders" / "eras"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BG = "#06060e"


@dataclass
class EraEntry:
    year: int
    code: str
    name: str
    team: str
    era_tag: str
    accent: str
    line_cmap: list[str]


ENTRIES = [
    EraEntry(
        year=2020, code="HAM", name="HAMILTON", team="MERCEDES",
        era_tag="HYBRID  ·  V6 1.6L",
        accent="#00e8ff",
        line_cmap=["#5db8d8", "#a8d8e8", "#dff0f6", "#f0f7fa", "#ffffff"],
    ),
    EraEntry(
        year=2023, code="VER", name="VERSTAPPEN", team="RED BULL",
        era_tag="GROUND EFFECT  ·  RB19",
        accent="#ff4a3a",
        line_cmap=["#751212", "#c52f2f", "#ff6f5a", "#ffb09a", "#ffe6dc"],
    ),
    EraEntry(
        year=2024, code="RUS", name="RUSSELL", team="MERCEDES",
        era_tag="GROUND EFFECT  ·  W15",
        accent="#7bf2b8",
        line_cmap=["#1f4a36", "#3a8a68", "#6dc998", "#aeebc8", "#e8fff2"],
    ),
]


def smooth(arr, window):
    if window <= 1:
        return arr.astype(float)
    return pd.Series(arr.astype(float)).rolling(
        window=window, center=True, min_periods=1,
    ).mean().values


def fetch_entry(entry: EraEntry):
    print(f"  loading {entry.year} British GP Q for {entry.code}...")
    session = fastf1.get_session(entry.year, "British Grand Prix", "Q")
    session.load(telemetry=True, weather=False, messages=False)
    laps = session.laps.pick_drivers(entry.code)
    fastest = laps.pick_fastest()
    tel = fastest.get_car_data().add_distance()
    try:
        pos = fastest.get_pos_data()
        tel = tel.merge_channels(pos)
    except Exception as e:
        print(f"    (no GPS merge: {e})")
    return fastest, tel


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


def make_segments(x, y):
    pts = np.array([x, y]).T.reshape(-1, 1, 2)
    return np.concatenate([pts[:-1], pts[1:]], axis=1)


def midpoints(arr):
    return (arr[:-1] + arr[1:]) / 2.0


def strip_axes(ax):
    ax.set_facecolor(BG)
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)


def set_shared_bounds(ax, all_x, all_y, aspect=11 / 14, pad_frac=0.08):
    cx, cy = (all_x.max() + all_x.min()) / 2, (all_y.max() + all_y.min()) / 2
    xr, yr = all_x.max() - all_x.min(), all_y.max() - all_y.min()
    half_y = max(yr / 2, xr / (2 * aspect)) * (1 + pad_frac)
    half_x = half_y * aspect
    ax.set_xlim(cx - half_x, cx + half_x)
    ax.set_ylim(cy - half_y, cy + half_y)


def draw_neural(ax, df, entry: EraEntry, line_scale=1.0, brake_scale=1.0):
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
        segs, colors=colors, linewidths=widths,
        alpha=1.0, capstyle="round",
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


def fmt_laptime(td) -> str:
    s = str(td).split()[-1]  # "0:01:24.303000"
    s = s.split(".")
    return s[0].lstrip("0:") + "." + s[-1][:3]


def render_individual(entry: EraEntry, lap_obj, df):
    fig, ax = plt.subplots(figsize=(11, 14))
    fig.set_facecolor(BG)
    strip_axes(ax)
    set_shared_bounds(ax, df["X"].values, df["Y"].values, pad_frac=0.06)
    draw_neural(ax, df, entry)

    fig.text(0.5, 0.956, entry.name, ha="center", color="white",
             fontsize=38, weight="bold", family="serif")
    fig.text(0.5, 0.919, f"{entry.team}  ·  {entry.year}",
             ha="center", color=entry.accent,
             fontsize=12, family="serif")
    fig.text(0.5, 0.895, entry.era_tag, ha="center",
             color="#9098b0", fontsize=10, family="monospace")
    fig.text(0.5, 0.060, f"SILVERSTONE  ·  POLE  ·  {fmt_laptime(lap_obj['LapTime'])}",
             ha="center", color="#bcc6df",
             fontsize=12, family="monospace", weight="bold")

    out = OUTPUT_DIR / f"era_{entry.year}_{entry.code}.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor=BG, pad_inches=0.3)
    plt.close(fig)
    print(f"  saved {out.name}")


def render_era_grid(bundle):
    fig, axes = plt.subplots(1, 3, figsize=(24, 13))
    fig.set_facecolor(BG)

    all_x = np.concatenate([df["X"].values for _, _, df in bundle])
    all_y = np.concatenate([df["Y"].values for _, _, df in bundle])

    # Reference (fastest) laptime to compute deltas
    times_sec = [lap_obj["LapTime"].total_seconds() for _, lap_obj, _ in bundle]
    fastest_sec = min(times_sec)

    for ax, (entry, lap_obj, df) in zip(axes, bundle):
        strip_axes(ax)
        set_shared_bounds(ax, all_x, all_y, pad_frac=0.10)
        draw_neural(ax, df, entry, line_scale=0.85, brake_scale=0.7)

        # Year (huge accent number)
        ax.text(0.5, 1.10, str(entry.year), transform=ax.transAxes,
                ha="center", color=entry.accent,
                fontsize=44, weight="bold", family="serif")
        ax.text(0.5, 1.05, entry.era_tag, transform=ax.transAxes,
                ha="center", color="#7a809a",
                fontsize=9, family="monospace")

        # Driver + team
        ax.text(0.5, -0.03, entry.name, transform=ax.transAxes,
                ha="center", color="white",
                fontsize=18, weight="bold", family="serif")
        ax.text(0.5, -0.065, entry.team, transform=ax.transAxes,
                ha="center", color=entry.accent,
                fontsize=10, family="serif")

        # Laptime + delta
        delta = lap_obj["LapTime"].total_seconds() - fastest_sec
        if delta < 1e-3:
            delta_str = "FASTEST"
            delta_color = "#bcc6df"
        else:
            delta_str = f"+{delta:.3f}s"
            delta_color = "#9098b0"
        ax.text(0.5, -0.105, fmt_laptime(lap_obj["LapTime"]),
                transform=ax.transAxes, ha="center", color="#dde3f0",
                fontsize=14, family="monospace", weight="bold")
        ax.text(0.5, -0.135, delta_str, transform=ax.transAxes,
                ha="center", color=delta_color,
                fontsize=10, family="monospace")

    fig.suptitle("SILVERSTONE  ·  THROUGH ERAS",
                 color="white", fontsize=22, y=0.97,
                 weight="bold", family="serif")
    fig.text(0.5, 0.926, "QUALIFYING POLE LAPS  ·  2020 — 2024",
             ha="center", color="#9098b0", fontsize=11, family="serif")
    plt.subplots_adjust(top=0.86, bottom=0.13, wspace=0.06)

    out = OUTPUT_DIR / "era_grid.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor=BG, pad_inches=0.4)
    plt.close(fig)
    print(f"saved {out.name}")


def main():
    bundle = []
    for entry in ENTRIES:
        lap_obj, tel = fetch_entry(entry)
        df = prep(tel)
        bundle.append((entry, lap_obj, df))
        print(f"    {entry.year} {entry.code}: {fmt_laptime(lap_obj['LapTime'])} ({len(df)} samples)")

    print("\nRendering individual fingerprints...")
    for entry, lap_obj, df in bundle:
        render_individual(entry, lap_obj, df)

    print("\nRendering era grid...")
    render_era_grid(bundle)

    print(f"\nEra comparison rendered → {OUTPUT_DIR}\\")


if __name__ == "__main__":
    main()
