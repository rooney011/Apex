/* Parameters that drive the Canvas / Lab renderer. */

export type Aspect = "square" | "poster" | "phone" | "wide";

export type PaletteId = "neural" | "ice" | "ferrari" | "mono" | "ember";

export type Palette = {
  id: PaletteId;
  label: string;
  /* 3 stops: low throttle, mid throttle, full throttle */
  stops: [string, string, string];
  brake: string;
  bg: string;
  description: string;
};

export const PALETTES: Record<PaletteId, Palette> = {
  neural: {
    id: "neural",
    label: "NEURAL",
    stops: ["#4dc7ff", "#ff8a4a", "#ffffff"],
    brake: "#ff5040",
    bg: "#06060a",
    description: "Default — cool lift, warm mid, white-hot WOT",
  },
  ice: {
    id: "ice",
    label: "ICE",
    stops: ["#1f4f7a", "#5fb3ff", "#e7f7ff"],
    brake: "#ff4d6d",
    bg: "#040912",
    description: "Mercedes-cold blues; brake bursts pop hard",
  },
  ferrari: {
    id: "ferrari",
    label: "FERRARI",
    stops: ["#7a0a0a", "#ff3a1a", "#ffd86a"],
    brake: "#ffd86a",
    bg: "#0a0405",
    description: "Maranello reds running through to canary yellow",
  },
  ember: {
    id: "ember",
    label: "EMBER",
    stops: ["#3a0d04", "#ff5e1f", "#fff2a8"],
    brake: "#ff1801",
    bg: "#080404",
    description: "Hot rod — slow embers to peak white flame",
  },
  mono: {
    id: "mono",
    label: "MONO",
    stops: ["#4a4a52", "#bcbcc5", "#ffffff"],
    brake: "#ffffff",
    bg: "#06060a",
    description: "Greyscale print — peaks read as pure white",
  },
};

export type RenderParams = {
  /* visual */
  segments: number; // 80..400
  smoothing: number; // 1..21 (rolling mean window for GPS x/y)
  strokeWidth: number; // 0.4..4.0
  glow: number; // 0..2 — halo opacity + blur multiplier
  brakeAlpha: number; // 0..1
  brakeSize: number; // 1..8

  showBrakes: boolean;
  showStart: boolean;
  caption: boolean;

  paletteId: PaletteId;
  /* If non-null overrides the lap accent for things like the start pip + caption */
  accentOverride: string | null;
  /* Background override; if null falls back to palette.bg */
  bgOverride: string | null;

  aspect: Aspect;
};

export const DEFAULT_PARAMS: RenderParams = {
  segments: 200,
  smoothing: 5,
  strokeWidth: 1.4,
  glow: 1,
  brakeAlpha: 0.9,
  brakeSize: 4,
  showBrakes: true,
  showStart: true,
  caption: true,
  paletteId: "neural",
  accentOverride: null,
  bgOverride: null,
  aspect: "square",
};

export const ASPECT_RATIOS: Record<Aspect, { w: number; h: number; label: string }> = {
  square: { w: 1000, h: 1000, label: "Square · 1:1" },
  poster: { w: 1100, h: 1400, label: "Poster · 11×14" },
  phone: { w: 900, h: 1600, label: "Phone · 9×16" },
  wide: { w: 1600, h: 900, label: "Wide · 16×9" },
};

/* Curated presets the user can one-click into. */
export const PRESETS: Array<{ id: string; label: string; params: Partial<RenderParams> }> = [
  {
    id: "neural-default",
    label: "Neural Trace",
    params: { paletteId: "neural", segments: 220, smoothing: 5, glow: 1.0 },
  },
  {
    id: "poster-print",
    label: "Poster Print",
    params: {
      paletteId: "ember",
      aspect: "poster",
      segments: 280,
      smoothing: 7,
      glow: 0.6,
      strokeWidth: 1.8,
      brakeSize: 5,
    },
  },
  {
    id: "phone-wallpaper",
    label: "Phone Wallpaper",
    params: {
      paletteId: "neural",
      aspect: "phone",
      segments: 200,
      glow: 1.4,
      strokeWidth: 1.6,
    },
  },
  {
    id: "ferrari-tribute",
    label: "Ferrari Tribute",
    params: {
      paletteId: "ferrari",
      segments: 240,
      glow: 1.1,
      smoothing: 6,
    },
  },
  {
    id: "studio-mono",
    label: "Studio Mono",
    params: {
      paletteId: "mono",
      glow: 0.4,
      strokeWidth: 1.0,
      brakeAlpha: 0.6,
      caption: true,
    },
  },
];

/* Interpolate the palette at a throttle position (0..1).
   stops[0] = idle/lift, stops[1] = mid, stops[2] = full throttle. */
export function paletteAt(palette: Palette, thr01: number): string {
  const t = Math.max(0, Math.min(1, thr01));
  const [a, b, c] = palette.stops.map(hexToRgb);
  if (t < 0.5) return lerpRgb(a, b, t * 2);
  return lerpRgb(b, c, (t - 0.5) * 2);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
