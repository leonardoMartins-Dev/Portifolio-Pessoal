import { RoundedBox } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { clay } from '../materials.js';
import { noteTexture } from '../textures.js';
import { LAYOUT } from './layout.js';

const FRAME = [7.4, 4.6, 0.3];
const PIN = clay('#ec5f5f', { roughness: 0.35 });

/** Bilhete com um alfinete vermelho. */
function Note({ texture, position, rotation, size }) {
  return (
    <group position={position} rotation-z={rotation}>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial map={texture} roughness={0.85} />
      </mesh>
      <group position={[0, size / 2 - 0.12, 0.05]}>
        <mesh position-z={0.16} material={PIN} castShadow>
          <sphereGeometry args={[0.24, 16, 12]} />
        </mesh>
        <mesh position-z={0.04} rotation-x={Math.PI / 2} material={PIN}>
          <cylinderGeometry args={[0.13, 0.17, 0.12, 14]} />
        </mesh>
      </group>
    </group>
  );
}

/** Mural de cortiça com moldura de madeira e dois bilhetes do autor. */
export function Corkboard({ notes }) {
  const textures = useMemo(
    () => [
      noteTexture({ text: notes[0], paper: '#b9d0f0', seed: 2 }),
      noteTexture({ text: notes[1], paper: '#f7f4ec', seed: 5 }),
    ],
    [notes],
  );
  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures]);

  const front = FRAME[2] / 2;
  return (
    <group
      position={[
        LAYOUT.corkboard.position[0],
        LAYOUT.corkboard.position[1],
        LAYOUT.corkboard.position[2] + front,
      ]}
    >
      <RoundedBox
        args={FRAME}
        radius={0.2}
        smoothness={3}
        material={clay('#e6cb9e', { roughness: 0.7 })}
        castShadow
        receiveShadow
      />
      <mesh position-z={front + 0.005} receiveShadow>
        <planeGeometry args={[FRAME[0] - 0.6, FRAME[1] - 0.6]} />
        <meshStandardMaterial color="#a88b72" roughness={0.95} />
      </mesh>
      <Note
        texture={textures[0]}
        position={[-1.5, 0.15, front + 0.03]}
        rotation={0.06}
        size={2.3}
      />
      <Note
        texture={textures[1]}
        position={[1.55, -0.2, front + 0.04]}
        rotation={-0.08}
        size={2.2}
      />
    </group>
  );
}
