"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* Preload as a module side-effect so the GLB starts downloading before the
   component itself renders. */
useGLTF.preload("/models/car.glb");

type Props = {
  position?: [number, number, number];
  /* Target longest-axis size in world units. The model is auto-fit to this. */
  fitSize?: number;
  /* Y-axis spin in revolutions per second. */
  spin?: number;
};

export function CarModel({
  position = [0, 5.5, 0],
  fitSize = 3.4,
  spin = 0.08,
}: Props) {
  const { scene } = useGLTF("/models/car.glb");

  /* Clone so we don't mutate the cached scene if rendered twice. */
  const cloned = useMemo(() => scene.clone(true), [scene]);

  /* Auto-fit + recolour: walk the cloned graph once, compute its bounds,
     normalise, and switch any over-bright PBR materials to something that
     plays nicely with our bloom pipeline. */
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;
    const k = fitSize / longest;
    cloned.scale.setScalar(k);
    cloned.position.set(-center.x * k, -box.min.y * k, -center.z * k);

    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      /* Many GLB exports ship with extremely high roughness or wrong tone
         mapping for our scene — keep originals but ensure tone-mapping isn't
         clipping the bloom highlights. */
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (!m) continue;
        const std = m as THREE.MeshStandardMaterial;
        std.envMapIntensity = 1.2;
      }
    });
  }, [cloned, fitSize]);

  const wrapper = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (wrapper.current) {
      wrapper.current.rotation.y += delta * spin * Math.PI * 2;
    }
  });

  return (
    <group ref={wrapper} position={position}>
      <primitive object={cloned} />
    </group>
  );
}
