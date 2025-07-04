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
  #define RM_FACTOR 0.9
  #define RM_ITERS 90

  varying vec2 vUv;
  uniform float iTime;
  uniform vec3 iResolution;

  uniform float speed;
  uniform float waveScale;
  uniform float waveHeight;
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform float blendIntensity;

  float plasma(vec3 r) {
    float wave = r.x + r.y + iTime * speed;
    return r.z - (sin(wave * waveScale) * waveHeight + 5.5);
  }

  float scene(vec3 r) {
    return plasma(r);
  }

  float raymarch(vec3 pos, vec3 dir) {
    float dist = 0.0;
    float dscene;
    for (int i = 0; i < RM_ITERS; i++) {
      dscene = scene(pos + dist * dir);
      if (abs(dscene) < 0.1) break;
      dist += RM_FACTOR * dscene;
    }
    return dist;
  }

  void main() {
    vec2 fragCoord = vUv * iResolution.xy;

    float c, s;
    float vfov = 3.14159 / 2.5;
    vec3 cam = vec3(0.0, 0.0, 30.0);

    vec2 uv = fragCoord / iResolution.xy - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    uv.y *= -1.0;

    vec3 dir = vec3(0.0, 0.0, -1.0);

    float xrot = vfov * length(uv);
    c = cos(xrot);
    s = sin(xrot);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;

    c = normalize(uv).x;
    s = normalize(uv).y;
    dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;

    c = cos(0.7);
    s = sin(0.7);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

    float dist = raymarch(cam, dir);
    vec3 pos = cam + dist * dir;

    vec3 col = mix(
      vec3(1.0),
      mix(colorA, colorB, pos.z / 40.0),
      blendIntensity / (dist / 20.0)
    );

    gl_FragColor = vec4(col, 1.0);
  }
`;

const PlasmaMaterial = shaderMaterial(
  {
    iTime: 0,
    iResolution: new THREE.Vector3(),

    speed: 10.0,
    waveScale: 0.3,
    waveHeight: 4.0,
    colorA: new THREE.Color("#ff8800"),
    colorB: new THREE.Color("#ff7101"),
    blendIntensity: 1.0,
  },
  vertexShader,
  fragmentShader
);

extend({ PlasmaMaterial });

const PlasmaPlane = () => {
  const ref = useRef();

  const {
    speed,
    waveScale,
    waveHeight,
    colorA,
    colorB,
    blendIntensity
  } = useControls("Plasma Shader", {
    speed: { value: 10, min: 0, max: 50, step: 0.1 },
    waveScale: { value: 0.3, min: 0.05, max: 1.0, step: 0.01 },
    waveHeight: { value: 4.0, min: 0.1, max: 10.0, step: 0.1 },
    colorA: "#ff8800",
    colorB: "#ff7101",
    blendIntensity: { value: 1.0, min: 0.1, max: 5.0, step: 0.1 },
  });

  useFrame(({ clock, size }) => {
    if (ref.current) {
      ref.current.iTime = clock.getElapsedTime();
      ref.current.iResolution.set(size.width, size.height, 1);

      ref.current.speed = speed;
      ref.current.waveScale = waveScale;
      ref.current.waveHeight = waveHeight;
      ref.current.colorA = new THREE.Color(colorA);
      ref.current.colorB = new THREE.Color(colorB);
      ref.current.blendIntensity = blendIntensity;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[5, 3]} />
      <plasmaMaterial ref={ref} />
    </mesh>
  );
};

const BlobWaves = () => {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: -1
    }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <PlasmaPlane />
      </Canvas>
    </div>
  );
};

export default BlobWaves;
