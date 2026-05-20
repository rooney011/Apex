"""
Render three stylistic fingerprint variants of the hero lap.
  A. Neural Trace  — dark bg, glowing line, throttle-driven color, speed-driven width
  B. Heat Map      — dark bg, speed-driven color (plasma), brake bursts
  C. Ink Print     — cream paper, monochrome ink, width by speed
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.collections import LineCollection
from matplotlib.colors import LinearSegmentedColormap, Normalize

DATA_CSV = Path(__file__).parent / "data" / "hero_lap_telemetry.csv"
OUTPUT_DIR = Path(__file__).parent / "renders" / "variants"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DRIVER_NAME = "HAMILTON"
EVENT = "SILVERSTONE  ·  2020"
SUBTITLE = "POLE LAP   1 : 24.303"


def load_lap() -> pd.DataFrame:
    df = pd.read_csv(DATA_CSV)
    df = df.dropna(subset=["X", "Y", "Speed", "Throttle"]).reset_index(drop=True)
    # Close the loop (so the start/finish meet visually)
    if (df.iloc[0][["X", "Y"]] != df.iloc[-1][["X", "Y"]]).any():
        df = pd.concat([df, df.iloc[[0]]], ignore_index=True)
    # Coerce Brake (may load as bool or string)
    if df["Brake"].dtype == bool:
        df["Brake"] = df["Brake"].astype(int)
    else:
        df["Brake"] = (df["Brake"].astype(str).str.lower() == "true").astype(int)
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


def fit_axes(ax, x, y, pad_frac=0.08):
    xr = x.max() - x.min()
    yr = y.max() - y.min()
    pad = max(xr, yr) * pad_frac
    ax.set_xlim(x.min() - pad, x.max() + pad)
    ax.set_ylim(y.min() - pad, y.max() + pad)


# -------- Variant A: Neural Trace --------------------------------------------
def variant_neural(df: pd.DataFrame, ax):
    x, y = df["X"].values, df["Y"].values
    throttle = df["Throttle"].values
    brake = df["Brake"].values
    speed = df["Speed"].values

    segs = make_segments(x, y)
    seg_throttle = midpoints(throttle)
    seg_brake = midpoints(brake)
    seg_speed = midpoints(speed)

    # Width: slow corners thick, fast straights thin
    sn = (seg_speed - seg_speed.min()) / (seg_speed.max() - seg_speed.min() + 1e-9)
    widths = 1.5 + 7.0 * (1 - sn)

    # Color: red (brake/low throttle) -> cream -> cyan-white (full throttle)
    cmap = LinearSegmentedColormap.from_list(
        "fingerprint_neural",
        ["#ff2c2c", "#ff8c4a", "#ffd99a", "#bff7ff", "#e8ffff"],
    )
    norm = Normalize(0, 100)
    colors = cmap(norm(seg_throttle))

    # Brake overrides to pure hot red
    brake_mask = seg_brake > 0.5
    colors[brake_mask] = [1.0, 0.18, 0.12, 1.0]

    bg = "#070710"
    strip_axes(ax, bg)
    fit_axes(ax, x, y)

    # Glow: 3 wider, dimmer underlayers + crisp top
    for mult, alpha in [(5.0, 0.04), (3.0, 0.08), (1.8, 0.18)]:
        ax.add_collection(LineCollection(
            segs, colors=colors, linewidths=widths * mult,
            alpha=alpha, capstyle="round",
        ))
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=widths,
        alpha=1.0, capstyle="round",
    ))
    return bg


# -------- Variant B: Heat Map ------------------------------------------------
def variant_heat(df: pd.DataFrame, ax):
    x, y = df["X"].values, df["Y"].values
    speed = df["Speed"].values
    brake = df["Brake"].values

    segs = make_segments(x, y)
    seg_speed = midpoints(speed)
    seg_brake = midpoints(brake)

    cmap = plt.get_cmap("plasma")
    norm = Normalize(seg_speed.min(), seg_speed.max())
    colors = cmap(norm(seg_speed))

    bg = "#05050a"
    strip_axes(ax, bg)
    fit_axes(ax, x, y)

    # Soft outer glow
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=14, alpha=0.04, capstyle="round",
    ))
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=7, alpha=0.10, capstyle="round",
    ))
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=2.6, alpha=1.0, capstyle="round",
    ))

    # Brake bursts: white-hot dots over brake zones
    brake_idx = np.where(seg_brake > 0.5)[0]
    if len(brake_idx):
        bx = (x[brake_idx] + x[brake_idx + 1]) / 2
        by = (y[brake_idx] + y[brake_idx + 1]) / 2
        ax.scatter(bx, by, s=22, c="white", alpha=0.85,
                   edgecolors="#ffe28a", linewidths=0.6, zorder=10)
    return bg


# -------- Variant C: Ink Print -----------------------------------------------
def variant_ink(df: pd.DataFrame, ax):
    x, y = df["X"].values, df["Y"].values
    speed = df["Speed"].values

    segs = make_segments(x, y)
    seg_speed = midpoints(speed)

    sn = (seg_speed - seg_speed.min()) / (seg_speed.max() - seg_speed.min() + 1e-9)
    widths = 1.0 + 8.5 * (1 - sn)  # slow corners thick, straights thin

    bg = "#f3ecdc"  # cream paper
    strip_axes(ax, bg)
    fit_axes(ax, x, y)

    # Subtle shadow underlayer (ink bleeding)
    ax.add_collection(LineCollection(
        segs, colors=["#1a1a1a"] * len(segs),
        linewidths=widths * 1.4, alpha=0.10, capstyle="round",
    ))
    # Main ink stroke
    ax.add_collection(LineCollection(
        segs, colors=["#0a0a0a"] * len(segs),
        linewidths=widths, alpha=0.95, capstyle="round",
    ))
    return bg


# -------- Frame & title chrome -----------------------------------------------
def add_chrome(fig, bg, title_color, sub_color):
    fig.text(0.5, 0.945, DRIVER_NAME, ha="center", color=title_color,
             fontsize=32, weight="bold", family="serif")
    fig.text(0.5, 0.905, EVENT, ha="center", color=sub_color,
             fontsize=13, family="serif")
    fig.text(0.5, 0.06, SUBTITLE, ha="center", color=sub_color,
             fontsize=11, family="monospace", weight="bold")


def render(name, render_fn, df, title_color, sub_color):
    fig, ax = plt.subplots(figsize=(11, 14))
    bg = render_fn(df, ax)
    fig.set_facecolor(bg)
    add_chrome(fig, bg, title_color, sub_color)
    out = OUTPUT_DIR / f"fingerprint_{name}.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor=bg, pad_inches=0.3)
    plt.close(fig)
    print(f"Saved {out}")


def main():
    df = load_lap()
    print(f"Loaded {len(df)} samples")

    render("A_neural", variant_neural, df, "#ffffff", "#9a9aa8")
    render("B_heat", variant_heat, df, "#ffffff", "#a8a8b8")
    render("C_ink", variant_ink, df, "#1a1a1a", "#5a4f3a")

    print(f"\n3 variants rendered. Open {OUTPUT_DIR}\\ to compare.")


if __name__ == "__main__":
    main()
