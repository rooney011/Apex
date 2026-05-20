"""
Same-race multi-driver fingerprint comparison.
2020 British GP Qualifying: HAM (pole) vs BOT (P2) vs VER (P4).
Outputs three individual prints, a 3-up grid, and a single-canvas overlay.
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

OUTPUT_DIR = Path(__file__).parent / "renders" / "same_race"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BG = "#06060e"


@dataclass
class DriverEntry:
    code: str
    name: str
    team: str
    accent: str            # primary overlay color (vivid)
    accent_pale: str       # pale variant for glow stack
    line_cmap: list[str]   # colors used for individual fingerprint line


DRIVERS = [
    DriverEntry(
        code="HAM", name="HAMILTON", team="MERCEDES",
        accent="#00e8ff", accent_pale="#9adff0",
        line_cmap=["#5db8d8", "#a8d8e8", "#dff0f6", "#f0f7fa", "#ffffff"],
    ),
    DriverEntry(
        code="BOT", name="BOTTAS", team="MERCEDES",
        accent="#ffb000", accent_pale="#ffdb90",
        line_cmap=["#7a5a18", "#cf962d", "#f5c66b", "#ffe5a8", "#fff6dc"],
    ),
    DriverEntry(
        code="VER", name="VERSTAPPEN", team="RED BULL",
        accent="#ff3a3a", accent_pale="#ff8a8a",
        line_cmap=["#751212", "#c52f2f", "#ff6f5a", "#ffb09a", "#ffe6dc"],
    ),
]


# -----------------------------------------------------------------------------
# Data loading + smoothing
# -----------------------------------------------------------------------------
def smooth(arr, window):
    if window <= 1:
        return arr.astype(float)
    return pd.Series(arr.astype(float)).rolling(
        window=window, center=True, min_periods=1,
    ).mean().values


def fetch_lap_for_driver(session, code):
    laps = session.laps.pick_drivers(code)
    fastest = laps.pick_fastest()
    tel = fastest.get_car_data().add_distance()
    try:
        pos = fastest.get_pos_data()
        tel = tel.merge_channels(pos)
    except Exception as e:
        print(f"  (no GPS merge for {code}: {e})")
    return fastest, tel


def prep_dataframe(tel: pd.DataFrame) -> pd.DataFrame:
    df = tel.dropna(subset=["X", "Y", "Speed", "Throttle"]).reset_index(drop=True)
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


def load_all():
    print("Loading 2020 British GP qualifying session (cached)...")
    session = fastf1.get_session(2020, "British Grand Prix", "Q")
    session.load(telemetry=True, weather=False, messages=False)

    bundle = []
    for d in DRIVERS:
        print(f"  pulling {d.code}...")
        lap_obj, tel = fetch_lap_for_driver(session, d.code)
        df = prep_dataframe(tel)
        bundle.append((d, lap_obj, df))
        print(f"    {d.code} fastest: {lap_obj['LapTime']} ({len(df)} samples)")
    return bundle


# -----------------------------------------------------------------------------
# Rendering primitives
# -----------------------------------------------------------------------------
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
    for spine in ax.spines.values():
        spine.set_visible(False)


def fit_axes(ax, x, y, pad_frac=0.06, aspect=11 / 14):
    cx, cy = (x.max() + x.min()) / 2, (y.max() + y.min()) / 2
    xr, yr = x.max() - x.min(), y.max() - y.min()
    half_y = max(yr / 2, xr / (2 * aspect))
    half_x = half_y * aspect
    half_y *= 1 + pad_frac
    half_x *= 1 + pad_frac
    ax.set_xlim(cx - half_x, cx + half_x)
    ax.set_ylim(cy - half_y, cy + half_y)


def draw_neural(ax, df: pd.DataFrame, driver: DriverEntry,
                line_scale=1.0, brake_scale=1.0):
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

    cmap = LinearSegmentedColormap.from_list(
        f"line_{driver.code}", driver.line_cmap,
    )
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
               edgecolors=driver.accent, linewidths=1.4, alpha=0.9, zorder=11)
    ax.scatter([x[0]], [y[0]], s=11, c=driver.accent,
               alpha=0.95, zorder=12)


# -----------------------------------------------------------------------------
# Individual fingerprints
# -----------------------------------------------------------------------------
def render_individual(driver: DriverEntry, lap_obj, df: pd.DataFrame):
    fig, ax = plt.subplots(figsize=(11, 14))
    fig.set_facecolor(BG)
    strip_axes(ax)
    fit_axes(ax, df["X"].values, df["Y"].values, pad_frac=0.06, aspect=11 / 14)
    draw_neural(ax, df, driver)

    laptime = str(lap_obj["LapTime"]).split()[-1]  # "0:01:24.303000"
    laptime = laptime.lstrip("0:").split(".")[0] + "." + laptime.split(".")[-1][:3]
    if laptime.startswith("1:"):
        pass  # already nice
    else:
        laptime = laptime  # passthrough

    fig.text(0.5, 0.952, driver.name, ha="center", color="white",
             fontsize=38, weight="bold", family="serif")
    fig.text(0.5, 0.913, f"SILVERSTONE  ·  2020  ·  {driver.team}",
             ha="center", color="#9098b0", fontsize=12, family="serif")
    fig.text(0.5, 0.890, "—", ha="center", color="#9098b0", fontsize=14)
    fig.text(0.5, 0.062, f"QUALIFYING  ·  {laptime}",
             ha="center", color="#bcc6df",
             fontsize=12, family="monospace", weight="bold")

    out = OUTPUT_DIR / f"individual_{driver.code}.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor=BG, pad_inches=0.3)
    plt.close(fig)
    print(f"  saved {out.name}")


# -----------------------------------------------------------------------------
# 3-up comparison grid (single composite image)
# -----------------------------------------------------------------------------
def render_grid(bundle):
    fig, axes = plt.subplots(1, 3, figsize=(22, 12))
    fig.set_facecolor(BG)

    # Shared bounds across all drivers so tracks align
    all_x = np.concatenate([df["X"].values for _, _, df in bundle])
    all_y = np.concatenate([df["Y"].values for _, _, df in bundle])

    for ax, (driver, lap_obj, df) in zip(axes, bundle):
        strip_axes(ax)
        # Shared axis limits across all panels
        cx, cy = (all_x.max() + all_x.min()) / 2, (all_y.max() + all_y.min()) / 2
        xr, yr = all_x.max() - all_x.min(), all_y.max() - all_y.min()
        aspect = 11 / 14
        half_y = max(yr / 2, xr / (2 * aspect)) * 1.08
        half_x = half_y * aspect
        ax.set_xlim(cx - half_x, cx + half_x)
        ax.set_ylim(cy - half_y, cy + half_y)

        draw_neural(ax, df, driver, line_scale=0.85, brake_scale=0.7)

        laptime_str = str(lap_obj["LapTime"]).split()[-1]
        # Render driver title above each panel
        ax.text(0.5, 1.04, driver.name, transform=ax.transAxes,
                ha="center", color="white",
                fontsize=22, weight="bold", family="serif")
        ax.text(0.5, 1.005, driver.team, transform=ax.transAxes,
                ha="center", color=driver.accent_pale,
                fontsize=10, family="serif")
        ax.text(0.5, -0.04, laptime_str.split(".")[0] + "." + laptime_str.split(".")[-1][:3],
                transform=ax.transAxes, ha="center", color="#bcc6df",
                fontsize=11, family="monospace", weight="bold")

    fig.suptitle("SILVERSTONE  ·  2020  ·  QUALIFYING",
                 color="#9098b0", fontsize=13, y=0.98, family="serif")
    plt.subplots_adjust(top=0.88, bottom=0.08, wspace=0.08)

    out = OUTPUT_DIR / "comparison_grid.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor=BG, pad_inches=0.4)
    plt.close(fig)
    print(f"saved {out.name}")


# -----------------------------------------------------------------------------
# Overlay: all 3 drivers, single canvas
# -----------------------------------------------------------------------------
def draw_overlay_line(ax, df: pd.DataFrame, driver: DriverEntry):
    x, y = df["X"].values, df["Y"].values
    brake = df["Brake"].values
    segs = make_segments(x, y)

    color = driver.accent
    n = len(segs)
    colors = np.array([list(plt.matplotlib.colors.to_rgba(color))] * n)

    # Glow underlayers
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=10, alpha=0.05, capstyle="round",
    ))
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=5, alpha=0.12, capstyle="round",
    ))
    # Main line
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=1.6, alpha=0.9, capstyle="round",
    ))

    # Brake markers in driver's color
    seg_brake = midpoints(brake.astype(float))
    brake_idx = np.where(seg_brake > 0.5)[0]
    if len(brake_idx):
        bx = (x[brake_idx] + x[brake_idx + 1]) / 2
        by = (y[brake_idx] + y[brake_idx + 1]) / 2
        ax.scatter(bx, by, s=60, c=color, alpha=0.25,
                   edgecolors="none", zorder=8)
        ax.scatter(bx, by, s=12, c="white", alpha=0.85,
                   edgecolors=color, linewidths=0.8, zorder=9)


def render_overlay(bundle):
    fig, ax = plt.subplots(figsize=(11, 14))
    fig.set_facecolor(BG)
    strip_axes(ax)

    all_x = np.concatenate([df["X"].values for _, _, df in bundle])
    all_y = np.concatenate([df["Y"].values for _, _, df in bundle])
    fit_axes(ax, all_x, all_y, pad_frac=0.08, aspect=11 / 14)

    for driver, _, df in bundle:
        draw_overlay_line(ax, df, driver)

    fig.text(0.5, 0.952, "THREE DRIVERS · ONE LAP",
             ha="center", color="white",
             fontsize=26, weight="bold", family="serif")
    fig.text(0.5, 0.918, "SILVERSTONE  ·  2020  ·  QUALIFYING",
             ha="center", color="#9098b0", fontsize=12, family="serif")
    fig.text(0.5, 0.893, "—", ha="center", color="#9098b0", fontsize=14)

    # Driver legend (color + name + laptime, in 1 horizontal row)
    legend_y = 0.085
    spacing = 0.27
    start_x = 0.5 - spacing
    for i, (driver, lap_obj, _) in enumerate(bundle):
        x_pos = start_x + i * spacing
        # color dot
        fig.text(x_pos - 0.04, legend_y, "●",
                 ha="center", color=driver.accent,
                 fontsize=18, family="sans-serif")
        # name
        fig.text(x_pos, legend_y + 0.005, driver.name,
                 ha="left", color="white",
                 fontsize=11, weight="bold", family="serif")
        # laptime
        lt = str(lap_obj["LapTime"]).split()[-1]
        lt = lt.split(".")[0] + "." + lt.split(".")[-1][:3]
        fig.text(x_pos, legend_y - 0.018, lt,
                 ha="left", color="#bcc6df",
                 fontsize=9, family="monospace")

    out = OUTPUT_DIR / "comparison_overlay.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor=BG, pad_inches=0.3)
    plt.close(fig)
    print(f"saved {out.name}")


# -----------------------------------------------------------------------------
def main():
    bundle = load_all()

    print("\nRendering individual fingerprints...")
    for driver, lap_obj, df in bundle:
        render_individual(driver, lap_obj, df)

    print("\nRendering 3-up comparison grid...")
    render_grid(bundle)

    print("\nRendering overlay...")
    render_overlay(bundle)

    print(f"\nSame-race comparison rendered → {OUTPUT_DIR}\\")


if __name__ == "__main__":
    main()
