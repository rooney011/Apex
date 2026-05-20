"use client";

import {
  OrbitControls,
  Stars,
  Environment,
  Float,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import { useReducedMotion } from "framer-motion";
import { BlendFunction } from "postprocessing";
import { Suspense } from "react";
import { Vector2 } from "three";
import type { Lap } from "@/lib/data/types";
import { CarModel } from "./car-model";

type Props = { lap: Lap };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HeroScene({ lap: _lap }: Props) {
  const reduced = useReducedMotion();
  return (
    <Canvas
      camera={{ position: [12, 7, 12], fov: 38, near: 0.1, far: 220 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
      style={{ background: "#06060a" }}
    >
      <color attach="background" args={["#06060a"]} />
      <fog attach="fog" args={["#06060a", 30, 90]} />

      {/* Lighting — bloom does most of the heavy lifting, but a soft ambient
          + hemisphere keeps geometry from going pitch-black at the camera back. */}
      <ambientLight intensity={0.25} />
      <hemisphereLight args={["#ff5840", "#0a0a14", 0.35]} />
      <pointLight position={[0, 18, 0]} intensity={1.4} color="#ff8a4a" />
      <pointLight position={[-20, 8, -20]} intensity={0.6} color="#4dc7ff" />

      {/* Ground reference */}
      <gridHelper
        args={[80, 40, "#1a1a22", "#13131a"]}
        position={[0, -0.2, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial color="#05050a" />
      </mesh>

      {/* Distant stars for depth */}
      <Stars
        radius={120}
        depth={50}
        count={2200}
        factor={3}
        saturation={0}
        fade
        speed={0.2}
      />

      {/* The F1 car IS the hero — front and centre, slowly spinning,
         gently bobbing. No track ribbon now; the model carries the scene. */}
      <Suspense fallback={null}>
        <Float
          speed={reduced ? 0 : 1.1}
          rotationIntensity={reduced ? 0 : 0.06}
          floatIntensity={reduced ? 0 : 0.6}
          floatingRange={[0, reduced ? 0 : 0.45]}
        >
          <CarModel
            position={[0, 2.6, 0]}
            fitSize={11}
            spin={reduced ? 0 : 0.05}
          />
        </Float>
      </Suspense>

      {/* HDRI for IBL reflections on the car body — not used as background */}
      <Suspense fallback={null}>
        <Environment files="/models/studio_red.hdr" background={false} />
      </Suspense>

      {/* Auto-orbiting camera; click-drag overrides momentarily. */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        autoRotate={!reduced}
        autoRotateSpeed={0.45}
        minDistance={9}
        maxDistance={32}
        minPolarAngle={Math.PI / 7}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 2.6, 0]}
      />

      {/* Postprocessing — the look comes from here */}
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={1.6}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <ChromaticAberration
          offset={new Vector2(0.0009, 0.0009)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
