import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MousePointerClick } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MathUtils, MeshBasicMaterial, Vector3 } from 'three';
import { coverDistance, fitDistance } from '../../../lib/camera-fit.js';
import { siteConfig } from '../../../site.config.js';
import { Character } from './Character.jsx';
import { Chair, SEAT_TOP } from './room/Chair.jsx';
import { Corkboard } from './room/Corkboard.jsx';
import { Desk } from './room/Desk.jsx';
import { Keyboard, Mug, PencilCup } from './room/DeskItems.jsx';
import { GaloFrame } from './room/GaloFrame.jsx';
import {
  CHAIR_YAW,
  LAYOUT,
  MONITOR,
  osScreenPose,
  ROOM_VIEW,
  roomFrame,
  WALL_Z,
} from './room/layout.js';
import { LuffyFigure } from './room/LuffyFigure.jsx';
import { Monitor } from './room/Monitor.jsx';
import { Plant } from './room/Plant.jsx';
import { Rug } from './room/Rug.jsx';
import { Shelf } from './room/Shelf.jsx';
import { Tennis } from './room/Tennis.jsx';
import { createScreen } from './screen-texture.js';
import { codeTexture } from './textures.js';

export const FOV = 28;
const SCREEN = osScreenPose();
// Leve sobra para a borda do monitor nunca aparecer no enquadramento final.
const OVERSCAN = 0.985;
const ARC_HEIGHT = 3.2;
// Ao tirar o mouse do boneco, ele espera um pouco antes de voltar ao trabalho: a cadeira
// girando tira o corpo de baixo do cursor, e sem a folga ele ficaria indo e voltando.
const PERSON_LINGER_MS = 400;
// Luz das telas no tema escuro: um pouco à frente do centro de cada monitor.
const SCREEN_GLOWS = [
  { monitor: LAYOUT.monitorCode, color: '#8ea2ff' },
  { monitor: LAYOUT.monitorOS, color: '#7fe0d2' },
].map(({ monitor, color }) => ({
  color,
  position: [
    monitor.position[0] + Math.sin(monitor.rotationY) * 1.6,
    monitor.position[1] + MONITOR.centerY - 0.4,
    monitor.position[2] + Math.cos(monitor.rotationY) * 1.6,
  ],
}));
// O boneco senta com a cintura um pouco acima do assento e as coxas sobre ele.
const SITTING = { y: SEAT_TOP + 0.62, z: -0.15 };

// Dia: sala clara e quente. Noite: luz fria de fora e o brilho das telas.
const LIGHTS = {
  light: {
    hemisphere: ['#ffffff', '#e6d3b8', 1.5],
    key: ['#fff3e0', 2.4],
    fill: ['#dfe7ff', 0.55],
    shadow: ['#6b4a2c', 0.2],
  },
  dark: {
    hemisphere: ['#8c93c4', '#2b2333', 0.55],
    key: ['#c6d0ff', 0.9],
    fill: ['#ffb27a', 0.35],
    shadow: ['#000000', 0.42],
  },
};

/** Carrega uma imagem para desenhar no canvas da tela (papel de parede, foto). */
function useHtmlImage(src) {
  const imageRef = useRef(null);
  useEffect(() => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      imageRef.current = image;
    };
    image.src = src;
    return () => {
      image.onload = null;
    };
  }, [src]);
  return imageRef;
}

/** Chão e parede invisíveis que só recebem sombra: o quarto "flutua" na cor da página. */
function ShadowCatchers({ color, opacity }) {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial color={color} opacity={opacity} />
      </mesh>
      {/* A parede começa no chão: abaixo dele, a sombra apareceria através do piso transparente. */}
      <mesh position={[0, 20, WALL_Z]} receiveShadow>
        <planeGeometry args={[80, 40]} />
        <shadowMaterial color={color} opacity={opacity * 0.8} />
      </mesh>
    </>
  );
}

/**
 * O quarto da página inicial. A câmera é dirigida pelos números em `animRef`
 * (tweenados pelo GSAP em RoomCanvas): `enter` aproxima na chegada e `zoom`
 * leva da vista geral até a tela do monitor cobrir o viewport.
 */
