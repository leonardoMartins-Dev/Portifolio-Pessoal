import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { DoubleSide } from 'three';
import { clay } from '../materials.js';
import { stringsTexture, tennisBallTexture } from '../textures.js';
import { LAYOUT } from './layout.js';

const BALL_RADIUS = 0.42;
const HEAD = { radius: 1.3, stretch: 1.3, tube: 0.12 };
const HANDLE = { start: 3.0, length: 2.35, radius: 0.16 };
const BOUNCE_SECONDS = 1.8;
const FRAME = clay('#24252c', { roughness: 0.35 });
const ACCENT = clay('#e0483f', { roughness: 0.4 });

/** Uma haste do coração da raquete, de `from` até `to` (no plano da raquete). */
function Throat({ from, to }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  return (
    <mesh
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0]}
      rotation-z={Math.atan2(dy, dx) - Math.PI / 2}
      material={FRAME}
      castShadow
    >
      <cylinderGeometry args={[0.08, 0.09, Math.hypot(dx, dy), 10]} />
    </mesh>
  );
}

/** Bolinha no chão. Clique: quica e rola de volta. */
function Ball({ position, texture, enabled }) {
  const ref = useRef(null);
  const start = useRef(-Infinity);
  const requested = useRef(false);

  useFrame(({ clock }) => {
    if (requested.current) {
      requested.current = false;
      start.current = clock.elapsedTime;
    }
    const ball = ref.current;
    if (!ball) return;
    const t = clock.elapsedTime - start.current;
    if (t < BOUNCE_SECONDS) {
      ball.position.y = BALL_RADIUS + Math.abs(Math.sin(t * 7)) * 2.2 * Math.exp(-t * 2.2);
      ball.rotation.x = -t * 5;
    } else {
      ball.position.y = BALL_RADIUS;
    }
  });

  return (
    <mesh
      ref={ref}
      position={[position[0], BALL_RADIUS, position[1]]}
      castShadow
      onClick={(event) => {
        event.stopPropagation();
        if (enabled) requested.current = true;
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (enabled) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <sphereGeometry args={[BALL_RADIUS, 32, 24]} />
      <meshStandardMaterial map={texture} roughness={0.95} />
    </mesh>
  );
}

/** Raquete de tênis deitada no chão, perto do tapete, e duas bolinhas. */
export function Tennis({ enabled }) {
  const strings = useMemo(() => stringsTexture(), []);
  const ball = useMemo(() => tennisBallTexture(), []);
  useEffect(
    () => () => {
      strings.dispose();
      ball.dispose();
    },
    [strings, ball],
  );
  const headEnd = HEAD.radius * HEAD.stretch;

  return (
    <>
      <group {...LAYOUT.racket}>
        {/* Desenhada no plano XY e deitada: z local vira "para cima". */}
        <group rotation-x={-Math.PI / 2} position-y={HEAD.tube}>
          <group scale={[HEAD.stretch, 1, 1]}>
            <mesh material={FRAME} castShadow receiveShadow>
              <torusGeometry args={[HEAD.radius, HEAD.tube, 14, 72]} />
            </mesh>
            <mesh material={ACCENT}>
              <torusGeometry args={[HEAD.radius - 0.02, HEAD.tube * 0.6, 8, 72]} />
            </mesh>
            <mesh>
              <circleGeometry args={[HEAD.radius - 0.05, 48]} />
              <meshStandardMaterial
                map={strings}
                transparent
                alphaTest={0.3}
                side={DoubleSide}
                roughness={0.6}
              />
            </mesh>
          </group>
          <Throat from={[headEnd - 0.2, 0.62]} to={[HANDLE.start, 0.1]} />
          <Throat from={[headEnd - 0.2, -0.62]} to={[HANDLE.start, -0.1]} />
          <mesh
            position={[HANDLE.start + HANDLE.length / 2, 0, HANDLE.radius - HEAD.tube]}
            rotation-z={-Math.PI / 2}
            material={clay('#f1eee8', { roughness: 0.9 })}
            castShadow
          >
            <cylinderGeometry args={[HANDLE.radius, HANDLE.radius, HANDLE.length, 8]} />
          </mesh>
          <mesh
            position={[HANDLE.start + HANDLE.length + 0.04, 0, HANDLE.radius - HEAD.tube]}
            rotation-z={-Math.PI / 2}
            material={FRAME}
          >
            <cylinderGeometry args={[0.18, 0.18, 0.08, 8]} />
          </mesh>
        </group>
      </group>
      {LAYOUT.balls.map((position) => (
        <Ball key={position.join()} position={position} texture={ball} enabled={enabled} />
      ))}
    </>
  );
}
