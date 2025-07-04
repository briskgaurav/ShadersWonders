"use client";

import * as THREE from "three";
import React, { useRef } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useControls } from "leva";

// Custom ShaderMaterial
const AuroraMaterial = shaderMaterial(
  {
    iTime: 0,
    iResolution: new THREE.Vector3(),
    iMouse: new THREE.Vector2(),
    starSpeed: 0.002,
    starLayers: 2.0,
    starDensity: 0.8,
    auroraSpeed: 0.2,
    auroraIntensity: 0.6,
    color1: new THREE.Color(1.0, 0.5, 0.0),
    color2: new THREE.Color(1.0, 0.6, 0.0),
    bgColor: new THREE.Color(1.0, 1.0, 1.0)
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
  uniform vec2 iMouse;
  uniform float starSpeed;
  uniform float starLayers;
  uniform float starDensity;
  uniform float auroraSpeed;
  uniform float auroraIntensity;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 bgColor;
  varying vec2 vUv;

  #define TAU 6.28318530718

  mat2 Rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }

  float Star(vec2 uv, float flare) {
    float d = length(uv);
    float m = 0.05 / d;

    float rays = max(0., 1. - abs(uv.x * uv.y * 1000.));
    m += rays * flare;
    uv *= Rot(3.1415 / 9.);
    rays = max(0., 1. - abs(uv.x * uv.y * 1000.));
    m += rays * flare / d;
    m *= smoothstep(0.1, 0.0, d);
    return m;
  }

  float Hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec3 StarLayer(vec2 uv) {
    vec3 col = vec3(0.0);
    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 offs = vec2(float(x), float(y));
        float n = Hash21(id + offs);
        if (n < starDensity) continue;
        float size = fract(n * 345.32) * 0.4;
        float star = Star(gv - offs - vec2(n, fract(n * 34.0)) + 0.5,
                          smoothstep(0.9, 1.0, size) * 0.6);
        vec3 color = sin(vec3(0.2, 0.3, 0.9) * fract(n * 2345.2) * 123.2) * 0.5 + 0.5;
        color = color * vec3(1.0, 0.5, 0.0) + vec3(0.2, 0.1, 0.0) * 2.0;
        star *= sin(iTime / 4.0 * (1.0 + n) * 3.0 + n * TAU) * 0.1 + 0.1;
        col += star * size * color;
      }
    }
    return col;
  }

  vec2 hash22(vec2 p) {
    p = p * mat2(129.1, 311.7, 269.5, 183.3);
    p = -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    return sin(p * TAU + iTime * 0.1);
  }

  float perlinNoise(vec2 p) {
    vec2 pi = floor(p);
    vec2 pf = p - pi;
    vec2 w = pf * pf * (3.0 - 2.0 * pf);
    float f00 = dot(hash22(pi + vec2(0.0, 0.0)), pf - vec2(0.0, 0.0));
    float f01 = dot(hash22(pi + vec2(0.0, 1.0)), pf - vec2(0.0, 1.0));
    float f10 = dot(hash22(pi + vec2(1.0, 0.0)), pf - vec2(1.0, 0.0));
    float f11 = dot(hash22(pi + vec2(1.0, 1.0)), pf - vec2(1.0, 1.0));
    float xm1 = mix(f00, f10, w.x);
    float xm2 = mix(f01, f11, w.x);
    return mix(xm1, xm2, w.y);
  }

  void main() {
    vec2 fragCoord = vUv * iResolution.xy;
    vec2 uv1 = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec2 M = (iMouse - iResolution.xy * 0.5) / iResolution.y;

    float t = iTime * starSpeed;
    uv1 += M * 4.0;
    uv1 *= Rot(t);

    vec3 col1 = vec3(0.0);
    for (float i = 0.0; i < 1.0; i += 1.0 / starLayers) {
      float depth = fract(i + t);
      float scale = mix(20.0, 0.5, depth);
      float fade = depth * smoothstep(1.0, 0.9, depth);
      col1 += StarLayer(uv1 * scale + i * 453.2 - M) * fade;
    }
    col1 = pow(col1, vec3(0.4545));

    vec2 uv = fragCoord / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;
    uv.y *= auroraIntensity;

    float n = 0.0;
    n += 0.5 * perlinNoise(uv * 1.0 - iTime * auroraSpeed);
    n += 0.25 * perlinNoise(uv * 2.0 - iTime * auroraSpeed * 1.5);
    n += 0.125 * perlinNoise(uv * 4.0 - iTime * auroraSpeed * 2.5);
    n += 0.0625 * perlinNoise(uv * 8.0 - iTime * auroraSpeed * 4.0);

    float intensity = smoothstep(0.1, 0.9, uv.y);
    intensity *= sin(uv.y * 10.0 + n * 5.0 - 0.5) * 0.5 + 0.5;

    vec3 color = mix(color1, color2, uv.x);
    color *= intensity;

    color = mix(bgColor, color + col1, intensity);

    gl_FragColor = vec4(color, 1.0);
  }
  `
);

extend({ AuroraMaterial });

function FullscreenAuroraPlane() {
  const ref = useRef();
  const { size } = useThree();

  const {
    starSpeed,
    starLayers,
    starDensity,
    auroraSpeed,
    auroraIntensity,
    color1,
    color2,
    bgColor
  } = useControls("Aurora Shader", {
    starSpeed: { value: 0.01, min: 0.0001, max: 0.01, step: 0.0001 },
    starLayers: { value: 3.9, min: 1, max: 5, step: 0.1 },
    starDensity: { value: 6.0, min: 0.1, max: 0.95, step: 0.01 },
    auroraSpeed: { value: .39, min: 0.01, max: 1.0, step: 0.01 },
    auroraIntensity: { value: 1.0, min: 0.1, max: 1.0, step: 0.01 },
    color1: "#ff8000",
    color2: "#ff9900",
    bgColor: "#ffffff"
  });

  useFrame(({ clock, mouse }) => {
    if (ref.current) {
      ref.current.iTime = clock.getElapsedTime();
      ref.current.iResolution.set(size.width, size.height, 1);
      ref.current.iMouse.set(mouse.x, mouse.y);
      ref.current.starSpeed = starSpeed;
      ref.current.starLayers = starLayers;
      ref.current.starDensity = starDensity;
      ref.current.auroraSpeed = auroraSpeed;
      ref.current.auroraIntensity = auroraIntensity;
      ref.current.color1 = new THREE.Color(color1);
      ref.current.color2 = new THREE.Color(color2);
      ref.current.bgColor = new THREE.Color(bgColor);
    }
  });

  return (
    <mesh scale={[1, 1, 1]}>
      <planeGeometry args={[2000, 1000]} />
      <auroraMaterial ref={ref} />
    </mesh>
  );
}

export default function AuroraStarsShader() {
  return (
    <div className="h-screen w-full relative">
      <Canvas className="w-full h-full" orthographic camera={{ position: [0, 0, 5], zoom: 1 }}>
        <FullscreenAuroraPlane />
      </Canvas>
    </div>
  );
}
