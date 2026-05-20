"use client";

import { RotateCcw } from "lucide-react";
import {
  ASPECT_RATIOS,
  DEFAULT_PARAMS,
  PALETTES,
  PRESETS,
  type RenderParams,
} from "@/lib/canvas/params";
import { cn } from "@/lib/utils";

type Props = {
  params: RenderParams;
  setParams: (p: RenderParams) => void;
};

export function ParamPanel({ params, setParams }: Props) {
  const update = <K extends keyof RenderParams>(k: K, v: RenderParams[K]) =>
    setParams({ ...params, [k]: v });

  return (
    <div className="flex flex-col gap-4">
      {/* Presets */}
      <Section title="PRESETS">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setParams({ ...DEFAULT_PARAMS, ...p.params })}
              className="panel-inset px-3 py-2 text-left hover:bg-apex-surface-2 transition-colors"
            >
              <p className="label-mono text-apex-red">{p.label}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Palette */}
      <Section title="PALETTE">
        <div className="grid grid-cols-5 gap-1.5">
          {Object.values(PALETTES).map((p) => {
            const isActive = params.paletteId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => update("paletteId", p.id)}
                title={p.description}
                className={cn(
                  "relative aspect-square rounded border-2 overflow-hidden transition-all",
                  isActive
                    ? "border-apex-red ring-2 ring-apex-red/20"
                    : "border-apex-border hover:border-apex-muted",
                )}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${p.stops[0]} 0%, ${p.stops[1]} 50%, ${p.stops[2]} 100%)`,
                  }}
                />
                <span
                  className="absolute left-1 bottom-1 right-1 label-mono !text-[7px] text-white"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="label-mono !text-[9px] mt-2 text-apex-muted">
          {PALETTES[params.paletteId].description}
        </p>
      </Section>

      {/* Aspect */}
      <Section title="OUTPUT_ASPECT">
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(ASPECT_RATIOS).map(([id, r]) => {
            const isActive = params.aspect === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => update("aspect", id as RenderParams["aspect"])}
                className={cn(
                  "panel-inset px-3 py-2 text-left transition-colors",
                  isActive
                    ? "border-apex-red bg-apex-red/5 text-foreground"
                    : "hover:bg-apex-surface-2 text-apex-muted",
                )}
              >
                <p className="label-mono !text-[9px]">{r.label}</p>
                <p className="font-mono text-[10px] mt-0.5">
                  {r.w}×{r.h}
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Numeric controls */}
      <Section title="GEOMETRY">
        <Slider
          label="SEGMENTS"
          value={params.segments}
          min={80}
          max={400}
          step={10}
          onChange={(v) => update("segments", v)}
          render={(v) => v.toString()}
        />
        <Slider
          label="SMOOTHING"
          value={params.smoothing}
          min={1}
          max={21}
          step={2}
          onChange={(v) => update("smoothing", v)}
          render={(v) => `w=${v}`}
        />
        <Slider
          label="STROKE"
          value={params.strokeWidth}
          min={0.4}
          max={4}
          step={0.1}
          onChange={(v) => update("strokeWidth", v)}
          render={(v) => v.toFixed(1) + "px"}
        />
      </Section>

      <Section title="LIGHT">
        <Slider
          label="GLOW"
          value={params.glow}
          min={0}
          max={2}
          step={0.05}
          onChange={(v) => update("glow", v)}
          render={(v) => v.toFixed(2)}
        />
        <Slider
          label="BRAKE_OPACITY"
          value={params.brakeAlpha}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => update("brakeAlpha", v)}
          render={(v) => v.toFixed(2)}
        />
        <Slider
          label="BRAKE_SIZE"
          value={params.brakeSize}
          min={1}
          max={8}
          step={0.25}
          onChange={(v) => update("brakeSize", v)}
          render={(v) => v.toFixed(1) + "px"}
        />
      </Section>

      <Section title="ELEMENTS">
        <Toggle
          label="BRAKE_BURSTS"
          value={params.showBrakes}
          onChange={(v) => update("showBrakes", v)}
        />
        <Toggle
          label="START_PIP"
          value={params.showStart}
          onChange={(v) => update("showStart", v)}
        />
        <Toggle
          label="CAPTION"
          value={params.caption}
          onChange={(v) => update("caption", v)}
        />
      </Section>

      {/* Reset */}
      <button
        type="button"
        onClick={() => setParams(DEFAULT_PARAMS)}
        className="flex items-center justify-center gap-2 rounded border border-apex-border py-2.5 text-apex-muted hover:text-foreground hover:bg-apex-surface-2 transition-colors"
      >
        <RotateCcw className="size-3.5" strokeWidth={1.6} />
        <span className="label-mono">RESET_DEFAULTS</span>
      </button>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-4">
      <p className="label-mono text-apex-red mb-3">{title}</p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  render,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  render: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="label-mono">{label}</span>
        <span className="font-mono text-[10px] text-foreground tabular-nums">
          {render(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 appearance-none bg-apex-bg rounded-full cursor-pointer"
        style={{
          accentColor: "#ff1801",
        }}
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-1.5"
    >
      <span className="label-mono">{label}</span>
      <span
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors",
          value
            ? "bg-apex-red shadow-[inset_0_0_8px_rgba(255,255,255,0.35)]"
            : "bg-apex-bg border border-apex-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
            value ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
