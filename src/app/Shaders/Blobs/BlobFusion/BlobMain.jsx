import React, { Suspense, useState } from "react";
import Blob from "./Blob";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { Euler, Vector3 } from "three";
import Lights from "./Lights";
import { useControls } from "leva";

export default function BlobMain() {
  const [selectedTexture, setSelectedTexture] = useState(
    "/Texture/GRADIENT.png"
  );

  const materialControls = useControls("Material", {
    roughness: { value: 1.0, min: 0, max: 1 },
    metalness: { value: 0.23, min: 0, max: 1 },
    envMapIntensity: { value: 1.11, min: 0, max: 2 },
    clearcoat: { value: 0, min: 0, max: 1 },
    clearcoatRoughness: { value: 1, min: 0, max: 1 },
    transmission: { value: 0.0, min: 0, max: 1 },
    color: "#FFFFFF",
    distort: { value: 0, min: 0, max: 2 },
    frequency: { value: 2.09, min: 0, max: 5 },
    speed: { value: 1.0, min: 0, max: 2 },
    gooPoleAmount: { value: 1, min: 0, max: 2 },
    surfaceDistort: { value: 1.4, min: 0, max: 2 },
    surfaceFrequency: { value: 0.9, min: 0, max: 2 },
    numberOfWaves: { value: 8.13, min: 0, max: 20 },
    surfaceSpeed: { value: 1, min: 0, max: 2 },
    surfacePoleAmount: { value: 1, min: 0, max: 2 },
  });

  const geometryControls = useControls("Geometry", {
    scale: { value: 9.2, min: 1, max: 20 },
    rotateY: { value: 3.04, min: 0, max: Math.PI * 2 },
    rotateX: { value: 5.68, min: 0, max: Math.PI * 2 },
  });

  const geometry = {
    scale: geometryControls.scale,
    rotate: new Euler(geometryControls.rotateX, geometryControls.rotateY, 0),
  };

  const lightsControls = useControls("Lights", {
    light1Color: "#8000FF",
    light1Intensity: { value: 5, min: 0, max: 10 },
    light2Color: "#FFA900",
    light2Intensity: { value: 1.5, min: 0, max: 10 },
    light3Color: "#0E00FF",
    light3Intensity: { value: 0.82, min: 0, max: 10 },
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
  ];

  return (
    <div className="h-screen w-full relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {[
          { texture: "/Texture/GRADIENT.png", label: "Enigma" },
          { texture: "/Texture/GRADIENT2.png", label: "Enigma2" },
          { texture: "/Texture/GRADIENT3.png", label: "Enigma3" },
          { texture: "/Texture/GRADIENT4.png", label: "LightColor Enigma1" },
          { texture: "/Texture/cosmic-fusion.jpeg", label: "Circular" }, 
          { texture: "/Texture/floyd.jpeg", label: "Diamond" },
          { texture: "/Texture/halloween.jpeg", label: "Rectangular" },
          { texture: "/Texture/synthwave.jpeg", label: "Radial" },
          { texture: "/Texture/imaginarium.jpeg", label: "Ajooba" },
        ].map((item, index) => (
          <button
            key={index}
            className="px-4 py-2 cursor-pointer bg-blue-500 text-white rounded"
            onClick={() => setSelectedTexture(item.texture)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Canvas camera={{ position: [0, 0, 17], fov: 50 }}>
        <color attach="background" args={["#75BCC6"]} />
        <ambientLight intensity={0} />
        <Lights lights={lights} />
        <Suspense fallback={null}>
          <OrbitControls />
          <Blob
            material={materialControls}
            map={selectedTexture}
            geometry={geometry}
          />
        </Suspense>
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}
