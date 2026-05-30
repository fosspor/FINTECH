"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import React, { Suspense, useEffect, useRef, Component, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import * as THREE from 'three';
import { useAvatarStore } from "@/state/useAvatarStore";

// -----------------------------------------------------------------
// Error Boundary to handle missing GLB files gracefully
// -----------------------------------------------------------------
class AvatarErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <group position={[0, -1, 0]}>
          <mesh castShadow receiveShadow position={[0, 1, 0]}>
            <capsuleGeometry args={[0.4, 1.2, 4, 16]} />
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </mesh>
        </group>
      );
    }
    return this.props.children;
  }
}

// -----------------------------------------------------------------
// Avatar Animation Controller & GLTF Loader
// -----------------------------------------------------------------
function AvatarAnimationController({ url }: { url: string | null }) {
  // If no URL is provided, don't attempt to load
  const { scene } = useGLTF(url || "/avatar/avatar.glb");
  const mood = useAvatarStore((state) => state.mood);
  
  const groupRef = useRef<THREE.Group>(null);
  const basePosition = useRef(new THREE.Vector3());

  // Center the model once loaded
  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      // Adjust center to stand on the floor
      basePosition.current.set(-center.x, -center.y - 0.8, -center.z);
      scene.position.copy(basePosition.current);
    }
  }, [scene]);

  // Procedural Animation System (Never modifies meshes, only transforms the group)
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const group = groupRef.current;

    // Reset rotation baseline
    group.rotation.set(0, 0, 0);

    switch (mood) {
      case "idle":
        // Slight breathing
        group.position.y = Math.sin(time * 2) * 0.02;
        group.rotation.y = Math.sin(time * 0.5) * 0.05;
        break;

      case "thinking":
        // Slower breathing, head/body tilted, looking around
        group.position.y = Math.sin(time * 1.5) * 0.01;
        group.rotation.z = 0.05;
        group.rotation.y = Math.sin(time * 0.8) * 0.15 + 0.1;
        break;

      case "happy":
        // Slight bounce
        group.position.y = Math.abs(Math.sin(time * 4)) * 0.05;
        group.rotation.y = Math.sin(time * 3) * 0.1;
        break;

      case "celebrate":
        // Big bounce / jumping, spinning slightly
        group.position.y = Math.abs(Math.sin(time * 6)) * 0.15;
        group.rotation.y = time * 1.5;
        break;

      case "sad":
        // Slumped posture
        group.position.y = Math.sin(time * 1) * 0.01 - 0.05;
        group.rotation.x = 0.15; // Looking down
        group.rotation.y = Math.sin(time * 0.5) * 0.02;
        break;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// -----------------------------------------------------------------
// Main Viewer Component
// -----------------------------------------------------------------
export function AvatarViewer() {
  const avatarUrl = useAvatarStore((state) => state.avatarUrl);

  if (!avatarUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm relative border border-dashed border-white/20 rounded-[32px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-sm font-medium">Waiting for avatar...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Suspense fallback={
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Loading Character...</p>
        </div>
      }>
        <Canvas camera={{ position: [0, 0.5, 3], fov: 45 }} shadows dpr={[1, 2]}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 5, 2]} intensity={1.5} castShadow shadow-mapSize={1024} />
          <directionalLight position={[-2, -2, 2]} intensity={0.5} />
          
          <Environment preset="studio" />
          
          <AvatarErrorBoundary>
            <AvatarAnimationController url={avatarUrl} />
          </AvatarErrorBoundary>
          
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2 + 0.1}
            minDistance={1.5}
            maxDistance={5}
          />
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={10} blur={2.5} />
        </Canvas>
      </Suspense>
    </div>
  );
}
