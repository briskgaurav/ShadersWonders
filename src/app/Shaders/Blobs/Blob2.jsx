"use client";

import * as THREE from "three";
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import { useControls } from "leva";

// 4D Simplex noise (basic placeholder version)
const vertexShader = `
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
float permute(float x) {
  return floor(mod(((x * 34.0) + 1.0) * x, 289.0));
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}
float taylorInvSqrt(float r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p, s;
  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
  return p;
}

float simplexNoise4d(vec4 v) {
  const vec2 C = vec2(0.138196601125010504, 0.309016994374947451);
  vec4 i = floor(v + dot(v, C.yyyy));
  vec4 x0 = v - i + dot(i, C.xxxx);

  vec4 i0;

  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;

  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;

  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

  vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
  vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
  vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
  vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

  i = mod(i, 289.0);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute(permute(permute(permute(i.w + vec4(i1.w, i2.w, i3.w, 1.0)) + i.z + vec4(i1.z, i2.z, i3.z, 1.0)) + i.y + vec4(i1.y, i2.y, i3.y, 1.0)) + i.x + vec4(i1.x, i2.x, i3.x, 1.0));

  vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);

  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4, p4));

  vec3 m0 = max(0.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * (dot(m0 * m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))) + dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4))));
}

varying vec3 vNormal;
attribute vec3 tangent;

uniform float uTime;
uniform float uPositionFrequency;
uniform float uPositionStrength;
uniform float uTimeFrequency;

uniform float uSmallWavePositionFrequency;
uniform float uSmallWavePositionStrength;
uniform float uSmallWaveTimeFrequency;

float getBlob(vec3 position) {
    vec3 wrappedPosition = position;
    wrappedPosition += simplexNoise4d(vec4(position * uPositionFrequency, uTime * uTimeFrequency)) * uPositionStrength;

    return simplexNoise4d(vec4(wrappedPosition * uSmallWavePositionFrequency, uTime * uSmallWaveTimeFrequency)) * uSmallWavePositionStrength;
}

void main() {
  vec3 bitangent = cross(tangent, normal);
  float shift = 0.07;

  vec3 A = position + shift * tangent;
  vec3 B = position + shift * bitangent;

  float blob = getBlob(position);
  vec3 displaced = position + blob * normal;

  A += getBlob(A) * normal;
  B += getBlob(B) * normal;

  vec3 shadowA = normalize(A - displaced);
  vec3 shadowB = normalize(B - displaced);

  vNormal = -normalize(cross(shadowA, shadowB));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const fragmentShader = `
varying vec3 vNormal;

void main() {
  float intensity = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
  gl_FragColor = vec4(vec3(0.2, 0.7, 1.0) * intensity, 1.0);
}
`;

const BandBlobMaterial = shaderMaterial(
  {
    uTime: 0,
    uPositionFrequency: 1.0,
    uPositionStrength: 0.3,
    uTimeFrequency: 1.0,
    uSmallWavePositionFrequency: 3.0,
    uSmallWavePositionStrength: 0.1,
    uSmallWaveTimeFrequency: 1.0,
    uTexture: new THREE.TextureLoader().load('/Texture/tex.png'), // PNG texture
    uTextureScale: 1.0, // Scale for texture tiling
    uTextureIntensity: 0.5, // Blend intensity between texture and base color
  },
  
  vertexShader,
  fragmentShader,
);

extend({ BandBlobMaterial });

function BlobDark() {
  const materialRef = useRef();

  const {
    uPositionFrequency,
    uPositionStrength,
    uTimeFrequency,
    uSmallWavePositionFrequency,
    uSmallWavePositionStrength,
    uSmallWaveTimeFrequency,
  } = useControls("Blob Shader", {
    uPositionFrequency: { value: 1.0, min: 0, max: 10, step: 0.1 },
    uPositionStrength: { value: 0.3, min: 0, max: 2, step: 0.01 },
    uTimeFrequency: { value: 1.0, min: 0, max: 10, step: 0.1 },
    uSmallWavePositionFrequency: { value: 3.0, min: 0, max: 10, step: 0.1 },
    uSmallWavePositionStrength: { value: 0.1, min: 0, max: 1, step: 0.01 },
    uSmallWaveTimeFrequency: { value: 1.0, min: 0, max: 10, step: 0.1 },
  });

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime();
      materialRef.current.uPositionFrequency = uPositionFrequency;
      materialRef.current.uPositionStrength = uPositionStrength;
      materialRef.current.uTimeFrequency = uTimeFrequency;
      materialRef.current.uSmallWavePositionFrequency = uSmallWavePositionFrequency;
      materialRef.current.uSmallWavePositionStrength = uSmallWavePositionStrength;
      materialRef.current.uSmallWaveTimeFrequency = uSmallWaveTimeFrequency;
    }
  });

  const geometry = useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(1, 128);
    geom.computeVertexNormals();
    // geom.computeTangents();
    return geom;
  }, []);

  return (
    <mesh geometry={geometry}>
      <bandBlobMaterial  ref={materialRef} />
    </mesh>
  );
}

export default function Blob2() {
  return (
    <div className="h-screen w-full relative">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <color attach="background" args={["#FFFFFF"]} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <BlobDark />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
