import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 800;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color("hsl(175, 80%, 50%)");
    const green = new THREE.Color("hsl(145, 70%, 50%)");
    for (let i = 0; i < count; i++) {
      const c = Math.random() > 0.5 ? cyan : green;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return col;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.1;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} vertexColors transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function FloatingGrid() {
  const ref = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const gridSize = 20;
    const divisions = 20;
    const step = gridSize / divisions;
    const half = gridSize / 2;
    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step;
      vertices.push(pos, 0, -half, pos, 0, half);
      vertices.push(-half, 0, pos, half, 0, pos);
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = -4 + Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="hsl(175, 80%, 30%)" transparent opacity={0.15} />
    </lineSegments>
  );
}

export default function ParticleScene() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <Particles />
        <FloatingGrid />
      </Canvas>
    </div>
  );
}
