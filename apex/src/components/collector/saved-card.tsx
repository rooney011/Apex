"use client";

import { motion } from "framer-motion";
import { ExternalLink, Link2, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfigurableFingerprint } from "@/components/canvas/configurable-fingerprint";
import { showToast } from "@/components/hud/toast";
import { PALETTES } from "@/lib/canvas/params";
import { buildShareUrl, encodeShare } from "@/lib/collector/share";
import { deleteOne, type SavedPreset } from "@/lib/collector/storage";
import { useLap } from "@/lib/data/client";
import { useScrubStore } from "@/lib/store/scrub";
import { cn } from "@/lib/utils";

type Props = { preset: SavedPreset; index: number };

const ease = [0.22, 1, 0.36, 1] as const;

export function SavedCard({ preset, index }: Props) {
  const router = useRouter();
  const setActiveLapId = useScrubStore((s) => s.setActiveLapId);
  const { data: lap, isLoading, isError } = useLap(preset.lapId);

  const palette = PALETTES[preset.params.paletteId];

  const onOpen = () => {
    setActiveLapId(preset.lapId);
    const encoded = encodeShare({ lapId: preset.lapId, params: preset.params });
    router.push(`/canvas#p=${encoded}`);
  };

  const onCopy = async () => {
    const url = buildShareUrl({ lapId: preset.lapId, params: preset.params });
    try {
      await navigator.clipboard.writeText(url);
      showToast("Share link copied");
    } catch {
      showToast("Could not copy", "error");
    }
  };

  const onDelete = () => {
    if (!window.confirm(`Delete "${preset.name}"?`)) return;
    deleteOne(preset.id);
    showToast("Preset deleted");
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease }}
      className="panel relative overflow-hidden"
    >
      {/* Palette accent stripe */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${palette.stops[0]}, ${palette.stops[1]}, ${palette.stops[2]})`,
        }}
        aria-hidden
      />

      <div
        className="aspect-square w-full grid-overlay relative cursor-pointer group"
        onClick={onOpen}
      >
        {lap ? (
          <ConfigurableFingerprint lap={lap} params={preset.params} />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-apex-muted">
            {isError ? (
              <p className="label-mono text-apex-red">LAP_NOT_FOUND</p>
            ) : (
              <Loader2 className="size-5 animate-spin" />
            )}
          </div>
        )}

        {/* Hover overlay */}
        {!isLoading && lap && (
          <div className="absolute inset-0 bg-apex-bg/0 group-hover:bg-apex-bg/40 transition-colors grid place-items-center opacity-0 group-hover:opacity-100">
            <span className="label-mono flex items-center gap-1.5 px-3 py-1.5 rounded border border-apex-red bg-apex-bg/80 backdrop-blur text-apex-red">
              <ExternalLink className="size-3" strokeWidth={2} />
              OPEN_IN_CANVAS
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="label-mono">{palette.label}_PRESET · {preset.params.aspect.toUpperCase()}</p>
        <h3 className="font-sans text-base font-bold tracking-tight mt-1 truncate">
          {preset.name}
        </h3>
        {lap && (
          <p className="label-mono mt-1 !text-[10px]">
            {lap.driver_name} · {lap.year} · {lap.track}
          </p>
        )}
        <p className="label-mono !text-[9px] text-apex-muted/70 mt-1">
          {formatRelative(preset.createdAt)}
        </p>

        <div className="flex items-center gap-1 mt-3">
          <SmallButton
            label="OPEN"
            icon={<ExternalLink className="size-3" />}
            onClick={onOpen}
            tone="red"
          />
          <SmallButton
            label="SHARE"
            icon={<Link2 className="size-3" />}
            onClick={onCopy}
          />
          <SmallButton
            label="DELETE"
            icon={<Trash2 className="size-3" />}
            onClick={onDelete}
            tone="muted"
          />
        </div>
      </div>
    </motion.article>
  );
}

function SmallButton({
  label,
  icon,
  onClick,
  tone,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: "red" | "muted";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 rounded border border-apex-border px-2 py-1.5 transition-colors",
        tone === "red"
          ? "bg-apex-red text-white hover:brightness-110"
          : tone === "muted"
          ? "text-apex-muted hover:text-foreground hover:bg-apex-surface-2"
          : "text-foreground hover:bg-apex-surface-2",
      )}
    >
      {icon}
      <span className="label-mono !text-[9px]">{label}</span>
    </button>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ts).toISOString().slice(0, 10);
}
