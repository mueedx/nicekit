"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { ThemeMode } from "@/lib/theme";

type EarthHorizonProps = {
  reducedMotion?: boolean;
  theme?: ThemeMode;
  active?: boolean;
};

function Earth({
  reducedMotion = false,
  active = true,
  theme = "dark",
}: EarthHorizonProps) {
  const group = useRef<Group>(null);
  const isLight = theme === "light";

  useFrame((_, delta) => {
    const mesh = group.current;
    if (!mesh || reducedMotion || !active) return;
    mesh.rotation.y += delta * 0.04;
  });

  return (
    <group
      ref={group}
      position={[4.6, -1.35, -1.2]}
      rotation={[0.18, -0.55, 0.08]}
      scale={3.35}
    >
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={isLight ? "#148185" : "#148185"}
          roughness={0.65}
          metalness={0.12}
          emissive={isLight ? "#0d5a5e" : "#0a4548"}
          emissiveIntensity={isLight ? 0.22 : 0.55}
        />
      </mesh>
      <mesh scale={1.022}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color={isLight ? "#1cb4ba" : "#1cb4ba"}
          transparent
          opacity={isLight ? 0.16 : 0.38}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function EarthHorizon({
  reducedMotion = false,
  theme = "dark",
  active = true,
}: EarthHorizonProps) {
  const isLight = theme === "light";
  const shouldAnimate = active && !reducedMotion;

  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 2]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      }}
      camera={{ position: [0, 0.15, 5.4], fov: 40 }}
      frameloop={shouldAnimate ? "always" : "demand"}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={isLight ? 0.55 : 0.48} />
      <directionalLight
        position={[3.5, 2.2, 4]}
        intensity={isLight ? 1.15 : 1.35}
        color={isLight ? "#fff7e8" : "#d6f4ff"}
      />
      <directionalLight
        position={[-2.5, -1.5, 1]}
        intensity={isLight ? 0.25 : 0.55}
        color={isLight ? "#89c4d8" : "#1cb4ba"}
      />
      <pointLight
        position={[2.2, 0.8, 3]}
        intensity={isLight ? 0.2 : 0.7}
        color="#1cb4ba"
      />
      <Earth reducedMotion={reducedMotion} active={active} theme={theme} />
    </Canvas>
  );
}
