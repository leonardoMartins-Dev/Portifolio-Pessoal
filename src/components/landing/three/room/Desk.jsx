import { RoundedBox } from '@react-three/drei';
import { clay } from '../materials.js';
import { DESK } from './layout.js';

const LEG_HEIGHT = DESK.y - DESK.top;
const LEGS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

/** Mesa branca de tampo grosso e arredondado, com pés de madeira levemente abertos. */
export function Desk() {
  return (
    <group position-z={DESK.z}>
      <RoundedBox
        args={[DESK.width, DESK.top, DESK.depth]}
        radius={0.2}
        smoothness={4}
        position-y={DESK.y - DESK.top / 2}
        material={clay('#f7f4ef', { roughness: 0.55 })}
        castShadow
        receiveShadow
      />
      {LEGS.map(([sx, sz]) => (
        <mesh
          key={`${sx}${sz}`}
          position={[sx * (DESK.width / 2 - 0.75), LEG_HEIGHT / 2, sz * (DESK.depth / 2 - 0.55)]}
          rotation={[sz * 0.05, 0, -sx * 0.05]}
          material={clay('#dcb68b', { roughness: 0.7 })}
          castShadow
        >
          <cylinderGeometry args={[0.22, 0.16, LEG_HEIGHT, 16]} />
        </mesh>
      ))}
    </group>
  );
}
