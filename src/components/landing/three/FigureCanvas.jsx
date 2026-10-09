import { RoundedBox } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, NeutralToneMapping, Plane, Vector3 } from 'three';
import { fitDistance } from '../../../lib/camera-fit.js';
import { Character } from './Character.jsx';
import { characterMaterial, HEAD_HEIGHT, LOOK, STAND_WAIST } from './character-look.js';
import { createBeamMaterial, createHoloMaterial } from './holo.js';
import { clay, glow } from './materials.js';

const FOV = 30;
const PLATFORM_TOP = 0.7;
/** Topo da cabeça (com o cabelo) em cima do pedestal. */
const FIGURE_TOP = PLATFORM_TOP + STAND_WAIST + HEAD_HEIGHT + 1.85;
const HOLO_VIEW = { width: 9, height: 13.4, target: new Vector3(0, 5.7, 0), lift: 1.2 };
const WAVE_VIEW = { width: 14, height: 11.8, target: new Vector3(0.4, 4.9, 0), lift: 1.6 };

/** Posição do mouse na janela inteira: o boneco acompanha mesmo fora do canvas. */
function useWindowPointer() {
  const pointer = useRef({ x: 0, y: 0, active: false });
  useEffect(() => {
    function onMove(event) {
      pointer.current = { x: event.clientX, y: event.clientY, active: true };
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return pointer;
}

/** Enquadra a área da cena e vira a cabeça do boneco para o mouse. */
function useStage({ view, lookRef, motion, sideways = 0 }) {
  const pointer = useWindowPointer();
  useFrame(({ camera, size, gl }) => {
    const aspect = size.width / size.height;
    const distance = fitDistance({ width: view.width, height: view.height, fov: FOV, aspect });
    camera.position.set(view.target.x + sideways * distance, view.target.y + view.lift, distance);
    camera.lookAt(view.target);

    const look = lookRef.current;
    const p = pointer.current;
    if (!motion || !p.active) {
      look.yaw = 0;
      look.pitch = 0;
      return;
    }
    const rect = gl.domElement.getBoundingClientRect();
    const dx = (p.x - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
    const dy = (p.y - (rect.top + rect.height * 0.3)) / (window.innerHeight / 2);
    look.yaw = MathUtils.clamp(dx, -1, 1) * 0.6;
    look.pitch = MathUtils.clamp(dy, -1, 1) * 0.3;
  });
}

/** Materiais do holograma: abaixo do scanner o boneco real, acima o holograma. */
function createHoloKit() {
  const below = new Plane(new Vector3(0, -1, 0), 0);
  const above = new Plane(new Vector3(0, 1, 0), 0);
  const holo = createHoloMaterial();
  holo.clippingPlanes = [above];
  const real = Object.fromEntries(
    Object.keys(LOOK).map((key) => {
      const material = characterMaterial(key).clone();
      material.clippingPlanes = [below];
      return [key, material];
    }),
  );
  return { planes: { below, above }, holo, beam: createBeamMaterial(), real };
}

/**
 * Sobre: o boneco num pedestal holográfico. Conforme a seção sobe na tela,
 * um scanner passa dos pés à cabeça e o holograma vira o boneco de verdade.
 */
function HoloScene({ motion }) {
  const lookRef = useRef({ yaw: 0, pitch: 0 });
  const ringRef = useRef(null);
  const scan = useRef(motion ? -0.5 : FIGURE_TOP + 1);
  useStage({ view: HOLO_VIEW, lookRef, motion });

  const kit = useMemo(() => createHoloKit(), []);
  // Os planos de corte e o relógio do shader mudam a cada quadro: sempre pela ref.
  const kitRef = useRef(kit);
  useEffect(
    () => () => {
      kit.holo.dispose();
      kit.beam.dispose();
      Object.values(kit.real).forEach((material) => material.dispose());
    },
    [kit],
  );
  const realFor = (key) => kit.real[key];
  const holoFor = () => kit.holo;

  useFrame((state, delta) => {
    const rect = state.gl.domElement.getBoundingClientRect();
    const viewport = window.innerHeight;
    const progress = MathUtils.clamp((viewport - rect.top) / (viewport * 0.85), 0, 1);
    const goal = motion ? MathUtils.lerp(-0.5, FIGURE_TOP + 0.6, progress) : FIGURE_TOP + 1;
    scan.current = motion ? MathUtils.damp(scan.current, goal, 3, delta) : goal;
    const { planes, holo } = kitRef.current;
    planes.below.constant = scan.current;
    planes.above.constant = -scan.current;
    holo.uniforms.uTime.value = state.clock.elapsedTime;
    const ring = ringRef.current;
    if (ring) {
      ring.position.y = scan.current;
      ring.visible = scan.current > PLATFORM_TOP + 0.1 && scan.current < FIGURE_TOP;
    }
  });

  return (
    <>
      <hemisphereLight args={['#cfe9ff', '#0b1d4a', 1.4]} />
      <directionalLight position={[6, 10, 14]} color="#fff5ea" intensity={1.8} />
      <directionalLight position={[-8, 6, -6]} color="#5fd0ff" intensity={2.6} />

      {/* Pedestal: base escura, tampo e o anel aceso */}
      <mesh position-y={0.3} material={clay('#0f2a66', { roughness: 0.4 })}>
        <cylinderGeometry args={[2.85, 3.05, 0.6, 48]} />
      </mesh>
      <mesh position-y={0.64} material={clay('#1b4fae', { roughness: 0.3 })}>
        <cylinderGeometry args={[2.6, 2.7, 0.12, 48]} />
      </mesh>
      <mesh position-y={PLATFORM_TOP} rotation-x={-Math.PI / 2} material={glow('#8fe6ff')}>
        <ringGeometry args={[2.38, 2.52, 64]} />
      </mesh>
      <mesh position-y={0.32} rotation-x={Math.PI / 2} material={glow('#4cc4ff')}>
        <torusGeometry args={[3.0, 0.035, 8, 64]} />
      </mesh>
      <mesh position-y={PLATFORM_TOP + 5} material={kit.beam}>
        <cylinderGeometry args={[2.9, 2.5, 10, 48, 1, true]} />
      </mesh>

      <group position-y={PLATFORM_TOP + STAND_WAIST}>
        <Character
          pose="stand"
          lookRef={lookRef}
          animate={motion}
          materialFor={realFor}
          castShadow={false}
        />
        <Character
          pose="stand"
          lookRef={lookRef}
          animate={motion}
          materialFor={holoFor}
          castShadow={false}
        />
      </group>

      {/* Scanner: o anel que sobe com a rolagem */}
      <group ref={ringRef}>
        <mesh rotation-x={Math.PI / 2} material={glow('#9feaff')}>
          <torusGeometry args={[2.2, 0.03, 8, 64]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2}>
          <circleGeometry args={[2.2, 48]} />
          <meshBasicMaterial color="#5fd0ff" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

/** Envelope fechado no chão: corpo branco e as dobras da aba em V. */
function Envelope({ position, rotation, color = '#f8f6f1' }) {
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox
        args={[2.0, 0.07, 1.36]}
        radius={0.03}
        smoothness={2}
        position-y={0.035}
        material={clay(color)}
        castShadow
        receiveShadow
      />
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.5, 0.074, -0.27]}
          rotation={[-Math.PI / 2, 0, side * -0.5]}
          material={clay('#d8d2c6')}
        >
          <planeGeometry args={[1.14, 0.035]} />
        </mesh>
      ))}
    </group>
  );
}

