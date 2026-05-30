"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { create } from 'zustand';

// --------------------------------------------------------
// 1. ZUSTAND STATE (Центральное хранилище аватара)
// --------------------------------------------------------
interface AvatarState {
  face: string;
  eyes: string;
  mouth: string;
  hair: string;
  accessories: string;
  setPart: (category: keyof Omit<AvatarState, 'setPart'>, id: string) => void;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  face: "face_01",
  eyes: "eyes_01",
  mouth: "mouth_01",
  hair: "hair_01",
  accessories: "none",
  setPart: (category, id) => set((state) => ({ ...state, [category]: id })),
}));

// --------------------------------------------------------
// 2. ASSET REGISTRY (Модульные детали)
// --------------------------------------------------------
export const AssetRegistry = {
  face: ["face_01", "face_02", "face_03"],
  eyes: ["eyes_01", "eyes_02", "eyes_03", "eyes_04", "none"],
  mouth: ["mouth_01", "mouth_02", "mouth_03", "none"],
  hair: ["hair_01", "hair_02", "hair_03", "hair_04", "hair_05", "none"],
  accessories: ["acc_glasses", "acc_crown", "acc_cap", "none"]
};

// --------------------------------------------------------
// 3. MOCK SWAP SYSTEM (Пока нет реальных .glb)
// --------------------------------------------------------
// В продакшене вы замените этот компонент на:
// const { scene } = useGLTF(`/models/${category}/${id}.glb`); 
// return <primitive object={scene.clone()} />

const MockMesh = ({ category, id, isSilhouette }: { category: string, id: string, isSilhouette?: boolean }) => {
  const skinMaterial = new THREE.MeshStandardMaterial({ color: isSilhouette ? '#111118' : '#f1c27d', roughness: 0.4 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: isSilhouette ? '#111118' : '#2d3748', roughness: 0.8 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: isSilhouette ? '#111118' : '#7B61FF', roughness: 0.2 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: isSilhouette ? '#111118' : '#111', transparent: true, opacity: 0.8 });

  if (category === 'face') {
    return (
      <group>
        {/* Голова */}
        <mesh castShadow receiveShadow material={skinMaterial} position={[0, 0, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
        </mesh>
        {/* Шея и торс для композиции */}
        <mesh castShadow receiveShadow material={skinMaterial} position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.8, 32]} />
        </mesh>
        <mesh castShadow receiveShadow material={accentMaterial} position={[0, -2.5, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 2, 32]} />
        </mesh>
      </group>
    );
  }

  if (category === 'eyes' && id !== 'none') {
    return (
      <group position={[0, 0.1, 0.85]}>
        <mesh position={[-0.35, 0, 0]} material={darkMaterial}><sphereGeometry args={[0.12]} /></mesh>
        <mesh position={[0.35, 0, 0]} material={darkMaterial}><sphereGeometry args={[0.12]} /></mesh>
      </group>
    );
  }

  if (category === 'mouth' && id !== 'none') {
    return <mesh position={[0, -0.4, 0.9]} material={darkMaterial}><boxGeometry args={[0.4, 0.05, 0.1]} /></mesh>;
  }

  if (category === 'hair' && id !== 'none') {
    if (id === 'hair_01') return <mesh position={[0, 0.8, 0]} material={darkMaterial}><cylinderGeometry args={[1.05, 1.05, 0.6, 32]} /></mesh>;
    if (id === 'hair_02') return <mesh position={[0, 0.9, 0]} material={darkMaterial}><sphereGeometry args={[1.05, 32, 32, 0, Math.PI * 2, 0, Math.PI/2]} /></mesh>;
    if (id === 'hair_03') return <mesh position={[0, 1.0, 0]} material={accentMaterial}><boxGeometry args={[1.8, 0.5, 1.8]} /></mesh>;
    if (id === 'hair_04') return <mesh position={[0, 0.8, -0.2]} rotation={[0.2, 0, 0]} material={darkMaterial}><cylinderGeometry args={[1.1, 1.1, 0.8, 32]} /></mesh>;
    if (id === 'hair_05') return <mesh position={[0, 1.1, 0]} material={darkMaterial}><sphereGeometry args={[0.6, 32, 32]} /></mesh>;
  }

  if (category === 'accessories' && id !== 'none') {
    if (id === 'acc_glasses') {
      return (
        <group position={[0, 0.1, 1.0]}>
          <mesh position={[-0.35, 0, 0]} material={glassMaterial}><boxGeometry args={[0.4, 0.3, 0.05]} /></mesh>
          <mesh position={[0.35, 0, 0]} material={glassMaterial}><boxGeometry args={[0.4, 0.3, 0.05]} /></mesh>
          <mesh position={[0, 0, 0]} material={darkMaterial}><boxGeometry args={[0.2, 0.05, 0.05]} /></mesh>
        </group>
      );
    }
    if (id === 'acc_crown') return <mesh position={[0, 1.2, 0]} material={new THREE.MeshStandardMaterial({ color: isSilhouette ? '#111118' : 'gold' })}><coneGeometry args={[0.6, 0.8, 6]} /></mesh>;
    if (id === 'acc_cap') return <mesh position={[0, 1.0, 0.2]} rotation={[-0.1, 0, 0]} material={accentMaterial}><cylinderGeometry args={[1.02, 1.02, 0.4, 32]} /></mesh>;
  }

  return null;
}

// --------------------------------------------------------
// 4. AVATAR MODEL (Сборка)
// --------------------------------------------------------
const AvatarModel = ({ isSilhouette }: { isSilhouette?: boolean }) => {
  const { face, eyes, mouth, hair, accessories } = useAvatarStore();
  const groupRef = useRef<THREE.Group>(null);

  // Дыхательная анимация
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <MockMesh category="face" id={face} isSilhouette={isSilhouette} />
      <MockMesh category="eyes" id={eyes} isSilhouette={isSilhouette} />
      <MockMesh category="mouth" id={mouth} isSilhouette={isSilhouette} />
      <MockMesh category="hair" id={hair} isSilhouette={isSilhouette} />
      <MockMesh category="accessories" id={accessories} isSilhouette={isSilhouette} />
    </group>
  );
}

// --------------------------------------------------------
// 5. CANVAS WRAPPER
// --------------------------------------------------------
export function HeroAvatar3D({ isSilhouette }: { isSilhouette?: boolean }) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} shadows dpr={[1, 2]} className="outline-none">
        <ambientLight intensity={isSilhouette ? 0.2 : 0.6} />
        <directionalLight position={[2, 5, 2]} intensity={isSilhouette ? 0.5 : 1.5} castShadow shadow-mapSize={1024} />
        {/* Заполняющий свет снизу чтобы убрать жесткие тени */}
        <directionalLight position={[-2, -2, 2]} intensity={0.5} />
        
        {!isSilhouette && <Environment preset="city" />}
        
        <Suspense fallback={null}>
          <AvatarModel isSilhouette={isSilhouette} />
        </Suspense>
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={false} 
          minPolarAngle={Math.PI/3} 
          maxPolarAngle={Math.PI/2 + 0.1}
          minAzimuthAngle={-Math.PI/4}
          maxAzimuthAngle={Math.PI/4}
        />
        <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2.5} />
      </Canvas>
    </div>
  );
}
