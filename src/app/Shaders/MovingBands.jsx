"use client";
import * as THREE from "three";
import React, { useRef, useState } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useControls } from "leva";

// GLSL ShaderMaterial
const BandMaterial = shaderMaterial(
  {
    iTime: 0,
    iResolution: new THREE.Vector3(),

    bandsCount: 10,
    swirlCurveStrength: 1.5,
    moveSpeed: 0.1,

    colorStart: new THREE.Color(1.0, 0.533, 0.0), // orange
    colorEnd: new THREE.Color(1.0, 0.0, 0.0),     // red

    fadeTop: 0.4,
    fadeBottom: 0.6,
    fadeLeft: 0.2,
    fadeRight: 0.8,

    waveHeight: 0.1,
    waveFrequency: 2.0,
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
  varying vec2 vUv;
  uniform float iTime;
  uniform vec3 iResolution;

  uniform float bandsCount;
  uniform float swirlCurveStrength;
  uniform float moveSpeed;

  uniform vec3 colorStart;
  uniform vec3 colorEnd;

  uniform float fadeTop;
  uniform float fadeBottom;
  uniform float fadeLeft;
  uniform float fadeRight;

  uniform float waveHeight;
  uniform float waveFrequency;

  float rand(float x) {
    return fract(sin(x) * 43758.5453123);
  }

  float bandShape(float center, float width, float x) {
    float dist = abs(x - center);
    return smoothstep(width, 0.0, dist);
  }

  float verticalFade(float y) {
    float top = smoothstep(1.0, fadeTop, y);
    float bottom = smoothstep(0.0, fadeBottom, y);
    return top * bottom;
  }

  float horizontalFade(float x) {
    float left = smoothstep(0.0, fadeLeft, x);
    float right = smoothstep(1.0, fadeRight, x);
    return left * right;
  }

  void main() {
    float time = iTime * moveSpeed;
    float spacing = 1.0 / bandsCount;

    vec2 centeredUV = vUv - 0.5;
    float r = length(centeredUV);
    float angle = atan(centeredUV.y, centeredUV.x);
    angle += swirlCurveStrength * r;
    vec2 swirlUV = vec2(cos(angle), sin(angle)) * r + 0.5;

    vec2 shiftedUV = mod(swirlUV + vec2(1.0, -1.0) * time, 1.0);
    float x = shiftedUV.x;

    float bandIndex = floor(x * bandsCount);
    float center = bandIndex * spacing + spacing * 0.5;

    float phase = rand(bandIndex) * 6.2831;
    float amplitude = waveHeight * rand(bandIndex + 23.1);
    float frequency = waveFrequency + rand(bandIndex + 42.0) * waveFrequency;

    float curveOffset = sin(vUv.x * frequency + phase + time) * amplitude;
    float curvedY = clamp(vUv.y + curveOffset, 0.0, .2);

    float brightness = rand(bandIndex);
    float edgeBlur = spacing * 0.7;
    float shape = bandShape(center, edgeBlur, x);

    float fullFade = verticalFade(curvedY) * horizontalFade(vUv.x);
    float intensity = brightness * shape * fullFade;

    vec3 bandColor = mix(colorStart, colorEnd, curvedY);
    vec3 backgroundColor = vec3(1.0);

    gl_FragColor = vec4(mix(backgroundColor, bandColor, intensity), 1.0);
  }
  `
);

extend({ BandMaterial });

function BandEffect() {
  const ref = useRef();

  const controls = useControls({
    bandsCount: { value: 2, min: 1, max: 10, step: 1 },
    swirlCurveStrength: { value: 2.0, min: 0, max: 5, step: 0.1 },
    moveSpeed: { value: 0.15, min: 0, max: 1, step: 0.01 },
    colorStart: "#FF8800",
    colorEnd: "#FF7101",
    fadeTop: { value: 0.0, min: 0, max: 1, step: 0.01 },
    fadeBottom: { value: 0.0, min: 0, max: 1, step: 0.01 },
    fadeLeft: { value: 0.0, min: 0, max: 1, step: 0.01 },
    fadeRight: { value: 0.99, min: 0, max: 1, step: 0.01 },
  });

  useFrame(({ clock, size }) => {
    if (ref.current) {
      ref.current.iTime = clock.getElapsedTime();
      ref.current.iResolution.set(size.width, size.height, 1);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[20, 9, 100 , 100]} />
      <bandMaterial
        ref={ref}
        {...controls}
        colorStart={new THREE.Color(controls.colorStart)}
        colorEnd={new THREE.Color(controls.colorEnd)}
      />
    </mesh>
  );
}

export default function MovingBandsScene() {
  return (
    <div className="h-screen w-screen relative">
      <Canvas>
        <BandEffect />
      </Canvas>
    </div>
  );
}
