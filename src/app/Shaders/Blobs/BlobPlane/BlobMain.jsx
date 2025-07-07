import React, { Suspense } from "react";
import Blob from "./Blob";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Euler, Vector3 } from "three";
import Lights from "./Lights";
import { useControls } from "leva";

export default function BlobMain() {
  const materialControls = useControls('Material', {
    roughness: { value: 0.58, min: 0, max: 1 },
    metalness: { value: 1, min: 0, max: 1 },
    envMapIntensity: { value: 1.11, min: 0, max: 2 },
    clearcoat: { value: 0, min: 0, max: 1 },
    clearcoatRoughness: { value: 1, min: 0, max: 1 },
    transmission: { value: 0.0, min: 0, max: 1 },
    color: "#FFFFFF",
    distort: { value: 0, min: 0, max: 2 },
    frequency: { value: 1.09, min: 0, max: 5 },
    speed: { value: 1.0, min: 0, max: 2 },
    gooPoleAmount: { value: 1, min: 0, max: 2 },
    surfaceDistort: { value: 1.4, min: 0, max: 2 },
    surfaceFrequency: { value: 0.9, min: 0, max: 2 },
    numberOfWaves: { value: 8.13, min: 0, max: 20 },
    surfaceSpeed: { value: 1, min: 0, max: 2 },
    surfacePoleAmount: { value: 1, min: 0, max: 2 },
  });

  const geometryControls = useControls('Geometry', {
    scale: { value: 2, min: 1, max: 10 },
    rotateY: { value: 3.16, min: 0, max: Math.PI * 2 }
  });

  const geometry = {
    scale: geometryControls.scale,
    rotate: new Euler(0, geometryControls.rotateY, 0),
  };

  const lightsControls = useControls('Lights', {
    light1Color: "#8000FF",
    light1Intensity: { value: 5, min: 0, max: 10 },
    light2Color: "#FFA900", 
    light2Intensity: { value: 1.5, min: 0, max: 10 },
    light3Color: "#0E00FF",
    light3Intensity: { value: 0.82, min: 0, max: 10 }
  });

  const lights = [
    {
      position: new Vector3(4.13, 5, 0),
      intensity: lightsControls.light1Intensity,
      angle: 0.88,
      distance: 20,
      penumbra: 1,
      decay: 0,
      color: lightsControls.light1Color,
    },

    {
      position: new Vector3(-7.67, -7.67, -3.53),
      intensity: lightsControls.light2Intensity,
      angle: 1.57,
      distance: 20,
      penumbra: 1,
      decay: 0,
      color: lightsControls.light2Color,
    },

    {
      position: new Vector3(10, -6.73, -0.53),
      intensity: lightsControls.light3Intensity,
      angle: 1.57,
      distance: 20,
      penumbra: 1,
      decay: 0,
      color: lightsControls.light3Color,
    },
  ]

  const map = 6;

  return (
    <div className="h-screen w-full relative">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={["#75BCC6"]} />
        <ambientLight intensity={0} />
        <Lights lights={lights} />
        <Suspense fallback={null}>
          <Blob material={materialControls} map={map} geometry={geometry} />
        </Suspense>
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}
