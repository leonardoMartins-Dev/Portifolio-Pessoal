import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { DoubleSide } from 'three';
import { LAYOUT } from './layout.js';
import { Interactive } from './Interactive.jsx';
import { useInvalidateShadows } from './shadows.js';
import { stringsTexture, tennisBallTexture } from './textures.js';

const BALL_RADIUS = 0.335;
const HEAD = { radius: 1.3, stretch: 1.3, tube: 0.11 };
const HANDLE = { start: 3.0, length: 2.35, radius: 0.15 };
const BOUNCE_SECONDS = 1.8;

/** Uma haste do coração da raquete, de `from` até `to` (no plano da raquete). */
function Throat({ from, to }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  return (
    <mesh
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0]}
      rotation-z={Math.atan2(dy, dx) - Math.PI / 2}
      castShadow
    >
      <cylinderGeometry args={[0.07, 0.08, length, 10]} />
      <meshPhysicalMaterial color="#18191d" roughness={0.35} clearcoat={0.8} />
    </mesh>
  );
}

/**
 * Raquete de tênis deitada na mesa, com o cabo para fora da borda, e a
 * bolinha ao lado. Clique: a bolinha quica e o notebook abre no Sobre.
 */
export function TennisRacket({ interaction, onActivate }) {
  const ballRef = useRef(null);
  const bounceStart = useRef(-Infinity);
  const bounceRequested = useRef(false);
  const invalidateShadows = useInvalidateShadows();
  const strings = useMemo(() => stringsTexture(), []);
  const ball = useMemo(() => tennisBallTexture(), []);
  useEffect(
    () => () => {
      strings.dispose();
      ball.dispose();
    },
    [strings, ball],
  );

  useFrame(({ clock }) => {
    if (bounceRequested.current) {
      bounceRequested.current = false;
      bounceStart.current = clock.elapsedTime;
    }
    const t = clock.elapsedTime - bounceStart.current;
    if (!ballRef.current) return;
    if (t < BOUNCE_SECONDS) {
      ballRef.current.position.y =
        BALL_RADIUS + Math.abs(Math.sin(t * 7)) * 1.3 * Math.exp(-t * 2.2);
      ballRef.current.rotation.x = -t * 4;
      invalidateShadows(1);
    } else {
      ballRef.current.position.y = BALL_RADIUS;
    }
  });

  const headEnd = HEAD.radius * HEAD.stretch;

  return (
    <Interactive
      {...interaction}
      labelPosition={[LAYOUT.racket.position[0], 1.4, LAYOUT.racket.position[2]]}
      onActivate={() => {
        bounceRequested.current = true;
        onActivate();
      }}
    >
      <group {...LAYOUT.racket} scale={0.9}>
        {/* Desenhada no plano XY e deitada: z local vira "para cima". */}
        <group rotation-x={-Math.PI / 2} position-y={HEAD.tube}>
          <group scale={[HEAD.stretch, 1, 1]}>
            <mesh castShadow receiveShadow>
              <torusGeometry args={[HEAD.radius, HEAD.tube, 14, 72]} />
              <meshPhysicalMaterial color="#18191d" roughness={0.3} clearcoat={0.9} />
            </mesh>
            <mesh>
              <torusGeometry args={[HEAD.radius - 0.02, HEAD.tube * 0.55, 8, 72]} />
              <meshPhysicalMaterial color="#b3262f" roughness={0.35} clearcoat={0.9} />
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
            castShadow
          >
            <cylinderGeometry args={[HANDLE.radius, HANDLE.radius, HANDLE.length, 8]} />
            <meshStandardMaterial color="#e9e6df" roughness={0.9} />
          </mesh>
          <mesh
            position={[HANDLE.start + HANDLE.length + 0.04, 0, HANDLE.radius - HEAD.tube]}
            rotation-z={-Math.PI / 2}
          >
            <cylinderGeometry args={[0.17, 0.17, 0.08, 8]} />
            <meshStandardMaterial color="#18191d" roughness={0.5} />
          </mesh>
        </group>
      </group>

      <mesh
        ref={ballRef}
        position={[LAYOUT.ball.position[0], BALL_RADIUS, LAYOUT.ball.position[2]]}
        castShadow
      >
        <sphereGeometry args={[BALL_RADIUS, 32, 24]} />
        <meshPhysicalMaterial
          map={ball}
          roughness={0.95}
          sheen={1}
          sheenColor="#f2ff9e"
          sheenRoughness={0.6}
        />
      </mesh>
    </Interactive>
  );
}
