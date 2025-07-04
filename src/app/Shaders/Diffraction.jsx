"use client";

import * as THREE from "three";
import React, { useRef } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

// Custom Shader Material
const BlendedBandsMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector3(),
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  precision highp float;

  uniform float uTime;
  uniform vec3 uResolution;
  varying vec2 vUv;

  float wave(vec2 uv, float d, float o){
    return 1.0 - smoothstep(0.0, d, distance(uv.x, 0.5 + sin(o + uv.y * 3.0) * 0.3));
  }

  vec4 createBands(vec2 uv, float o) {
    float d = 0.05 + abs(sin(o * 0.2)) * 0.25 * distance(uv.y + 0.5, 0.0);
    float r = wave(uv + vec2(d * 0.25, 0.0), d, o);
    float g = wave(uv - vec2(0.015, 0.005), d, o);
    float b = wave(uv - vec2(d * 0.5, 0.015), d, o);
    return vec4(r, g, b, 1.0);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.y;

    vec4 baseColor = vec4(1.0); // white background
    vec4 wave1 = createBands(uv, uTime) * 0.6;
    vec4 wave2 = createBands(uv, uTime * 2.0) * 0.4;
    vec4 wave3 = createBands(uv + vec2(0.3, 0.0), uTime * 3.3) * 0.3;

    vec4 waveColor = wave1 + wave2 + wave3;

    // Blend waves over white background
    vec4 finalColor = mix(baseColor, waveColor,1.0);

    gl_FragColor = finalColor;
  }
  `
);

// Register as JSX element
extend({ BlendedBandsMaterial });

export const BlendedBands = () => {
  const shaderRef = useRef();

  useFrame(({ clock, size }) => {
    if (shaderRef.current) {
      shaderRef.current.uTime = clock.getElapsedTime();
      shaderRef.current.uResolution.set(size.width, size.height, 1);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[20, 10]} />
      <blendedBandsMaterial ref={shaderRef} />
    </mesh>
  );
};

export default function Diffraction() {
  return (
    <div className="h-screen w-full relative">
      <Canvas>
        <BlendedBands />
      </Canvas>
    </div>
  );
}
