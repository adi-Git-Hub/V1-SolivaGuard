import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface BallProps {
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  size: number;
}

const Ball = ({ position, velocity, color, size }: BallProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useRef(new THREE.Vector3(...position));
  const vel = useRef(new THREE.Vector3(...velocity));
  
  // Physics parameters from requirements
  const friction = 0.995;
  const wallBounce = 0.95;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Movement
    pos.current.add(vel.current);
    
    // Friction
    vel.current.multiplyScalar(friction);

    // Boundary check (assuming a fixed box for simplicity, adjusted by viewport)
    const { width, height } = state.viewport;
    const margin = size;

    if (pos.current.x > width / 2 - margin) {
      pos.current.x = width / 2 - margin;
      vel.current.x *= -wallBounce;
    } else if (pos.current.x < -width / 2 + margin) {
      pos.current.x = -width / 2 + margin;
      vel.current.x *= -wallBounce;
    }

    if (pos.current.y > height / 2 - margin) {
      pos.current.y = height / 2 - margin;
      vel.current.y *= -wallBounce;
    } else if (pos.current.y < -height / 2 + margin) {
      pos.current.y = -height / 2 + margin;
      vel.current.y *= -wallBounce;
    }

    // Follow cursor logic
    const { x: mx, y: my } = state.pointer; // Pointer is in normalized coordinates (-1 to 1)
    const worldPointer = new THREE.Vector3(mx * (width / 2), my * (height / 2), 0);
    
    const dist = pos.current.distanceTo(worldPointer);
    if (dist < 2) {
      const force = new THREE.Vector3().subVectors(pos.current, worldPointer).normalize().multiplyScalar(0.005 * (2 - dist));
      vel.current.add(force);
    }

    // Keep it moving slightly if too slow
    if (vel.current.length() < 0.001) {
      vel.current.set((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0);
    }

    meshRef.current.position.copy(pos.current);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.2}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
};

interface BallpitProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
}

const BallpitScene = ({ count = 120, colors = ['#FF7A00', '#FF9A3C', '#FFC36A', '#FFE2B8'], minSize = 0.4, maxSize = 1.1 }: BallpitProps) => {
  const balls = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 0] as [number, number, number],
      velocity: [(Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, 0] as [number, number, number],
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * (maxSize - minSize) + minSize,
    }));
  }, [count, colors, minSize, maxSize]);

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -10, 5]} intensity={0.5} color="#FAF6F0" />
      {balls.map((props, i) => (
        <Ball key={i} {...props} />
      ))}
    </>
  );
};

const Ballpit: React.FC<BallpitProps> = (props) => {
  return (
    <div className="absolute inset-0 w-full h-full z-1 overflow-hidden pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 50 }}
        style={{ pointerEvents: 'auto' }}
        gl={{ antialias: true, alpha: true }}
      >
        <BallpitScene {...props} />
      </Canvas>
    </div>
  );
};

export default Ballpit;
