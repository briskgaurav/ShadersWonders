"use client"
import { useRef, useContext, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { animated, useSpring } from "@react-spring/three";
import MagicalMaterial from "./ShaderMatrial";
import { DoubleSide } from "three";

const AnimatedMagicalMaterial = animated(MagicalMaterial);

const Blob = ({ material, map, geometry }) => {
  const meshRef = useRef();
  const texture = useTexture("/Texture/tex.png");

  const { scale, rotate } = geometry;
  console.log(geometry)
  const AnimatedMaterial = useSpring({
    ...material,
    config: { tension: 60, friction: 20, precision: 0.00001 },
  });

  const meshSpring = useSpring({
    rotation: rotate,
    config: { tension: 50, friction: 14 },
  });
  return (
    <animated.mesh
      ref={meshRef}
      scale={scale}
      {...meshSpring}
      position={[0, 0, 0]}
      frustumCulled={false}
    >
      <planeGeometry args={[15,10, 1024, 1024]} />
      <AnimatedMagicalMaterial side={DoubleSide} map={texture} {...AnimatedMaterial} />
    </animated.mesh>
  );
};

export default Blob;
