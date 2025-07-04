"use client";

import * as THREE from "three";
import React, { useRef } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

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
  varying vec2 vUv;
  uniform float iTime;
  uniform vec3 iResolution;

  float rand(int i) {
    return fract(sin(dot(vec2(float(i), 0.0), vec2(12.9898,78.233))) * 43758.5453);
  }

  vec4 alphaBlend(vec4 c1, vec4 c2) {
    return vec4(
      mix(c1.r, c2.r, c2.a),
      mix(c1.g, c2.g, c2.a),
      mix(c1.b, c2.b, c2.a),
      clamp(max(c1.a, c2.a) + c1.a * c2.a, 0.0, 1.0)
    );
  }

  void main() {
    const float thickness = 2.5;
    const int sinCount = 20;
    const int shadowCount = 20;

    const vec3 lineColor = vec3(1.0, 0.533, 0.0); // Orange (#FF8800)

    vec2 fragCoord = vUv * iResolution.xy;
    fragCoord -= iResolution.xy / 2.0;

    // 🔁 Project UV diagonally
    vec2 uv = (fragCoord.xy / iResolution.x) * 20.0;
    float diagCoord = dot(uv, normalize(vec2(1.0, 1.0))); // project diagonally
    uv = vec2(diagCoord, dot(uv, normalize(vec2(-1.0, 1.0)))); // rotate 45°

    uv = (uv + vec2(500.0, 0.0)) * vec2(1500.0, 76.0);

    float value = 0.0;
    float t = iTime / 150.0;
    const float mixInfl = 0.0009;
    const float startInfl = 15.0;

    for (int i = 0; i < sinCount; i++) {
      float rk = mix(rand(int(t) + i) * mixInfl, rand(int(t) + 1 + i) * mixInfl, fract(t));
      value += sin(uv.x * rk * 1.5) * rand(i + 1) * startInfl;
    }

    vec4 col = vec4(0.0);
    for (int i = -shadowCount; i <= shadowCount; i++) {
      float dist = abs(value - uv.y);
      float threshold = thickness * float(i) * 15.0;
      float alpha = 0.12 * smoothstep(threshold, threshold - 1.0, dist);
      col = alphaBlend(col, vec4(lineColor, alpha));
    }

    // 🔁 Add smooth fade near edges (vUv: 0 to 1)
    float edgeFade = smoothstep(0.0, 0.1, vUv.x) *
                     smoothstep(0.0, 0.1, vUv.y) *
                     smoothstep(0.0, 0.1, 1.0 - vUv.x) *
                     smoothstep(0.0, 0.1, 1.0 - vUv.y);

    col.a *= edgeFade;
    col.rgb *= edgeFade;

    gl_FragColor = col;
  }
`;


const SineLinesMaterial = shaderMaterial(
  { iTime: 0, iResolution: new THREE.Vector3() },
  vertexShader,
  fragmentShader
);

extend({ SineLinesMaterial });

const SineLinesMesh = () => {
  const materialRef = useRef();

  useFrame(({ clock, size }) => {
    if (materialRef.current) {
      materialRef.current.iTime = clock.getElapsedTime();
      materialRef.current.iResolution.set(size.width, size.height, 1);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[3.5, 2]} />
      <sineLinesMaterial ref={materialRef} />
    </mesh>
  );
};

const Histogram = () => {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <SineLinesMesh />
      </Canvas>
    </div>
  );
};

export default Histogram;