export function RoomScene({
  animRef,
  theme,
  wallpaperSrc,
  lock,
  notes,
  interactive,
  motion,
  showHint,
  hintLabel,
  onEnter,
  onReady,
}) {
  const lights = LIGHTS[theme === 'dark' ? 'dark' : 'light'];
  const [hovered, setHovered] = useState(false);
  const [personHovered, setPersonHovered] = useState(false);
  const lingerRef = useRef(0);
  const swivelRef = useRef(null);
  const characterRef = useRef(null);
  const lookRef = useRef({ yaw: 0, pitch: 0 });
  const screen = useMemo(() => createScreen({ initials: siteConfig.author.initials }), []);
  const code = useMemo(() => codeTexture(), []);
  // Telas: textura sem luz nem tone mapping (a da direita é a tela de bloqueio, igual ao HTML).
  const screens = useMemo(
    () => ({
      code: new MeshBasicMaterial({ map: code, toneMapped: false }),
      os: new MeshBasicMaterial({ map: screen.texture, toneMapped: false }),
    }),
    [code, screen],
  );
  const wallpaperRef = useHtmlImage(wallpaperSrc);
  const avatarRef = useHtmlImage('/images/profile.jpg');
  const v = useMemo(
    () => ({
      start: new Vector3(),
      end: new Vector3(),
      target: new Vector3(),
      local: new Vector3(),
      offset: new Vector3(),
    }),
    [],
  );

  useEffect(
    () => () => {
      screen.dispose();
      code.dispose();
      screens.code.dispose();
      screens.os.dispose();
    },
    [screen, code, screens],
  );

  // Tudo carregado: a página pode mostrar a cena (avisa uma vez só).
  const readyCalled = useRef(false);
  useEffect(() => {
    if (readyCalled.current) return;
    readyCalled.current = true;
    onReady?.();
  }, [onReady]);

  useEffect(() => () => clearTimeout(lingerRef.current), []);

  // Mouse no PC ou no boneco: ele gira a cadeira para o visitante e acena.
  const greeting = interactive && (hovered || personHovered);

  useFrame((state, delta) => {
    const { camera, size, pointer } = state;
    const a = animRef.current;
    const aspect = size.width / size.height;
    const frame = roomFrame(aspect);
    const t = a.zoom;

    screen.draw({
      glow: a.glow,
      boot: a.boot,
      reveal: a.reveal,
      image: wallpaperRef.current,
      avatar: avatarRef.current,
      lock,
    });

    // Cadeira: gira para o visitante quando o mouse está no PC ou nele; volta ao trabalho no zoom.
    if (swivelRef.current) {
      const yaw = greeting && t === 0 ? CHAIR_YAW.greet : CHAIR_YAW.work;
      swivelRef.current.rotation.y = MathUtils.damp(swivelRef.current.rotation.y, yaw, 4, delta);
    }
    // Cabeça: olha para a câmera (até onde o pescoço deixa) quando está cumprimentando.
    if (characterRef.current) {
      characterRef.current.worldToLocal(v.local.copy(camera.position));
      const yaw = Math.atan2(v.local.x, v.local.z);
      const pitch = -Math.atan2(v.local.y - 4.4, Math.hypot(v.local.x, v.local.z));
      const facing = greeting && t === 0;
      lookRef.current.yaw = facing ? MathUtils.clamp(yaw, -0.9, 0.9) : 0.1;
      lookRef.current.pitch = facing ? MathUtils.clamp(pitch, -0.4, 0.3) : 0;
    }

    // Vista geral: o quarto inteiro no quadro (com paralaxe do mouse). Na
    // chegada, a câmera vem de um pouco mais longe e mais alto.
    const idle =
      fitDistance({
        width: ROOM_VIEW.width / frame.w,
        height: ROOM_VIEW.height / frame.h,
        fov: FOV,
        aspect,
      }) *
      (1 + 0.22 * (1 - a.enter));
    const parallax = motion ? 1 - t : 0;
    v.offset.set(pointer.x * 1.2 * parallax, (pointer.y * 0.6 + (1 - a.enter) * 3) * parallax, 0);
    v.start.copy(ROOM_VIEW.direction).multiplyScalar(idle).add(ROOM_VIEW.target).add(v.offset);

    // Final: de frente para a tela, à distância que faz ela COBRIR o viewport.
    const distance =
      coverDistance({
        planeWidth: MONITOR.screen.w,
        planeHeight: MONITOR.screen.h,
        fov: FOV,
        aspect,
      }) * OVERSCAN;
    v.end.copy(SCREEN.normal).multiplyScalar(distance).add(SCREEN.center);

    // No caminho, a câmera sobe num arco: passa por cima da cabeça do boneco.
    camera.position.lerpVectors(v.start, v.end, t);
    camera.position.y += Math.sin(Math.PI * t) * ARC_HEIGHT;
    v.target.lerpVectors(ROOM_VIEW.target, SCREEN.center, t);
    camera.lookAt(v.target);

    // O quarto fica à direita do nome (ou embaixo, no celular); no zoom, volta ao centro.
    const shift = 1 - t;
    camera.setViewOffset(
      size.width,
      size.height,
      -(frame.cx - 0.5) * size.width * shift,
      -(frame.cy - 0.5) * size.height * shift,
      size.width,
      size.height,
    );
  });

  const pc = {
    onPointerOver: (event) => {
      event.stopPropagation();
      setHovered(true);
      if (interactive) document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      setHovered(false);
      document.body.style.cursor = '';
    },
    onClick: (event) => {
      event.stopPropagation();
      if (interactive) onEnter();
    },
  };

  // Sem `stopPropagation`: onde o boneco cobre o monitor, o PC atrás continua clicável.
  const person = {
    onPointerOver: () => {
      clearTimeout(lingerRef.current);
      setPersonHovered(true);
    },
    onPointerOut: () => {
      clearTimeout(lingerRef.current);
      lingerRef.current = setTimeout(() => setPersonHovered(false), PERSON_LINGER_MS);
    },
  };

  const hintPosition = [
    LAYOUT.monitorOS.position[0],
    LAYOUT.monitorOS.position[1] + MONITOR.centerY + MONITOR.body[1] / 2 + 0.9,
    LAYOUT.monitorOS.position[2],
  ];

  return (
    <>
      <hemisphereLight args={lights.hemisphere} />
      <directionalLight
        position={[-9, 20, 13]}
        color={lights.key[0]}
        intensity={lights.key[1]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-17}
        shadow-camera-right={17}
        shadow-camera-top={17}
        shadow-camera-bottom={-17}
        shadow-camera-far={70}
      />
      <directionalLight position={[14, 8, 6]} color={lights.fill[0]} intensity={lights.fill[1]} />
      {/* À noite, as telas acesas iluminam a mesa e o boneco. */}
      {theme === 'dark' &&
        SCREEN_GLOWS.map(({ position, color }) => (
          <pointLight
            key={color}
            position={position}
            color={color}
            intensity={14}
            distance={10}
            decay={2}
          />
        ))}

      <ShadowCatchers color={lights.shadow[0]} opacity={lights.shadow[1]} />
      <Rug />
      <Desk />
      <Shelf />
      <Corkboard notes={notes} />
      <GaloFrame />
      <Plant />
      <Tennis enabled={interactive} />
      <LuffyFigure enabled={interactive} />
      <PencilCup />
      <Mug color={siteConfig.accentColor} />

      {/* O "PC": os dois monitores, o teclado e o mouse respondem ao clique. */}
      <group {...pc}>
        <Monitor {...LAYOUT.monitorCode} screenMaterial={screens.code} />
        <Monitor {...LAYOUT.monitorOS} screenMaterial={screens.os} />
        <Keyboard />
      </group>

      {/* O boneco (com a cadeira) também responde ao mouse. */}
      <group {...person}>
        <Chair swivelRef={swivelRef}>
          <group ref={characterRef} position={[0, SITTING.y, SITTING.z]}>
            <Character pose={greeting ? 'sitWave' : 'sit'} lookRef={lookRef} animate={motion} />
          </group>
        </Chair>
      </group>

      {showHint && (
        <Html
          position={hintPosition}
          center
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span
            aria-hidden
            className="flex animate-bounce items-center gap-1.5 rounded-full bg-[#2a2622] px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-white shadow-lg"
          >
            <MousePointerClick className="size-4" />
            {hintLabel}
          </span>
        </Html>
      )}
    </>
  );
}
