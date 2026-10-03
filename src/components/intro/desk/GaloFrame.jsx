import { RoundedBox } from '@react-three/drei';
import { Interactive } from './Interactive.jsx';
import { LAYOUT } from './layout.js';
import { useImageTexture } from './use-image-texture.js';

const FRAME = [3.0, 3.9, 0.16];
const MAT_INSET = 0.22;
const CREST_HEIGHT = 2.45;
const CREST_ASPECT = 322.7 / 480.1;

/**
 * Quadro do Atlético Mineiro na parede: moldura preta, passe-partout,
 * o escudo (Wikimedia) e um vidro que reflete o quarto. Clique → Sobre.
 */
export function GaloFrame({ interaction, onActivate }) {
  const crest = useImageTexture('/images/galo.svg', { height: 1024 });
  const front = FRAME[2] / 2;
  return (
    <Interactive
      {...interaction}
      {...LAYOUT.frame}
      labelPosition={[0, FRAME[1] / 2 + 0.6, 0.2]}
      onActivate={onActivate}
    >
      <RoundedBox args={FRAME} radius={0.035} smoothness={3} castShadow>
        <meshStandardMaterial color="#1b1a19" roughness={0.45} />
      </RoundedBox>
      {/* Passe-partout com um chanfro (a borda interna mais escura) */}
      <mesh position-z={front + 0.001}>
        <planeGeometry args={[FRAME[0] - MAT_INSET, FRAME[1] - MAT_INSET]} />
        <meshStandardMaterial color="#d8d2c6" roughness={0.9} />
      </mesh>
      <mesh position-z={front + 0.002}>
        <planeGeometry args={[FRAME[0] - MAT_INSET - 0.05, FRAME[1] - MAT_INSET - 0.05]} />
        <meshStandardMaterial color="#f2eee6" roughness={0.9} />
      </mesh>
      {crest && (
        <mesh position-z={front + 0.003}>
          <planeGeometry args={[CREST_HEIGHT * CREST_ASPECT, CREST_HEIGHT]} />
          <meshStandardMaterial map={crest} transparent roughness={0.7} />
        </mesh>
      )}
      {/* Vidro: quase invisível, só o reflexo */}
      <mesh position-z={front + 0.02}>
        <planeGeometry args={[FRAME[0] - 0.12, FRAME[1] - 0.12]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          roughness={0.03}
          clearcoat={1}
          envMapIntensity={2.5}
          depthWrite={false}
        />
      </mesh>
    </Interactive>
  );
}
