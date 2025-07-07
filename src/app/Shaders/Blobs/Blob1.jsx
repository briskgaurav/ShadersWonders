"use client";

import * as THREE from "three";
import React, { useRef } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import { useControls } from "leva";

// Custom ShaderMaterial with band + noise distortion
const BandBlobMaterial = shaderMaterial(
  {
    uTime: 0,
    uAmplitude: 0.25,
    uFrequency: 12.0,
    uSpeed: 1.2,
    uEdgeNoise: 0.15,
    uColor1: new THREE.Color("#00ffff"),
    uColor2: new THREE.Color("#ff00ff"),
  },
  // Vertex Shader
  `
    precision highp float;

    uniform float uTime;
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform float uSpeed;
    uniform float uEdgeNoise;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vBand;

    vec4 permute(vec4 x) {
      return mod(((x*34.0)+1.0)*x, 289.0);
    }

    float snoise(vec4 v) {
      const vec4 C = vec4(
        0.138196601125011,
        0.276393202250021,
        0.414589803375032,
        -0.447213595499958
      );

      vec4 i = floor(v + dot(v, vec4(0.309016994374947)));
      vec4 x0 = v - i + dot(i, C.xxxx);

      vec4 i0;
      vec3 isX = step(x0.yzw, x0.xxx);
      vec3 isYZ = step(x0.zww, x0.yyz);
      i0.x = isX.x + isX.y + isX.z;
      i0.yzw = 1.0 - isX;

      vec4 i1 = min(i0, vec4(1.0));
      vec4 i2 = max(min(i0 - 1.0, vec4(1.0)), 0.0);
      vec4 i3 = max(min(i0 - 2.0, vec4(1.0)), 0.0);

      vec4 x1 = x0 - i1 + C.xxxx;
      vec4 x2 = x0 - i2 + C.yyyy;
      vec4 x3 = x0 - i3 + C.zzzz;
      vec4 x4 = x0 + C.wwww;

      i = mod(i, 289.0);
      vec4 j0 = permute(permute(permute(permute(
        i.w + vec4(0.0, i1.w, i2.w, i3.w)) + 
        i.z + vec4(0.0, i1.z, i2.z, i3.z)) + 
        i.y + vec4(0.0, i1.y, i2.y, i3.y)) + 
        i.x + vec4(0.0, i1.x, i2.x, i3.x));

      vec4 ip = vec4(1.0 / 289.0);
      vec4 p0 = fract(j0 * ip) * 2.0 - 1.0;
      vec4 p1 = fract(j0.yzwx * ip) * 2.0 - 1.0;
      vec4 p2 = fract(j0.zwxy * ip) * 2.0 - 1.0;
      vec4 p3 = fract(j0.wxyz * ip) * 2.0 - 1.0;
      vec4 p4 = fract(j0.xyzw * ip) * 2.0 - 1.0;

      vec4 norm = inversesqrt(
        p0 * p0 + p1 * p1 + p2 * p2 + p3 * p3 + p4 * p4
      );
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      p4 *= norm.x;

      vec4 w = max(0.6 - vec4(
        dot(x0, x0),
        dot(x1, x1),
        dot(x2, x2),
        dot(x3, x3)
      ), 0.0);

      vec4 w4 = max(0.6 - dot(x4, x4), 0.0);
      vec4 w4_2 = w4 * w4;

      return 49.0 * (
        dot(w * w * w * w, vec4(
          dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)
        )) + w4_2 * w4 * dot(p4, x4)
      );
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      vec3 pos = position;

      // Banded stripe distortion
      float band = sin(pos.y * uFrequency + uTime * uSpeed);
      pos += normal * band * uAmplitude;

      // Extra edge noise distortion
      float noise = snoise(vec4(pos * 1.5, uTime * 0.3));
      pos += normal * noise * uEdgeNoise;

      vBand = band;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision highp float;

    uniform vec3 uColor1;
    uniform vec3 uColor2;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vBand;

    void main() {
      float lighting = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
      float highlight = smoothstep(0.0, 1.0, vBand * 0.5 + 0.5);
      vec3 baseColor = mix(uColor1, uColor2, highlight);
      vec3 finalColor = mix(baseColor, vec3(1.0), lighting * 0.3);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ BandBlobMaterial });

function Blob() {
  const ref = useRef();

  const {
    amplitude,
    frequency,
    speed,
    edgeNoise,
    color1,
    color2,
  } = useControls("Blob Controls", {
    amplitude: { value: 0.25, min: 0.0, max: 1.0, step: 0.01 },
    frequency: { value: 12.0, min: 1.0, max: 30.0, step: 0.1 },
    speed: { value: 1.2, min: 0.0, max: 5.0, step: 0.01 },
    edgeNoise: { value: 0.15, min: 0.0, max: 0.4, step: 0.01 },
    color1: "#00ffff",
    color2: "#ff00ff",
  });

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.uTime = clock.getElapsedTime();
      ref.current.uAmplitude = amplitude;
      ref.current.uFrequency = frequency;
      ref.current.uSpeed = speed;
      ref.current.uEdgeNoise = edgeNoise;
      ref.current.uColor1 = new THREE.Color(color1);
      ref.current.uColor2 = new THREE.Color(color2);
    }
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1.3, 128]} />
      <bandBlobMaterial ref={ref} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Scene() {
  return (
    <div className="h-screen w-full relative">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <color attach="background" args={["#1f003f"]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={3} />
        <Blob />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
