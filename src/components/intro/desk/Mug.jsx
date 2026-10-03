import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Vector2 } from 'three';
import { LAYOUT } from './layout.js';
import { noiseTexture, puffTexture } from './textures.js';

// Perfil da caneca (raio, altura), girado em torno do eixo: parede com espessura.
const PROFILE = [
  [0, 0],
  [0.4, 0],
  [0.43, 0.05],
  [0.45, 0.92],
  [0.43, 0.96],
  [0.4, 0.93],
  [0.38, 0.1],
  [0, 0.1],
].map(([x, y]) => new Vector2(x, y));

const PUFFS = 6;
const RISE = 2.6; // segundos de vida de cada nuvem de vapor
const COASTER = { radius: 0.62, height: 0.035 };

/** Caneca de cerâmica sobre um porta-copo de cortiça, com vapor subindo. */
export function Mug({ reducedSteam = false }) {
  const puffRefs = useRef([]);
  const puff = useMemo(() => puffTexture(), []);
  const cork = useMemo(() => {
    const texture = noiseTexture({ seed: 13, size: 128, grain: 0.9 });
    texture.repeat.set(3, 3);
    return texture;
  }, []);
  useEffect(
    () => () => {
      puff.dispose();
      cork.dispose();
    },
    [puff, cork],
  );

  useFrame(({ clock, camera }) => {
    puffRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const t = ((clock.elapsedTime + (index * RISE) / PUFFS) % RISE) / RISE;
      mesh.position.set(
        Math.sin(t * 5 + index) * 0.12,
        COASTER.height + 1.0 + t * 1.6,
        Math.cos(t * 4 + index) * 0.06,
      );
      mesh.scale.setScalar(0.35 + t * 0.55);
      mesh.material.opacity = Math.sin(t * Math.PI) * 0.16;
      mesh.quaternion.copy(camera.quaternion);
    });
  });

  const ceramic = (
    <meshPhysicalMaterial
      color="#efebe4"
      roughness={0.28}
      clearcoat={0.7}
      clearcoatRoughness={0.1}
    />
  );

  return (
    <group {...LAYOUT.mug}>
      <mesh position-y={COASTER.height / 2} receiveShadow castShadow>
        <cylinderGeometry args={[COASTER.radius, COASTER.radius, COASTER.height, 40]} />
        <meshStandardMaterial color="#a77b4f" roughness={0.95} bumpMap={cork} bumpScale={1.2} />
      </mesh>
      <group position-y={COASTER.height}>
        <mesh castShadow receiveShadow>
          <latheGeometry args={[PROFILE, 48]} />
          {ceramic}
        </mesh>
        <mesh position={[0.47, 0.5, 0]} rotation-z={-Math.PI / 2} castShadow>
          <torusGeometry args={[0.24, 0.055, 14, 28, Math.PI]} />
          {ceramic}
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.8}>
          <circleGeometry args={[0.385, 40]} />
          <meshPhysicalMaterial color="#24130a" roughness={0.08} clearcoat={1} />
        </mesh>
      </group>
      {!reducedSteam &&
        Array.from({ length: PUFFS }, (_, index) => (
          <mesh
            key={index}
            ref={(mesh) => {
              puffRefs.current[index] = mesh;
            }}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={puff} transparent depthWrite={false} opacity={0} />
          </mesh>
        ))}
    </group>
  );
}
