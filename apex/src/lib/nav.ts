import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Compass,
  Flame,
  Gauge,
  Images,
  Info,
  Layers,
  Library,
  Radar,
  Slash,
  Sparkles,
} from "lucide-react";

/* The HUD top-bar tab nav — one per primary route */
export type TopTab = {
  href: "/telemetry" | "/gallery" | "/canvas" | "/collector" | "/about";
  label: string;
  icon: LucideIcon;
};

export const TOP_TABS: TopTab[] = [
  { href: "/telemetry", label: "Telemetry", icon: Gauge },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/canvas", label: "Canvas", icon: Layers },
  { href: "/collector", label: "Collector", icon: Library },
  { href: "/about", label: "About", icon: Info },
];

/* The sidebar's channel list — only meaningful on the Telemetry view, but
   we render it everywhere as the HUD spine. */
export type Channel = {
  id: "velocity" | "gforce" | "throttle" | "braking" | "sectors";
  code: string;
  label: string;
  icon: LucideIcon;
  status: "ACTIVE" | "READY" | "LIVE";
};

export const CHANNELS: Channel[] = [
  { id: "velocity", code: "CH_01", label: "VELOCITY", icon: Activity, status: "ACTIVE" },
  { id: "gforce", code: "CH_02", label: "G-FORCE", icon: Compass, status: "READY" },
  { id: "throttle", code: "CH_03", label: "THROTTLE", icon: Flame, status: "READY" },
  { id: "braking", code: "CH_04", label: "BRAKING", icon: Slash, status: "READY" },
  { id: "sectors", code: "CH_05", label: "SECTORS", icon: Radar, status: "READY" },
];

export const APEX_LOGO_SUB = "VESSEL_REC_STR_AA";
export const APEX_BUILD = "BUILD_2026.05  ·  APEX_OS_0.1";
export const HERO_LAP_TIME = "01:24.303";

export const FOOTER_NOTE = { Sparkles };
