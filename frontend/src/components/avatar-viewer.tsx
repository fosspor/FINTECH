"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import * as THREE from 'three';

interface AvatarViewerProps {
  url: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  
  // Center and scale the model
  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      scene.position.x = -center.x;
      scene.position.y = -center.y - 0.5; // Offset slightly down
      scene.position.z = -center.z;
    }
  }, [scene]);

  return <primitive object={scene} />;
}

export function AvatarViewer({ url }: AvatarViewerProps) {
  return (
    <div className="w-full h-full relative">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }} shadows dpr={[1, 2]}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 5, 2]} intensity={1.5} castShadow shadow-mapSize={1024} />
          <directionalLight position={[-2, -2, 2]} intensity={0.5} />
          
          <Environment preset="studio" />
          
          <Model url={url} />
          
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2 + 0.2}
            minDistance={1.5}
            maxDistance={5}
          />
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={10} blur={2.5} />
        </Canvas>
      </Suspense>
    </div>
  );
}
