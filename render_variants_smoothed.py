"""
Smoothed v2 of the three fingerprint variants.
  - Rolling-mean smoothing on GPS + telemetry signals
  - Tighter composition, better typography
  - Higher resolution
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.collections import LineCollection
from matplotlib.colors import LinearSegmentedColormap, Normalize
from matplotlib.patheffects import withStroke

DATA_CSV = Path(__file__).parent / "data" / "hero_lap_telemetry.csv"
OUTPUT_DIR = Path(__file__).parent / "renders" / "variants_smoothed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DRIVER_NAME = "HAMILTON"
EVENT = "SILVERSTONE   ·   2020"
SUBTITLE = "POLE  ·  1:24.303"


# -----------------------------------------------------------------------------
# Data loading & smoothing
# -----------------------------------------------------------------------------
def smooth(arr: np.ndarray, window: int) -> np.ndarray:
    if window <= 1:
        return arr.astype(float)
    s = pd.Series(arr.astype(float))
    return s.rolling(window=window, center=True, min_periods=1).mean().values


def load_lap() -> pd.DataFrame:
    df = pd.read_csv(DATA_CSV)
    df = df.dropna(subset=["X", "Y", "Speed", "Throttle"]).reset_index(drop=True)

    # Close the loop visually
    if (df.iloc[0][["X", "Y"]] != df.iloc[-1][["X", "Y"]]).any():
        df = pd.concat([df, df.iloc[[0]]], ignore_index=True)

    # Brake -> int
    if df["Brake"].dtype == bool:
        df["Brake"] = df["Brake"].astype(int)
    else:
        df["Brake"] = (df["Brake"].astype(str).str.lower() == "true").astype(int)

    # Smooth GPS to remove micro-jitter (light)
    df["X"] = smooth(df["X"].values, 3)
    df["Y"] = smooth(df["Y"].values, 3)
    # Smooth telemetry more aggressively for cleaner mappings
    df["SpeedSmooth"] = smooth(df["Speed"].values, 9)
    df["ThrottleSmooth"] = smooth(df["Throttle"].values, 5)

    return df


def make_segments(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    pts = np.array([x, y]).T.reshape(-1, 1, 2)
    return np.concatenate([pts[:-1], pts[1:]], axis=1)


def midpoints(arr: np.ndarray) -> np.ndarray:
    return (arr[:-1] + arr[1:]) / 2.0


def strip_axes(ax, bg_color):
    ax.set_facecolor(bg_color)
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)


def fit_axes(ax, x, y, pad_frac=0.10):
    xr, yr = x.max() - x.min(), y.max() - y.min()
    pad = max(xr, yr) * pad_frac
    cx, cy = (x.max() + x.min()) / 2, (y.max() + y.min()) / 2
    half = max(xr, yr) / 2 + pad
    ax.set_xlim(cx - half, cx + half)
    ax.set_ylim(cy - half, cy + half)


# -----------------------------------------------------------------------------
# Variant A — Neural Trace v2
# -----------------------------------------------------------------------------
# Improvements:
#   - Sharper brake markers: smaller, hotter, less blobby
#   - Throttle-driven subtle hue along the main line (cyan-white spectrum)
#   - Cleaner glow stack (3 layers, no over-saturation)
#   - Minimum width on straights so they're still visible
# -----------------------------------------------------------------------------
def variant_neural(df: pd.DataFrame, ax):
    x, y = df["X"].values, df["Y"].values
    throttle = df["ThrottleSmooth"].values
    brake = df["Brake"].values
    speed = df["SpeedSmooth"].values

    segs = make_segments(x, y)
    seg_throttle = midpoints(throttle)
    seg_speed = midpoints(speed)
    seg_brake = midpoints(brake.astype(float))

    # Width: slow = thick, fast = thin, with min floor
    sn = (seg_speed - seg_speed.min()) / (seg_speed.max() - seg_speed.min() + 1e-9)
    widths = 1.8 + 5.5 * (1 - sn)

    # Color: throttle drives cool-white intensity (deeper cyan on lift, white on full)
    cmap = LinearSegmentedColormap.from_list(
        "neural_v2",
        ["#5db8d8", "#a8d8e8", "#dff0f6", "#f0f7fa", "#ffffff"],
    )
    colors = cmap(Normalize(0, 100)(seg_throttle))

    bg = "#06060e"
    strip_axes(ax, bg)
    fit_axes(ax, x, y)

    # 3-layer glow — softer & tighter than v1
    for mult, alpha in [(4.5, 0.05), (2.6, 0.10)]:
        ax.add_collection(LineCollection(
            segs, colors=colors, linewidths=widths * mult,
            alpha=alpha, capstyle="round",
        ))
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=widths, alpha=1.0, capstyle="round",
    ))

    # Brake markers: small sharp hot spots, not blob takeovers
    brake_idx = np.where(seg_brake > 0.5)[0]
    if len(brake_idx):
        bx = (x[brake_idx] + x[brake_idx + 1]) / 2
        by = (y[brake_idx] + y[brake_idx + 1]) / 2
        # outer red glow
        ax.scatter(bx, by, s=70, c="#ff2818", alpha=0.18, edgecolors="none", zorder=8)
        # inner hot core
        ax.scatter(bx, by, s=18, c="#ff7a4a", alpha=0.85, edgecolors="none", zorder=9)
        # white-hot center
        ax.scatter(bx, by, s=4, c="white", alpha=0.95, edgecolors="none", zorder=10)
    return bg


# -----------------------------------------------------------------------------
# Variant B — Heat Map v2
# -----------------------------------------------------------------------------
# Improvements:
#   - Custom motorsport colormap (deep indigo → magenta → orange → bright yellow)
#   - Tighter inner core (sharper line) with outer glow halo
#   - Percentile-based normalization for better contrast
#   - Brake markers as small perpendicular dashes (less generic than dots)
# -----------------------------------------------------------------------------
def variant_heat(df: pd.DataFrame, ax):
    x, y = df["X"].values, df["Y"].values
    speed = df["SpeedSmooth"].values
    brake = df["Brake"].values

    segs = make_segments(x, y)
    seg_speed = midpoints(speed)
    seg_brake = midpoints(brake.astype(float))

    cmap = LinearSegmentedColormap.from_list(
        "heat_v2",
        ["#2a0a52", "#7a1480", "#d63a7a", "#ff7a32", "#ffd23c", "#fff8b0"],
    )
    # Use 5th-95th percentile for stronger contrast
    lo, hi = np.percentile(seg_speed, [5, 95])
    norm = Normalize(lo, hi, clip=True)
    colors = cmap(norm(seg_speed))

    bg = "#04030a"
    strip_axes(ax, bg)
    fit_axes(ax, x, y)

    # Outer halo
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=18, alpha=0.03, capstyle="round",
    ))
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=9, alpha=0.08, capstyle="round",
    ))
    # Main mid layer
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=4.0, alpha=0.65, capstyle="round",
    ))
    # Sharp inner core
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=1.5, alpha=1.0, capstyle="round",
    ))

    # Brake markers: small perpendicular dashes
    brake_idx = np.where(seg_brake > 0.5)[0]
    if len(brake_idx):
        for i in brake_idx:
            dx, dy = x[i + 1] - x[i], y[i + 1] - y[i]
            length = np.hypot(dx, dy) + 1e-9
            # perpendicular vector
            px, py = -dy / length, dx / length
            mid_x = (x[i] + x[i + 1]) / 2
            mid_y = (y[i] + y[i + 1]) / 2
            L = 70  # half-length of the dash
            ax.plot(
                [mid_x - px * L, mid_x + px * L],
                [mid_y - py * L, mid_y + py * L],
                color="white", linewidth=1.0, alpha=0.6, zorder=10,
            )
    return bg


# -----------------------------------------------------------------------------
# Variant C — Ink Print v2
# -----------------------------------------------------------------------------
# Improvements:
#   - Aggressively smoothed speed → smooth thickness gradient
#   - Capped max thickness (no blob)
#   - More whitespace, better margins
#   - Subtle paper texture via small noise underlay
#   - Slightly warmer ink (#1a1812 instead of pure black)
# -----------------------------------------------------------------------------
def variant_ink(df: pd.DataFrame, ax):
    x, y = df["X"].values, df["Y"].values
    # Extra smoothing on speed for ultra-smooth thickness
    speed = smooth(df["Speed"].values, 21)

    segs = make_segments(x, y)
    seg_speed = midpoints(speed)

    # Cap thickness range with nonlinear mapping
    sn = (seg_speed - seg_speed.min()) / (seg_speed.max() - seg_speed.min() + 1e-9)
    # Use a gentle curve so middle speeds aren't too thick
    widths = 0.8 + 7.0 * (1 - sn) ** 1.4

    bg = "#f0e8d4"
    strip_axes(ax, bg)
    fit_axes(ax, x, y, pad_frac=0.13)

    # Soft paper grain (tiny scattered dots, very faint)
    rng = np.random.default_rng(42)
    grain_x = rng.uniform(*ax.get_xlim(), size=2000)
    grain_y = rng.uniform(*ax.get_ylim(), size=2000)
    ax.scatter(grain_x, grain_y, s=0.5, c="#8a7a55", alpha=0.06, zorder=0)

    # Slight ink-bleed shadow under the stroke
    ax.add_collection(LineCollection(
        segs, colors=["#2a2620"] * len(segs),
        linewidths=widths * 1.35, alpha=0.10, capstyle="round",
    ))
    # Main ink stroke
    ax.add_collection(LineCollection(
        segs, colors=["#1a1812"] * len(segs),
        linewidths=widths, alpha=0.95, capstyle="round",
    ))
    return bg


# -----------------------------------------------------------------------------
# Chrome / typography
# -----------------------------------------------------------------------------
def add_chrome(fig, title_color, sub_color, accent=None):
    fig.text(
        0.5, 0.948, DRIVER_NAME,
        ha="center", color=title_color,
        fontsize=36, weight="bold", family="serif",
    )
    fig.text(
        0.5, 0.908, EVENT,
        ha="center", color=sub_color,
        fontsize=12.5, family="serif", weight="normal",
    )
    # subtle divider
    fig.text(
        0.5, 0.882, "—",
        ha="center", color=sub_color, fontsize=14,
    )
    fig.text(
        0.5, 0.055, SUBTITLE,
        ha="center", color=sub_color,
        fontsize=11, family="monospace", weight="bold",
    )


def render(name, fn, df, title_color, sub_color):
    fig, ax = plt.subplots(figsize=(11, 14))
    bg = fn(df, ax)
    fig.set_facecolor(bg)
    add_chrome(fig, title_color, sub_color)
    out = OUTPUT_DIR / f"fingerprint_{name}.png"
    fig.savefig(out, dpi=220, bbox_inches="tight", facecolor=bg, pad_inches=0.4)
    plt.close(fig)
    print(f"Saved {out}")


def main():
    df = load_lap()
    print(f"Loaded {len(df)} samples (smoothed)")

    render("A_neural_v2", variant_neural, df, "#ffffff", "#8d8da0")
    render("B_heat_v2", variant_heat, df, "#ffffff", "#b0a0c8")
    render("C_ink_v2", variant_ink, df, "#1a1812", "#6a5638")

    print(f"\nSmoothed variants saved to {OUTPUT_DIR}\\")


if __name__ == "__main__":
    main()
