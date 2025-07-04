"use client";

import * as THREE from "three";
import React, { useRef } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useControls } from "leva";

// Custom ShaderMaterial with uniforms
const WaveformMaterial = shaderMaterial(
  {
    iTime: 0,
    iResolution: new THREE.Vector3(),
    zoom: .5,
    bandCount: 90.0,
    waveDetail: 30.0,
    tanhStrength: 900.0,
    intensityScale: 1.0,
    colorA: new THREE.Color(1.0, 0.2, 0.2),
    colorB: new THREE.Color(1.0, 0.5, 0.0),
    bgColor: new THREE.Color(1.0, 1.0, 1.0),
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

  uniform float iTime;
  uniform vec3 iResolution;
  uniform float zoom;
  uniform float bandCount;
  uniform float waveDetail;
  uniform float tanhStrength;
  uniform float intensityScale;

  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform vec3 bgColor;

  varying vec2 vUv;

  void main() {
    vec2 I = (vUv + 0.5) * iResolution.xy * zoom;

    vec4 O = vec4(0.0);
    float i = 0.0, d = 1.0, z = 0.0, r;

    for (O *= i; i++ < bandCount; O += intensityScale * (cos(z * 0.5 + iTime + vec4(0.0, 2.0, 4.0, 3.0)) + 1.3) / d / z) {
      vec3 p = z * normalize(vec3(I + I, 0.0) - iResolution.xyy);
      r = max(-++p.y, 0.0);
      p.y += r + r;

      for (d = 1.0; d < waveDetail; d += d) {
        p.y += cos(p * d + 2.0 * iTime * cos(d) + z).x / d;
      }

      z += d = (0.1 * r + abs(p.y - 1.0) / (1.0 + r + r + r * r) + max(d = p.z + 3.0, -d * 0.1)) / 8.0;
    }

    O = tanh(O / tanhStrength);

    float brightness = dot(O.rgb, vec3(0.299, 0.587, 0.114));
    vec3 baseGray = vec3(brightness);

    vec3 gradientColor = mix(colorA, colorB, vUv.y);
    vec3 fg = baseGray * gradientColor;

    gl_FragColor = vec4(mix(bgColor, fg, O.a), 1.0);
  }
  `
);

extend({ WaveformMaterial });

function FullscreenWaveformPlane() {
  const ref = useRef();
  const { size } = useThree();

  const controls = useControls("Shader", {
    bandCount: { value: 90, min: 10, max: 200, step: 1 },
    waveDetail: { value: 30, min: 1, max: 100, step: 1 },
    tanhStrength: { value: 900, min: 10, max: 2000, step: 10 },
    intensityScale: { value: 1.0, min: 0.1, max: 10, step: 0.1 },
    colorA: "#ff3333",
    colorB: "#ff8800",
    bgColor: "#ffffff",
  });

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.iTime = clock.getElapsedTime();
      ref.current.iResolution.set(size.width, size.height, 1);
      Object.entries(controls).forEach(([key, val]) => {
        if (ref.current[key]?.set) {
          ref.current[key].set(val);
        } else {
          ref.current[key] = val;
        }
      });
    }
  });

  return (
    <mesh>
      <planeGeometry args={[20, 8]} />
      <waveformMaterial ref={ref} />
    </mesh>
  );
}

export default function WaveformShader() {
  return (
    <div className="h-screen w-full relative">
      <Canvas className="w-full h-full">
        <FullscreenWaveformPlane />
      </Canvas>
    </div>
  );
}