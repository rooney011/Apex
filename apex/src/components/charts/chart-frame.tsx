"use client";

/* Shared SVG frame for all telemetry charts.
   - Pure presentational — the child draws into the plot area.
   - viewBox-driven, so it scales with its container.
   - Knows about: grid, top kicker, big value readout, x-axis distance ticks,
     scrub vertical line.
   - Charts that need gradients should put <defs> in their own children. */

export type ChartFrameProps = {
  width?: number;
  height?: number;
  margin?: { t: number; r: number; b: number; l: number };
  kicker: string;
  bigValue?: string;
  bigUnit?: string;
  yMax: number;
  yTicks?: number[];
  xMax: number;
  xTicks?: number[];
  scrubX?: number; // x position (px) of the scrub line, undefined to hide
  children?: React.ReactNode;
};

export function ChartFrame({
  width = 880,
  height = 260,
  margin = { t: 36, r: 24, b: 30, l: 48 },
  kicker,
  bigValue,
  bigUnit,
  yMax,
  yTicks,
  xMax,
  xTicks,
  scrubX,
  children,
}: ChartFrameProps) {
  const innerW = width - margin.l - margin.r;
  const innerH = height - margin.t - margin.b;

  const yTickValues = yTicks ?? defaultYTicks(yMax, 4);
  const xTickValues = xTicks ?? defaultXTicks(xMax, 6);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full h-full select-none"
      preserveAspectRatio="none"
    >

      {/* Kicker (mono label) */}
      <text
        x={margin.l}
        y={20}
        fill="#8a8a96"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        {kicker}
      </text>

      {/* Big readout */}
      {bigValue && (
        <text
          x={width - margin.r}
          y={22}
          textAnchor="end"
          fill="#f4f4f6"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {bigValue}
          {bigUnit && (
            <tspan
              dx={6}
              fill="#8a8a96"
              style={{ fontSize: 10, fontWeight: 400, letterSpacing: "0.18em" }}
            >
              {bigUnit}
            </tspan>
          )}
        </text>
      )}

      {/* Plot frame */}
      <g transform={`translate(${margin.l},${margin.t})`}>
        {/* horizontal gridlines */}
        {yTickValues.map((t, i) => {
          const py = innerH - (t / yMax) * innerH;
          return (
            <g key={`y-${i}`}>
              <line
                x1={0}
                x2={innerW}
                y1={py}
                y2={py}
                stroke="#1f1f27"
                strokeWidth={1}
                strokeDasharray={i === 0 ? "" : "2 4"}
              />
              <text
                x={-8}
                y={py + 3}
                textAnchor="end"
                fill="#8a8a96"
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                }}
              >
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        {/* x-axis ticks (distance) */}
        {xTickValues.map((t, i) => {
          const px = (t / xMax) * innerW;
          return (
            <g key={`x-${i}`}>
              <line
                x1={px}
                x2={px}
                y1={innerH}
                y2={innerH + 4}
                stroke="#26262e"
                strokeWidth={1}
              />
              <text
                x={px}
                y={innerH + 16}
                textAnchor="middle"
                fill="#8a8a96"
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                }}
              >
                {Math.round(t / 100) / 10}k
              </text>
            </g>
          );
        })}

        {/* Plot area for children to draw into */}
        <g>{children}</g>

        {/* Scrub line */}
        {scrubX != null && (
          <g pointerEvents="none">
            <line
              x1={scrubX}
              x2={scrubX}
              y1={0}
              y2={innerH}
              stroke="#ff1801"
              strokeOpacity={0.85}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={scrubX} cy={0} r={3.5} fill="#ff1801" />
            <circle cx={scrubX} cy={innerH} r={3.5} fill="#ff1801" />
          </g>
        )}

        {/* Bottom rule */}
        <line
          x1={0}
          x2={innerW}
          y1={innerH}
          y2={innerH}
          stroke="#26262e"
          strokeWidth={1}
        />
      </g>
    </svg>
  );
}

/* Reasonable tick generators. */
function defaultYTicks(max: number, count: number): number[] {
  const step = niceStep(max / count);
  const out: number[] = [];
  for (let v = 0; v <= max + step / 2; v += step) out.push(v);
  return out;
}

function defaultXTicks(max: number, count: number): number[] {
  const step = niceStep(max / count);
  const out: number[] = [];
  for (let v = 0; v <= max + step / 2; v += step) out.push(v);
  return out;
}

function niceStep(roughStep: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const rel = roughStep / pow;
  if (rel < 1.5) return 1 * pow;
  if (rel < 3) return 2 * pow;
  if (rel < 7) return 5 * pow;
  return 10 * pow;
}
