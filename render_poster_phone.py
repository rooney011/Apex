"""
Polished Neural Trace fingerprint in two aspect ratios.
  - poster (11x14)  — desktop / print proof
  - phone  (9x16)   — Instagram story / wallpaper
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.collections import LineCollection
from matplotlib.colors import LinearSegmentedColormap, Normalize

DATA_CSV = Path(__file__).parent / "data" / "hero_lap_telemetry.csv"
OUTPUT_DIR = Path(__file__).parent / "renders" / "poster_phone"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DRIVER_NAME = "HAMILTON"
EVENT = "SILVERSTONE  ·  2020"
SESSION_LINE = "POLE  ·  1:24.303"
STATLINE = "TOP SPEED  325 KM/H     ·     SOFT TYRE     ·     LAP 21/25"
BG = "#06060e"


def smooth(arr, window):
    if window <= 1:
        return arr.astype(float)
    return pd.Series(arr.astype(float)).rolling(
        window=window, center=True, min_periods=1
    ).mean().values


def load_lap():
    df = pd.read_csv(DATA_CSV)
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
    for spine in ax.spines.values():
        spine.set_visible(False)


def fit_axes(ax, x, y, pad_frac=0.04, aspect_ratio=11 / 14):
    """Tight fit that respects the canvas aspect ratio."""
    cx, cy = (x.max() + x.min()) / 2, (y.max() + y.min()) / 2
    xr, yr = x.max() - x.min(), y.max() - y.min()
    # Decide which dim to fit first based on canvas aspect
    half_y = max(yr / 2, xr / (2 * aspect_ratio))
    half_x = half_y * aspect_ratio
    half_y *= 1 + pad_frac
    half_x *= 1 + pad_frac
    ax.set_xlim(cx - half_x, cx + half_x)
    ax.set_ylim(cy - half_y, cy + half_y)


def draw_neural(ax, df, line_scale=1.0, brake_scale=1.0):
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
        "neural_v3",
        ["#5db8d8", "#a8d8e8", "#dff0f6", "#f0f7fa", "#ffffff"],
    )
    colors = cmap(Normalize(0, 100)(seg_throttle))

    # Glow stack
    for mult, alpha in [(4.5, 0.05), (2.6, 0.10)]:
        ax.add_collection(LineCollection(
            segs, colors=colors, linewidths=widths * mult,
            alpha=alpha, capstyle="round",
        ))
    ax.add_collection(LineCollection(
        segs, colors=colors, linewidths=widths, alpha=1.0, capstyle="round",
    ))

    # Brake markers
    brake_idx = np.where(seg_brake > 0.5)[0]
    if len(brake_idx):
        bx = (x[brake_idx] + x[brake_idx + 1]) / 2
        by = (y[brake_idx] + y[brake_idx + 1]) / 2
        ax.scatter(bx, by, s=110 * brake_scale, c="#ff2818", alpha=0.22,
                   edgecolors="none", zorder=8)
        ax.scatter(bx, by, s=28 * brake_scale, c="#ff8050", alpha=0.95,
                   edgecolors="none", zorder=9)
        ax.scatter(bx, by, s=6 * brake_scale, c="white", alpha=1.0,
                   edgecolors="none", zorder=10)

    # Starting-grid marker: small pip at lap start
    ax.scatter([x[0]], [y[0]], s=120, marker="o", c="none",
               edgecolors="#9ad8ee", linewidths=1.4, alpha=0.9, zorder=11)
    ax.scatter([x[0]], [y[0]], s=12, c="#9ad8ee", alpha=0.95, zorder=12)


def add_chrome_poster(fig):
    fig.text(0.5, 0.952, DRIVER_NAME, ha="center", color="white",
             fontsize=38, weight="bold", family="serif")
    fig.text(0.5, 0.913, EVENT, ha="center", color="#9098b0",
             fontsize=13, family="serif")
    fig.text(0.5, 0.890, "—", ha="center", color="#9098b0", fontsize=14)
    fig.text(0.5, 0.062, SESSION_LINE, ha="center", color="#bcc6df",
             fontsize=12, family="monospace", weight="bold")
    fig.text(0.5, 0.038, STATLINE, ha="center", color="#5a6378",
             fontsize=8, family="monospace")


def add_chrome_phone(fig):
    fig.text(0.5, 0.962, DRIVER_NAME, ha="center", color="white",
             fontsize=32, weight="bold", family="serif")
    fig.text(0.5, 0.928, EVENT, ha="center", color="#9098b0",
             fontsize=11, family="serif")
    fig.text(0.5, 0.040, SESSION_LINE, ha="center", color="#bcc6df",
             fontsize=10, family="monospace", weight="bold")


def render_poster(df):
    fig, ax = plt.subplots(figsize=(11, 14))
    fig.set_facecolor(BG)
    strip_axes(ax)
    fit_axes(ax, df["X"].values, df["Y"].values,
             pad_frac=0.06, aspect_ratio=11 / 14)
    draw_neural(ax, df, line_scale=1.0, brake_scale=1.0)
    add_chrome_poster(fig)
    out = OUTPUT_DIR / "A_neural_v3_poster.png"
    fig.savefig(out, dpi=220, bbox_inches="tight", facecolor=BG, pad_inches=0.3)
    plt.close(fig)
    print(f"Saved {out}")


def render_phone(df):
    fig, ax = plt.subplots(figsize=(9, 16))
    fig.set_facecolor(BG)
    strip_axes(ax)
    fit_axes(ax, df["X"].values, df["Y"].values,
             pad_frac=0.04, aspect_ratio=9 / 16)
    draw_neural(ax, df, line_scale=1.1, brake_scale=1.2)
    add_chrome_phone(fig)
    out = OUTPUT_DIR / "A_neural_v3_phone.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor=BG, pad_inches=0.3)
    plt.close(fig)
    print(f"Saved {out}")


def main():
    df = load_lap()
    print(f"Loaded {len(df)} samples")
    render_poster(df)
    render_phone(df)
    print(f"\nNeural Trace polished in 2 aspect ratios → {OUTPUT_DIR}\\")


if __name__ == "__main__":
    main()
