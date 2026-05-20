import { ImageResponse } from "next/og";

export const alt = "APEX — Formula 1 Telemetry OS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Satori (next/og renderer) requires every <div> with >1 children to have an
   explicit display property. Every container below sets display: flex. */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,24,1,0.18), transparent 70%), #06060a",
          padding: 64,
          color: "#f4f4f6",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 4,
                color: "#8a8a96",
                textTransform: "uppercase",
              }}
            >
              FORMULA · 1 · TELEMETRY_OS
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 92,
                fontWeight: 900,
                color: "#ff1801",
                letterSpacing: -2,
                marginTop: 8,
              }}
            >
              APEX
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 16,
              letterSpacing: 3,
              color: "#8a8a96",
              textTransform: "uppercase",
              border: "1px solid #26262e",
              padding: "8px 14px",
              borderRadius: 6,
            }}
          >
            ACTIVE_FEED · HAMILTON · SILVERSTONE 2020
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1080 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: 18,
              fontSize: 86,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -3,
              color: "#f4f4f6",
            }}
          >
            <span>Every lap has a</span>
            <span style={{ color: "#ff1801", fontStyle: "italic", fontWeight: 700 }}>
              fingerprint.
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 22,
              color: "#bfbfc8",
              maxWidth: 1000,
              lineHeight: 1.4,
            }}
          >
            APEX takes raw F1 telemetry — GPS, throttle, brake, speed — and unfolds it as a 3D ribbon. Elevation by speed. Colour by throttle. Red flares at every brake point.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 16,
            letterSpacing: 3,
            color: "#8a8a96",
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>DATA · FASTF1 · OPENF1 · JOLPICA</div>
          <div style={{ display: "flex" }}>BUILD_2026.05 · APEX_OS_0.1</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
