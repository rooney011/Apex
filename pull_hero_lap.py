"""
Pull and explore the hero lap (Hamilton — Silverstone 2020 pole).
Loads telemetry, plots every channel + GPS track map, saves raw CSV.
"""

from pathlib import Path
import warnings

import fastf1
import matplotlib.pyplot as plt
import pandas as pd

warnings.filterwarnings("ignore", category=FutureWarning)

CACHE_DIR = Path(__file__).parent / "fastf1_cache"
CACHE_DIR.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))

DATA_DIR = Path(__file__).parent / "data"
RENDER_DIR = Path(__file__).parent / "renders" / "exploration"
DATA_DIR.mkdir(parents=True, exist_ok=True)
RENDER_DIR.mkdir(parents=True, exist_ok=True)


def load_hero_lap():
    """Load Hamilton's pole lap from 2020 British GP qualifying."""
    print("Loading 2020 British GP qualifying session...")
    session = fastf1.get_session(2020, "British Grand Prix", "Q")
    session.load(telemetry=True, weather=False, messages=False)

    ham_laps = session.laps.pick_drivers("HAM")
    fastest = ham_laps.pick_fastest()

    print(f"\nHero lap loaded:")
    print(f"  Driver:   {fastest['Driver']}")
    print(f"  Lap time: {fastest['LapTime']}")
    print(f"  Lap #:    {fastest['LapNumber']}")
    print(f"  Compound: {fastest['Compound']}")

    return session, fastest


def summarize_telemetry(tel: pd.DataFrame):
    """Print a summary of what telemetry channels are available."""
    print("\n" + "=" * 60)
    print("TELEMETRY CHANNELS AVAILABLE")
    print("=" * 60)
    print(f"Total samples: {len(tel)}")
    print(f"Duration:      {(tel['Time'].iloc[-1] - tel['Time'].iloc[0]).total_seconds():.2f}s")
    print(f"\nColumns: {list(tel.columns)}")
    print("\nSample (first 3 rows):")
    print(tel.head(3).to_string())
    print("\nData types:")
    print(tel.dtypes.to_string())


def plot_all_channels(tel: pd.DataFrame, output_path: Path):
    """Plot every numeric telemetry channel as a separate subplot."""
    distance = tel["Distance"]

    channels = [
        ("Speed", "Speed (km/h)", "tab:blue"),
        ("Throttle", "Throttle %", "tab:green"),
        ("Brake", "Brake (on/off)", "tab:red"),
        ("nGear", "Gear", "tab:purple"),
        ("RPM", "Engine RPM", "tab:orange"),
        ("DRS", "DRS state", "tab:cyan"),
    ]

    fig, axes = plt.subplots(len(channels), 1, figsize=(14, 12), sharex=True)
    fig.suptitle(
        "Hamilton — Silverstone 2020 Pole Lap — Every Telemetry Channel",
        fontsize=14,
        fontweight="bold",
    )

    for ax, (col, label, color) in zip(axes, channels):
        if col not in tel.columns:
            ax.text(0.5, 0.5, f"{col} not available", ha="center", va="center")
            ax.set_ylabel(label)
            continue
        ax.plot(distance, tel[col], color=color, linewidth=1.2)
        ax.set_ylabel(label)
        ax.grid(alpha=0.3)

    axes[-1].set_xlabel("Distance along lap (m)")
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"\nSaved channel plot to: {output_path}")


def plot_track_map(tel: pd.DataFrame, output_path: Path):
    """Plot the GPS x/y track map, colored by speed."""
    if "X" not in tel.columns or "Y" not in tel.columns:
        print("No GPS (X, Y) data available — skipping track map.")
        return

    fig, ax = plt.subplots(figsize=(10, 10))
    scatter = ax.scatter(
        tel["X"], tel["Y"],
        c=tel["Speed"], cmap="plasma",
        s=3, linewidths=0,
    )
    ax.set_aspect("equal")
    ax.set_title("Silverstone — Hamilton's pole lap, colored by speed", fontsize=13)
    ax.set_xlabel("X position")
    ax.set_ylabel("Y position")
    cbar = plt.colorbar(scatter, ax=ax, label="Speed (km/h)")
    ax.grid(alpha=0.2)
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"Saved track map to: {output_path}")


def main():
    session, hero_lap = load_hero_lap()
    telemetry = hero_lap.get_car_data().add_distance()

    # Also try to get position data merged in for GPS map
    try:
        pos = hero_lap.get_pos_data()
        telemetry = telemetry.merge_channels(pos)
    except Exception as e:
        print(f"(Could not merge GPS position data: {e})")

    summarize_telemetry(telemetry)

    plot_all_channels(telemetry, RENDER_DIR / "channels.png")
    plot_track_map(telemetry, RENDER_DIR / "track_map.png")

    csv_path = DATA_DIR / "hero_lap_telemetry.csv"
    telemetry.to_csv(csv_path, index=False)
    print(f"\nSaved raw telemetry CSV to: {csv_path}")
    print(f"Shape: {telemetry.shape}")


if __name__ == "__main__":
    main()
