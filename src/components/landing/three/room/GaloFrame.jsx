import { RoundedBox } from '@react-three/drei';
import { clay } from '../materials.js';
import { useImageTexture } from '../use-image-texture.js';
import { LAYOUT } from './layout.js';

const FRAME = [3.1, 3.8, 0.36];
const CREST_HEIGHT = 2.5;
const CREST_ASPECT = 322.7 / 480.1;

/** Quadro azul na parede com o escudo do Atlético Mineiro (Wikimedia) num fundo branco. */
export function GaloFrame() {
  const crest = useImageTexture('/images/galo.svg', { height: 1024 });
  const front = FRAME[2] / 2;
  return (
    <group
      position={[LAYOUT.galo.position[0], LAYOUT.galo.position[1], LAYOUT.galo.position[2] + front]}
    >
      <RoundedBox
        args={FRAME}
        radius={0.28}
        smoothness={4}
        material={clay('#8fb4e8', { roughness: 0.5 })}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[FRAME[0] - 0.62, FRAME[1] - 0.62, 0.06]}
        radius={0.12}
        smoothness={2}
        position-z={front - 0.01}
        material={clay('#fbfaf6', { roughness: 0.8 })}
        receiveShadow
      />
      {crest && (
        <mesh position-z={front + 0.03}>
          <planeGeometry args={[CREST_HEIGHT * CREST_ASPECT, CREST_HEIGHT]} />
          <meshStandardMaterial map={crest} transparent roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}
