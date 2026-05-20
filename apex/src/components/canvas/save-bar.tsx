"use client";

import { BookmarkPlus, Link2 } from "lucide-react";
import { useState } from "react";
import type { RenderParams } from "@/lib/canvas/params";
import { saveOne } from "@/lib/collector/storage";
import { buildShareUrl } from "@/lib/collector/share";
import { PALETTES } from "@/lib/canvas/params";
import { showToast } from "@/components/hud/toast";

type Props = {
  lapId: string;
  driverName: string;
  params: RenderParams;
};

export function SaveBar({ lapId, driverName, params }: Props) {
  const [saving, setSaving] = useState(false);

  const onSave = () => {
    const defaultName = `${driverName} · ${PALETTES[params.paletteId].label}`;
    const name =
      typeof window !== "undefined"
        ? window.prompt("Name this preset", defaultName)?.trim()
        : null;
    if (!name) return;
    setSaving(true);
    try {
      saveOne({ name, lapId, params });
      showToast(`Saved · ${name}`);
    } catch {
      showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const onShare = async () => {
    const url = buildShareUrl({ lapId, params });
    if (!url) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast("Share link copied to clipboard");
      } else {
        showToast("Copy not available in this browser", "error");
      }
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  return (
    <div className="panel p-4">
      <p className="label-mono text-apex-red mb-3">PRESERVE</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="panel-inset px-3 py-3 flex flex-col items-start gap-1 hover:bg-apex-surface-2 transition-colors text-left"
        >
          <span className="flex items-center gap-1.5 label-mono">
            <BookmarkPlus className="size-3.5" strokeWidth={1.8} />
            SAVE
          </span>
          <span className="font-mono text-[10px] text-apex-muted">
            to your Collector
          </span>
        </button>
        <button
          type="button"
          onClick={onShare}
          className="panel-inset px-3 py-3 flex flex-col items-start gap-1 hover:bg-apex-surface-2 transition-colors text-left"
        >
          <span className="flex items-center gap-1.5 label-mono">
            <Link2 className="size-3.5" strokeWidth={1.8} />
            SHARE_LINK
          </span>
          <span className="font-mono text-[10px] text-apex-muted">
            URL-encoded · copy
          </span>
        </button>
      </div>
      <p className="label-mono !text-[9px] mt-2.5 text-apex-muted">
        Saves stay in this browser (localStorage). Share links round-trip
        through the URL — no server needed.
      </p>
    </div>
  );
}
