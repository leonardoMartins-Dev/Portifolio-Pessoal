import { RoundedBox } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { clay } from '../materials.js';
import { keyboardTexture } from '../textures.js';
import { LAYOUT } from './layout.js';

const WHITE = clay('#efebe4', { roughness: 0.5 });

/** Teclado branco com as teclas desenhadas em cima e o mouse ao lado. */
export function Keyboard() {
  const keys = useMemo(() => keyboardTexture(), []);
  useEffect(() => () => keys.dispose(), [keys]);
  return (
    <>
      <group {...LAYOUT.keyboard}>
        <RoundedBox
          args={[3.5, 0.2, 1.15]}
          radius={0.08}
          smoothness={2}
          position-y={0.1}
          material={WHITE}
          castShadow
          receiveShadow
        />
        <mesh position-y={0.202} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[3.3, 1.0]} />
          <meshStandardMaterial map={keys} roughness={0.6} />
        </mesh>
      </group>
      <group {...LAYOUT.mouse}>
        <mesh position-y={0.12} scale={[0.36, 0.2, 0.56]} material={WHITE} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      </group>
    </>
  );
}

const PENCILS = [
  { color: '#7fb6e8', tilt: [0.16, 0, 0.12], x: -0.12 },
  { color: '#f2837c', tilt: [-0.1, 0, -0.16], x: 0.12 },
  { color: '#f4c84f', tilt: [0.05, 0, 0.02], x: 0.02 },
];

/** Porta-lápis com três lápis coloridos. */
export function PencilCup() {
  return (
    <group {...LAYOUT.pencils}>
      <mesh position-y={0.5} material={clay('#f1ece4')} castShadow>
        <cylinderGeometry args={[0.44, 0.4, 1.0, 22]} />
      </mesh>
      {PENCILS.map(({ color, tilt, x }) => (
        <group key={color} position={[x, 0.55, 0]} rotation={tilt}>
          <mesh position-y={0.55} material={clay(color)} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
          </mesh>
          <mesh position-y={1.25} material={clay('#f2d4b0')}>
            <coneGeometry args={[0.08, 0.2, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Caneca de café na cor de destaque do sistema. */
export function Mug({ color }) {
  return (
    <group {...LAYOUT.mug}>
      <mesh position-y={0.44} material={clay(color, { roughness: 0.4 })} castShadow>
        <cylinderGeometry args={[0.44, 0.4, 0.88, 22]} />
      </mesh>
      <mesh
        position-y={0.8}
        rotation-x={-Math.PI / 2}
        material={clay('#4a2c1e', { roughness: 0.3 })}
      >
        <circleGeometry args={[0.38, 22]} />
      </mesh>
      <mesh position={[0.45, 0.46, 0]} material={clay(color, { roughness: 0.4 })} castShadow>
        <torusGeometry args={[0.2, 0.07, 8, 16]} />
      </mesh>
    </group>
  );
}
