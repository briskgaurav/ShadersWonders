"use client";

import * as THREE from "three";
import React, { useRef } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useControls } from "leva";

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader
const fragmentShader = `
  #define iterations 1
  varying vec2 vUv;
  uniform float iTime;
  uniform vec3 iResolution;
  uniform float speed;
  uniform float blend;
  uniform float freqY;
  uniform float freqX;
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform vec3 bgColor;

  void main() {
    vec2 fragCoord = vUv * iResolution.xy;
    vec2 uv = fragCoord.xy / iResolution.xy;

    float res = 1.0;
    for (int i = 0; i < iterations; i++) {
      res += cos(uv.y * freqY - iTime * speed + cos(res * 12.234) * 0.1 + cos(uv.x * 32.2345 + cos(uv.y * 17.234)))
           + cos(uv.x * freqX);
    }

    vec3 c = mix(
      colorA,
      colorB,
      cos(res + cos(uv.y * 24.3214) * 0.1 + cos(uv.x * 6.324 + iTime * speed) + iTime) * 0.5 + 0.5
    );

    c = mix(
      c,
      bgColor,
      clamp((length(uv - 0.5 + cos(iTime + uv.yx * 4.34 + uv.xy * res) * 0.1) * 2.0 - 0.0), 0.0, 1.0)
    );

    gl_FragColor = vec4(c, blend);
  }
`;

const EthanMaterial = shaderMaterial(
  {
    iTime: 0,
    iResolution: new THREE.Vector3(),
    speed: 2.0,
    blend: 1.0,
    freqY: 12.345,
    freqX: 12.345,
    colorA: new THREE.Color(1.0, 0.533, 0.0), // #FF8800
    colorB: new THREE.Color(1.0, 0.443, 0.004), // #FF7101
    bgColor: new THREE.Color(1.0, 1.0, 1.0), // white
  },
  vertexShader,
  fragmentShader
);

extend({ EthanMaterial });

const EthanPlane = () => {
  const ref = useRef();

  const { speed, blend, freqY, freqX, colorA, colorB, bgColor } = useControls("Ethan Shader", {
    speed: { value: 2.0, min: 0.1, max: 10.0, step: 0.1 },
    blend: { value: 1.0, min: 0.0, max: 2.0, step: 0.01 },
    freqY: { value: 12.345, min: 1.0, max: 30.0, step: 0.1 },
    freqX: { value: 12.345, min: 1.0, max: 30.0, step: 0.1 },
    colorA: { value: "#ff8800" },
    colorB: { value: "#ff7101" },
    bgColor: { value: "#ffffff" },
  });

  useFrame(({ clock, size }) => {
    if (ref.current) {
      ref.current.iTime = clock.getElapsedTime();
      ref.current.iResolution.set(size.width, size.height, 1);
      ref.current.speed = speed;
      ref.current.blend = blend;
      ref.current.freqY = freqY;
      ref.current.freqX = freqX;
      ref.current.colorA = new THREE.Color(colorA);
      ref.current.colorB = new THREE.Color(colorB);
      ref.current.bgColor = new THREE.Color(bgColor);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[3.5, 2]} />
      <ethanMaterial ref={ref} />
    </mesh>
  );
};

const GradientPlasma = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -1,
        width: "100vw",
        height: "100vh",
      }}
    >
      <Canvas camera={{ position: [0, 0, 1] }}>
        <EthanPlane />
      </Canvas>
    </div>
  );
};

export default GradientPlasma;
