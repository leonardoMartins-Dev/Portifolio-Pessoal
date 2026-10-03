import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Object3D } from 'three';
import { FLOOR_Y, LAYOUT, WALL_Z } from './layout.js';
import { noiseTexture, streetTexture } from './textures.js';

const FRAME = 0.2;
const FRAME_DEPTH = 0.32;
const SLAT = { gap: 0.2, depth: 0.2, thickness: 0.014, tilt: 0.55 };
// Extensão da parede (x e y) e densidade do relevo de reboco (repetições por unidade).
const WALL = { left: -45, right: 45, bottom: FLOOR_Y - 2, top: 34 };
const PLASTER_DENSITY = 0.12;

/**
 * A parede em quatro peças em volta da abertura da janela: assim ela faz
 * sombra e o sol do dia só entra pela persiana.
 */
function wallPieces() {
  const [w, h] = LAYOUT.window.size;
  const [cx, cy] = LAYOUT.window.position;
  const left = cx - w / 2 - FRAME;
  const right = cx + w / 2 + FRAME;
  const bottom = cy - h / 2 - FRAME;
  const top = cy + h / 2 + FRAME;
  const rect = (x0, x1, y0, y1) => ({
    position: [(x0 + x1) / 2, (y0 + y1) / 2, WALL_Z],
    size: [x1 - x0, y1 - y0],
  });
  return [
    rect(WALL.left, left, WALL.bottom, WALL.top),
    rect(right, WALL.right, WALL.bottom, WALL.top),
    rect(left, right, top, WALL.top),
    rect(left, right, WALL.bottom, bottom),
  ];
}

const WALL_PIECES = wallPieces();

/**
 * Canto do quarto: parede de reboco, chão e a janela com persiana. Pelas
 * frestas aparece a rua (de noite, luzes desfocadas; de dia, claridade) e,
 * de dia, o sol que entra projeta as listras das lâminas na mesa.
 */
export function Room({ isDark }) {
  const slatsRef = useRef(null);
  const street = useMemo(() => streetTexture({ night: isDark }), [isDark]);
  // Um relevo por peça, com a repetição proporcional ao tamanho (mesma densidade em toda a parede).
  const plaster = useMemo(() => {
    const base = noiseTexture({ seed: 21, grain: 0.35 });
    return WALL_PIECES.map(({ size }) => {
      const texture = base.clone();
      texture.repeat.set(size[0] * PLASTER_DENSITY * 8, size[1] * PLASTER_DENSITY * 8);
      return texture;
    });
  }, []);
  useEffect(() => () => street.dispose(), [street]);
  useEffect(() => () => plaster.forEach((texture) => texture.dispose()), [plaster]);

  const [w, h] = LAYOUT.window.size;
  const slatCount = Math.floor((h - 0.3) / SLAT.gap);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let i = 0; i < slatCount; i++) {
      dummy.position.set(0, h / 2 - 0.3 - i * SLAT.gap, 0.12);
      dummy.rotation.set(SLAT.tilt, 0, 0);
      dummy.updateMatrix();
      slatsRef.current.setMatrixAt(i, dummy.matrix);
    }
    slatsRef.current.instanceMatrix.needsUpdate = true;
  }, [slatCount, h]);

  const white = <meshStandardMaterial color="#ece8e1" roughness={0.55} />;

  return (
    <group>
      {WALL_PIECES.map(({ position, size }, index) => (
        <mesh key={index} position={position} castShadow receiveShadow>
          <planeGeometry args={size} />
          <meshStandardMaterial
            color={isDark ? '#cbc2b4' : '#e4dccf'}
            roughness={0.95}
            bumpMap={plaster[index]}
            bumpScale={0.6}
          />
        </mesh>
      ))}
      <mesh position={[0, FLOOR_Y + 0.45, WALL_Z + 0.06]}>
        <boxGeometry args={[90, 0.9, 0.12]} />
        <meshStandardMaterial color="#efece6" roughness={0.6} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, 10]} receiveShadow>
        <planeGeometry args={[90, 28]} />
        <meshStandardMaterial color="#4a3a2c" roughness={0.7} />
      </mesh>

      <group position={LAYOUT.window.position}>
        {/* A rua, atrás do vidro: brilha mais que o quarto (o bloom pega as luzes). */}
        <mesh position-z={-0.04}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={street} color={isDark ? [1.6, 1.6, 1.6] : [2.4, 2.4, 2.4]} />
        </mesh>
        {/* Batente, moldura e peitoril */}
        <mesh position={[0, h / 2 + FRAME / 2, 0.05]} castShadow>
          <boxGeometry args={[w + FRAME * 2, FRAME, FRAME_DEPTH]} />
          {white}
        </mesh>
        <mesh position={[0, -h / 2 - FRAME / 2, 0.05]} castShadow>
          <boxGeometry args={[w + FRAME * 2, FRAME, FRAME_DEPTH]} />
          {white}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[(side * (w + FRAME)) / 2, 0, 0.05]} castShadow>
            <boxGeometry args={[FRAME, h, FRAME_DEPTH]} />
            {white}
          </mesh>
        ))}
        <mesh position={[0, -h / 2 - FRAME - 0.05, 0.32]} receiveShadow>
          <boxGeometry args={[w + 0.9, 0.12, 0.62]} />
          {white}
        </mesh>
        {/* Persiana: trilho, lâminas inclinadas e cordões */}
        <mesh position={[0, h / 2 - 0.1, 0.13]} castShadow>
          <boxGeometry args={[w - 0.05, 0.16, 0.22]} />
          {white}
        </mesh>
        <instancedMesh ref={slatsRef} args={[undefined, undefined, slatCount]} castShadow>
          <boxGeometry args={[w - 0.12, SLAT.thickness, SLAT.depth]} />
          <meshStandardMaterial color="#efebe4" roughness={0.5} />
        </instancedMesh>
        {[-w / 3, w / 3].map((x) => (
          <mesh key={x} position={[x, 0, 0.2]}>
            <cylinderGeometry args={[0.012, 0.012, h - 0.2, 6]} />
            <meshStandardMaterial color="#d9d4ca" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
