import { useMemo } from 'react';
import { LatheGeometry, Vector2 } from 'three';
import { clay } from '../materials.js';
import { LAYOUT } from './layout.js';

// Folhas: [ângulo em volta do caule, inclinação a partir da vertical, comprimento, cor].
const LEAVES = [
  [0.0, 0.55, 3.3, '#78c23a'],
  [0.9, 0.85, 3.0, '#5daa2c'],
  [1.8, 0.6, 3.5, '#82cc43'],
  [2.7, 0.95, 2.8, '#62b031'],
  [3.6, 0.5, 3.4, '#78c23a'],
  [4.5, 0.9, 3.0, '#5daa2c'],
  [5.4, 0.7, 3.2, '#86cf48'],
  [0.45, 0.2, 3.6, '#6cb935'],
  [3.15, 0.25, 3.5, '#82cc43'],
];

/** Planta grande num vaso branco com faixa cinza, folhas largas e brilhantes. */
export function Plant() {
  const pot = useMemo(
    () =>
      new LatheGeometry(
        [
          [0, 0],
          [0.95, 0],
          [1.05, 0.1],
          [1.25, 2.0],
          [1.36, 2.1],
          [1.36, 2.32],
          [1.18, 2.32],
          [1.16, 2.15],
          [0, 2.15],
        ].map(([r, y]) => new Vector2(r, y)),
        32,
      ),
    [],
  );

  return (
    <group {...LAYOUT.plant}>
      <mesh
        geometry={pot}
        material={clay('#f6f3ee', { roughness: 0.4 })}
        castShadow
        receiveShadow
      />
      <mesh position-y={1.05} material={clay('#c4bbae', { roughness: 0.5 })}>
        <cylinderGeometry args={[1.17, 1.12, 0.55, 32, 1, true]} />
      </mesh>
      <mesh position-y={2.16} rotation-x={-Math.PI / 2} material={clay('#5b4535')}>
        <circleGeometry args={[1.17, 28]} />
      </mesh>
      {LEAVES.map(([angle, tilt, length, color]) => (
        <group key={angle} position-y={2.1} rotation={[0, angle, 0]}>
          <group rotation-x={tilt}>
            {/* Caule e a folha na ponta dele */}
            <mesh position-y={length * 0.3} material={clay('#5a9a2c')}>
              <cylinderGeometry args={[0.06, 0.08, length * 0.6, 6]} />
            </mesh>
            <mesh
              position-y={length * 0.68}
              rotation-x={0.35}
              scale={[0.62, length * 0.36, 0.1]}
              material={clay(color, { roughness: 0.35 })}
              castShadow
            >
              <sphereGeometry args={[1, 20, 14]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