/** Caixa de papelão com fita e etiqueta. */
function Parcel({ position, rotation, size }) {
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox
        args={size}
        radius={0.08}
        smoothness={3}
        position-y={size[1] / 2}
        material={clay('#d8b78b', { roughness: 0.8 })}
        castShadow
        receiveShadow
      />
      <mesh
        position={[0, size[1] + 0.003, 0]}
        rotation-x={-Math.PI / 2}
        material={clay('#c79f6e', { roughness: 0.6 })}
      >
        <planeGeometry args={[size[0] - 0.1, 0.42]} />
      </mesh>
      <mesh
        position={[size[0] * 0.18, size[1] * 0.62, size[2] / 2 + 0.003]}
        material={clay('#f6f3ec')}
      >
        <planeGeometry args={[size[0] * 0.34, size[1] * 0.22]} />
      </mesh>
    </group>
  );
}

/** Contato: o boneco acenando, com cartas e caixas pelo chão. */
function WaveScene({ motion, theme }) {
  const lookRef = useRef({ yaw: 0, pitch: 0 });
  useStage({ view: WAVE_VIEW, lookRef, motion, sideways: 0.12 });
  const dark = theme === 'dark';

  return (
    <>
      <hemisphereLight args={dark ? ['#a7aedb', '#2b2333', 1.2] : ['#ffffff', '#e2cdb0', 1.5]} />
      <directionalLight
        position={[-8, 16, 12]}
        color={dark ? '#cbd5ff' : '#fff3e0'}
        intensity={dark ? 1.7 : 2.3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-radius={6}
        shadow-bias={-0.0004}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial color={dark ? '#000000' : '#6b4a2c'} opacity={dark ? 0.4 : 0.2} />
      </mesh>

      <group position-y={STAND_WAIST} rotation-y={-0.18}>
        <Character pose="wave" lookRef={lookRef} animate={motion} />
      </group>
      <Envelope position={[-4.2, 0, 2.6]} rotation={0.5} />
      <Envelope position={[-6.6, 0, -0.4]} rotation={-0.3} color="#cfe0f5" />
      <Envelope position={[3.6, 0, 3.0]} rotation={-0.7} />
      <Parcel position={[5.6, 0, -1.8]} rotation={-0.35} size={[3.2, 2.3, 2.5]} />
      <Parcel position={[6.4, 2.3, -2.0]} rotation={-0.15} size={[2.0, 1.5, 1.7]} />
    </>
  );
}

/** Canvas das figuras da página: o holograma do Sobre ou o aceno do Contato. */
export default function FigureCanvas({ variant, motion, visible, theme }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      shadows={variant === 'wave' ? 'percentage' : false}
      frameloop={visible ? 'always' : 'never'}
      camera={{ fov: FOV, near: 0.5, far: 150, position: [0, 6, 26] }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: NeutralToneMapping,
        localClippingEnabled: true,
      }}
      aria-hidden
    >
      {variant === 'holo' ? (
        <HoloScene motion={motion} />
      ) : (
        <WaveScene motion={motion} theme={theme} />
      )}
    </Canvas>
  );
}
