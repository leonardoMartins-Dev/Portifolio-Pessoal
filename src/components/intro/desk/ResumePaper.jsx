import { Interactive } from './Interactive.jsx';
import { LAYOUT } from './layout.js';
import { useImageTexture } from './use-image-texture.js';

const A4 = [2.1, 2.97];
const PEN = { length: 1.45, radius: 0.042 };

/** O currículo impresso (a mesma imagem do app), sobre outra folha, com uma caneta. Clique → Currículo. */
export function ResumePaper({ locale, interaction, onActivate }) {
  const texture = useImageTexture(`/cv/cv-${locale}.png`);
  return (
    <Interactive
      {...interaction}
      {...LAYOUT.resume}
      labelPosition={[0, 0.8, 0]}
      onActivate={onActivate}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0.07]} position-y={0.003} receiveShadow>
        <planeGeometry args={A4} />
        <meshStandardMaterial color="#f4f2ec" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.008} receiveShadow>
        <planeGeometry args={A4} />
        {/* key: trocar de "sem mapa" para "com mapa" exige um material novo. */}
        <meshStandardMaterial key={texture ? 'map' : 'plain'} map={texture} roughness={0.85} />
      </mesh>
      {/* Caneta deitada sobre a folha */}
      <group position={[0.55, PEN.radius + 0.01, 0.35]} rotation={[0, 0.9, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[PEN.radius, PEN.radius, PEN.length, 16]} />
          <meshPhysicalMaterial color="#151517" roughness={0.3} clearcoat={0.8} />
        </mesh>
        <mesh position-y={PEN.length / 2 + 0.06}>
          <coneGeometry args={[PEN.radius, 0.12, 16]} />
          <meshStandardMaterial color="#c9c9cc" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Clipe: o x local aponta para cima depois da rotação */}
        <mesh position={[PEN.radius, -PEN.length / 2 + 0.25, 0]}>
          <boxGeometry args={[0.02, 0.4, 0.026]} />
          <meshStandardMaterial color="#c9c9cc" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </Interactive>
  );
}
