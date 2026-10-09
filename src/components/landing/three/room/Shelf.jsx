import { RoundedBox } from '@react-three/drei';
import { clay } from '../materials.js';
import { LAYOUT } from './layout.js';

const DEPTH = 1.35;
const BOOKS = [
  { size: [0.46, 1.75, 1.05], color: '#9eb0cc', x: -1.55, tilt: 0 },
  { size: [0.52, 1.95, 1.1], color: '#f0a33d', x: -1.04, tilt: 0 },
  { size: [0.48, 1.8, 1.05], color: '#eee6d6', x: -0.55, tilt: 0 },
  { size: [0.44, 1.6, 1.0], color: '#f0a33d', x: -0.02, tilt: -0.32 },
];

/** Prateleira de madeira com livros e um cacto no vaso branco. */
export function Shelf() {
  return (
    <group
      position={[
        LAYOUT.shelf.position[0],
        LAYOUT.shelf.position[1],
        LAYOUT.shelf.position[2] + DEPTH / 2,
      ]}
    >
      <RoundedBox
        args={[4.8, 0.32, DEPTH]}
        radius={0.1}
        smoothness={3}
        material={clay('#e3c497', { roughness: 0.7 })}
        castShadow
        receiveShadow
      />
      {BOOKS.map(({ size, color, x, tilt }) => (
        <RoundedBox
          key={x}
          args={size}
          radius={0.07}
          smoothness={2}
          position={[x + (tilt ? 0.3 : 0), 0.16 + size[1] / 2 - (tilt ? 0.12 : 0), 0]}
          rotation-z={tilt}
          material={clay(color)}
          castShadow
          receiveShadow
        />
      ))}
      {/* Cacto */}
      <group position={[1.35, 0.16, 0.05]}>
        <mesh position-y={0.42} material={clay('#f7f4ee', { roughness: 0.4 })} castShadow>
          <cylinderGeometry args={[0.55, 0.45, 0.84, 22]} />
        </mesh>
        <mesh position-y={1.32} material={clay('#86c440')} castShadow>
          <capsuleGeometry args={[0.32, 0.8, 8, 16]} />
        </mesh>
        <mesh position={[0.36, 1.35, 0]} rotation-z={-0.5} material={clay('#86c440')} castShadow>
          <capsuleGeometry args={[0.15, 0.3, 6, 12]} />
        </mesh>
        <mesh position={[-0.33, 1.15, 0.05]} rotation-z={0.6} material={clay('#86c440')} castShadow>
          <capsuleGeometry args={[0.13, 0.22, 6, 12]} />
        </mesh>
      </group>
    </group>
  );
}
