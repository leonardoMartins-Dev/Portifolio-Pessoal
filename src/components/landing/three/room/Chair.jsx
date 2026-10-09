import { RoundedBox } from '@react-three/drei';
import { clay } from '../materials.js';
import { LAYOUT } from './layout.js';

const WHITE = clay('#f5f3ef', { roughness: 0.5 });
const METAL = clay('#9aa0aa', { roughness: 0.35, metalness: 0.4 });
const DARK = clay('#3f434c', { roughness: 0.5 });
const SEAT_Y = 1.9;
/** Altura do assento (topo da almofada). */
export const SEAT_TOP = SEAT_Y + 0.2;

/**
 * Cadeira de escritório: base de cinco pés com rodinhas e o assento giratório.
 * Quem senta vai em `children`, dentro do grupo que gira (`swivelRef`).
 */
export function Chair({ swivelRef, children }) {
  return (
    <group {...LAYOUT.chair}>
      {[0, 1, 2, 3, 4].map((index) => {
        const angle = (index / 5) * Math.PI * 2 + 0.3;
        return (
          <group key={index} rotation-y={angle}>
            <RoundedBox
              args={[0.36, 0.22, 1.75]}
              radius={0.1}
              smoothness={2}
              position={[0, 0.48, 0.85]}
              rotation-x={0.08}
              material={METAL}
              castShadow
            />
            <mesh position={[0, 0.2, 1.62]} material={DARK} castShadow>
              <sphereGeometry args={[0.22, 14, 10]} />
            </mesh>
          </group>
        );
      })}
      <mesh position-y={0.56} material={METAL}>
        <cylinderGeometry args={[0.38, 0.42, 0.34, 18]} />
      </mesh>
      <mesh position-y={1.15} material={METAL} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 1.2, 14]} />
      </mesh>

      <group ref={swivelRef}>
        <RoundedBox
          args={[2.7, 0.4, 2.55]}
          radius={0.19}
          smoothness={4}
          position-y={SEAT_Y}
          material={WHITE}
          castShadow
          receiveShadow
        />
        <RoundedBox
          args={[0.4, 1.4, 0.22]}
          radius={0.08}
          smoothness={2}
          position={[0, 2.55, -1.32]}
          material={METAL}
          castShadow
        />
        <RoundedBox
          args={[2.55, 2.5, 0.34]}
          radius={0.17}
          smoothness={4}
          position={[0, 3.75, -1.42]}
          rotation-x={-0.1}
          material={WHITE}
          castShadow
          receiveShadow
        />
        {children}
      </group>
    </group>
  );
}
