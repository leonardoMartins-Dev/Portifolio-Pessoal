import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Interactive } from './Interactive.jsx';
import { LAYOUT } from './layout.js';
import { phoneScreenTexture } from './textures.js';

const BODY = [0.72, 0.075, 1.48];
const SCREEN = [BODY[0] - 0.05, BODY[2] - 0.05];
const CYCLE = 9; // segundos entre notificações
const LIT = 3.2; // segundos com a tela acesa
const BUZZ = 0.6; // segundos vibrando

/**
 * Celular sobre a mesa: vidro preto que reflete o quarto; de tempos em tempos
 * vibra e acende com uma notificação. Clique → Contato.
 */
export function Phone({ interaction, onActivate }) {
  const bodyRef = useRef(null);
  const screenRef = useRef(null);
  const texture = useMemo(() => phoneScreenTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime + 5) % CYCLE;
    const fadeIn = Math.min(1, t / 0.25);
    const fadeOut = Math.min(1, Math.max(0, (LIT - t) / 0.6));
    if (screenRef.current) screenRef.current.opacity = t < LIT ? fadeIn * fadeOut * 0.85 : 0;
    if (bodyRef.current) {
      const buzz = t < BUZZ ? Math.sin(t * 90) * 0.012 * (1 - t / BUZZ) : 0;
      bodyRef.current.position.x = buzz;
      bodyRef.current.rotation.y = buzz * 1.5;
    }
  });

  return (
    <Interactive
      {...interaction}
      {...LAYOUT.phone}
      labelPosition={[0, 0.9, 0]}
      onActivate={onActivate}
    >
      <group ref={bodyRef}>
        <RoundedBox
          args={BODY}
          radius={0.035}
          smoothness={3}
          position-y={BODY[1] / 2}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#2a2b30" metalness={0.85} roughness={0.3} />
        </RoundedBox>
        {/* Vidro da tela (reflete o ambiente) e, por cima, a tela acesa */}
        <mesh rotation-x={-Math.PI / 2} position-y={BODY[1] + 0.001}>
          <planeGeometry args={SCREEN} />
          <meshPhysicalMaterial color="#050608" roughness={0.06} clearcoat={1} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={BODY[1] + 0.002}>
          <planeGeometry args={SCREEN} />
          <meshBasicMaterial
            ref={screenRef}
            map={texture}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>
    </Interactive>
  );
}
