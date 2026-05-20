"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Lap } from "@/lib/data/types";

type Props = { lap: Lap };

/* Renders the lap as a 3D ribbon:
   - x / z from GPS
   - y (height) modulated by speed
   - vertex colors lerped by throttle (cool → hot)
   - a flat "ghost" copy on the ground for visual anchoring
   - small glowing orbs at brake events */
export function TrackRibbon({ lap }: Props) {
  const t = lap.telemetry;

  const built = useMemo(() => {
    /* Downsample to ~360 samples for clean curves + good perf */
    const stride = Math.max(1, Math.floor(t.distance.length / 360));
    const xs: number[] = [];
    const ys: number[] = [];
    const speeds: number[] = [];
    const throttles: number[] = [];
    const brakes: number[] = [];
    for (let i = 0; i < t.distance.length; i += stride) {
      xs.push(t.x[i] ?? 0);
      ys.push(t.y[i] ?? 0);
      speeds.push(t.speed[i] ?? 0);
      throttles.push(t.throttle[i] ?? 0);
      brakes.push(t.brake[i] ?? 0);
    }

    /* Normalise & centre */
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const span = Math.max(maxX - minX, maxY - minY);
    const scale = 24 / span; // fit roughly in a 24-unit cube
    const maxSpeed = Math.max(...speeds);

    const pts: THREE.Vector3[] = [];
    const groundPts: THREE.Vector3[] = [];
    for (let i = 0; i < xs.length; i++) {
      const px = (xs[i] - cx) * scale;
      const pz = (ys[i] - cy) * scale;
      const speedNorm = speeds[i] / maxSpeed;
      const elev = 0.4 + speedNorm * 4.5; // 0.4..4.9
      pts.push(new THREE.Vector3(px, elev, pz));
      groundPts.push(new THREE.Vector3(px, 0.01, pz));
    }

    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
    const groundCurve = new THREE.CatmullRomCurve3(
      groundPts,
      true,
      "catmullrom",
      0.5,
    );

    const TUBE_SEGMENTS = 720;
    const RADIAL = 10;
    const RADIUS = 0.12;

    const tubeGeo = new THREE.TubeGeometry(
      curve,
      TUBE_SEGMENTS,
      RADIUS,
      RADIAL,
      true,
    );
    const ghostGeo = new THREE.TubeGeometry(
      groundCurve,
      TUBE_SEGMENTS,
      0.05,
      6,
      true,
    );

    /* Per-vertex colour driven by throttle.
       The tube has (TUBE_SEGMENTS+1) * (RADIAL+1) vertices, laid out as rings. */
    const vertCount = tubeGeo.attributes.position.count;
    const colors = new Float32Array(vertCount * 3);
    /* Throttle ramp: cool cyan → warm orange → saturated amber.
       The previous peak was pure white, which bloom blew out into a halo
       that read as a stray "white line". Capping at amber keeps it readable. */
    const COOL = new THREE.Color("#4dc7ff");
    const WARM = new THREE.Color("#ff8a4a");
    const PEAK = new THREE.Color("#ffb070");
    const BRAKE = new THREE.Color("#ff1801");

    for (let ring = 0; ring <= TUBE_SEGMENTS; ring++) {
      const frac = ring / TUBE_SEGMENTS;
      const sample = Math.min(xs.length - 1, Math.floor(frac * xs.length));
      const thr = throttles[sample] / 100;
      const isBrake = brakes[sample] > 0;

      const col = new THREE.Color();
      if (isBrake) {
        col.copy(BRAKE);
      } else if (thr >= 0.5) {
        col.copy(WARM).lerp(PEAK, (thr - 0.5) * 2);
      } else {
        col.copy(COOL).lerp(WARM, thr * 2);
      }

      for (let r = 0; r <= RADIAL; r++) {
        const v = ring * (RADIAL + 1) + r;
        colors[v * 3] = col.r;
        colors[v * 3 + 1] = col.g;
        colors[v * 3 + 2] = col.b;
      }
    }
    tubeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    /* Brake orbs — pick a representative subset */
    const brakeOrbs: THREE.Vector3[] = [];
    {
      let last = -10;
      for (let i = 0; i < brakes.length; i++) {
        if (brakes[i] > 0 && i - last > 4) {
          brakeOrbs.push(pts[i]);
          last = i;
        }
      }
    }

    return {
      tubeGeo,
      ghostGeo,
      brakeOrbs,
      start: pts[0],
      maxSpeed,
    };
  }, [t.distance, t.x, t.y, t.speed, t.throttle, t.brake]);

  return (
    <group>
      {/* Ghost on ground */}
      <mesh geometry={built.ghostGeo}>
        <meshBasicMaterial
          color="#ff1801"
          transparent
          opacity={0.18}
          toneMapped={false}
        />
      </mesh>

      {/* Main elevated ribbon with vertex colours */}
      <mesh geometry={built.tubeGeo}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>

      {/* Brake-zone orbs */}
      {built.brakeOrbs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color="#ff1801" toneMapped={false} />
        </mesh>
      ))}

      {/* Start marker */}
      <mesh position={[built.start.x, built.start.y + 0.4, built.start.z]}>
        <coneGeometry args={[0.22, 0.6, 8]} />
        <meshBasicMaterial color="#00e8ff" toneMapped={false} />
      </mesh>
    </group>
  );
}
