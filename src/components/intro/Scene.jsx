import { Environment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MathUtils, Object3D, Vector3 } from 'three';
import { coverDistance, fitDistance } from '../../lib/camera-fit.js';
import { siteConfig } from '../../site.config.js';
import { Books } from './desk/Books.jsx';
import { Desk } from './desk/Desk.jsx';
import { DeskLamp } from './desk/DeskLamp.jsx';
import { Figure } from './desk/Figure.jsx';
import { GaloFrame } from './desk/GaloFrame.jsx';
import { Mug } from './desk/Mug.jsx';
import { Phone } from './desk/Phone.jsx';
import { Plant } from './desk/Plant.jsx';
import { ResumePaper } from './desk/ResumePaper.jsx';
import { Room } from './desk/Room.jsx';
import { Interactive } from './desk/Interactive.jsx';
import { ShadowContext } from './desk/shadows.js';
import { TennisRacket } from './desk/TennisRacket.jsx';
import { DESK_SHORTCUTS } from './desk-objects.js';
import { Laptop } from './Laptop.jsx';
import { lidRotation, openScreenPose, SCREEN } from './laptop-geometry.js';
import { createLogoTexture, createScreen } from './screen-texture.js';

export const FOV = 35;
// Enquadramento inicial: a mesa toda de frente (paisagem) ou vista mais de cima,
// com o notebook e os vizinhos (retrato: a tela alta cobre a profundidade da mesa).
const VIEW = {
  landscape: {
    target: new Vector3(0.1, 2.4, -0.6),
    direction: new Vector3(0.26, 0.4, 1).normalize(),
    width: 15.5,
    height: 10.4,
  },
  portrait: {
    target: new Vector3(1.3, 0.9, 0.2),
    direction: new Vector3(0.15, 0.78, 0.9).normalize(),
    width: 6.4,
    height: 9,
  },
};
const SCREEN_POSE = openScreenPose();
const SCREEN_CENTER = new Vector3(...SCREEN_POSE.center);
const SCREEN_NORMAL = new Vector3(...SCREEN_POSE.normal);
// A luz da tela sai do centro dela e se abre sobre o teclado e a mesa.
const SCREEN_LIGHT_POSITION = SCREEN_CENTER.clone().addScaledVector(SCREEN_NORMAL, 0.08);
const SCREEN_LIGHT_TARGET = SCREEN_CENTER.clone()
  .addScaledVector(SCREEN_NORMAL, 3)
  .add(new Vector3(0, -1.6, 0));
// Leve sobra para a borda da moldura nunca aparecer no enquadramento final.
const OVERSCAN = 0.985;

// Noite: a luminária é a luz principal; a sala (HDRI) só preenche. Dia: o sol
// entra pela persiana (listras na mesa) e a sala clara ilumina o resto.
const LIGHTS = {
  dark: {
    background: '#06070b',
    hdri: '/hdri/wooden_lounge.hdr',
    environment: 0.22,
    hemisphere: ['#4f4a44', '#140f0b', 0.25],
    window: ['#b9c2d6', 0.06],
  },
  light: {
    background: '#dfe4ec',
    hdri: '/hdri/lebombo.hdr',
    environment: 0.6,
    hemisphere: ['#f4f6ff', '#9a8a78', 0.45],
    window: ['#fff1dc', 3.4],
  },
};
const WINDOW_LIGHT_POSITION = [2, 13, -16];
const VIGNETTE = 0.5;

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

/**
 * Cena da intro: o canto de trabalho do autor. A animação é dirigida pelos
 * números em `animRef` (tweenados pelo GSAP em Intro.jsx); aqui eles viram
 * rotação da tampa, brilho da tela e posição da câmera, a cada quadro.
 */
export function Scene({
  animRef,
  theme,
  wallpaperSrc,
  locale,
  lock,
  labels,
  interactive,
  lite,
  onOpen,
  onReady,
}) {
  const isDark = theme === 'dark';
  const lights = LIGHTS[isDark ? 'dark' : 'light'];
  const lidRef = useRef(null);
  const ledRef = useRef(null);
  const screenLightRef = useRef(null);
  const vignetteRef = useRef(null);
  const screenLightTarget = useMemo(() => {
    const target = new Object3D();
    target.position.copy(SCREEN_LIGHT_TARGET);
    return target;
  }, []);
  const shadowFrames = useRef(12);
  const lastLid = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [lampOverride, setLampOverride] = useState(null);
  const lampOn = lampOverride ?? isDark;
  const screen = useMemo(() => createScreen({ initials: siteConfig.author.initials }), []);
  const logoTexture = useMemo(
    () => createLogoTexture({ initials: siteConfig.author.initials }),
    [],
  );
  const wallpaperRef = useHtmlImage(wallpaperSrc);
  const avatarRef = useHtmlImage('/images/profile.jpg');
  const vectors = useMemo(
    () => ({
      start: new Vector3(),
      end: new Vector3(),
      target: new Vector3(),
      offset: new Vector3(),
    }),
    [],
  );

  const invalidateShadows = useCallback((frames = 2) => {
    shadowFrames.current = Math.max(shadowFrames.current, frames);
  }, []);

  useEffect(
    () => () => {
      screen.dispose();
      logoTexture.dispose();
    },
    [screen, logoTexture],
  );

  // Tudo carregado (modelos inclusos): a intro pode começar.
  useEffect(() => onReady?.(), [onReady]);

  // Tema ou luminária mudaram: a sombra muda de fonte.
  useEffect(() => invalidateShadows(4), [isDark, lampOn, invalidateShadows]);

  const onHover = useCallback(
    (id, leaving) => setHovered((current) => id ?? (current === leaving ? null : current)),
    [],
  );
  const interaction = (id) => ({
    id,
    label: labels[id],
    enabled: interactive,
    hovered: hovered === id,
    onHover,
  });
  const shortcut = (id) => () => onOpen(DESK_SHORTCUTS[id]);

  useFrame((state, delta) => {
    const { camera, size, gl, clock } = state;
    const a = animRef.current;
    const aspect = size.width / size.height;

    // Dica no hover: a tampa levanta uns 4° (só com o notebook fechado).
    a.hover = MathUtils.damp(a.hover, interactive && hovered === 'laptop' ? 1 : 0, 8, delta);
    const lid = lidRotation(a.lid, a.hover);
    if (lidRef.current) lidRef.current.rotation.x = lid;
    if (lastLid.current === null || Math.abs(lid - lastLid.current) > 1e-4) invalidateShadows(1);
    lastLid.current = lid;

    // LED pulsando enquanto espera o clique; apaga quando a tela acende.
    if (ledRef.current) {
      const pulse = interactive ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.4)) : 0;
      ledRef.current.color.setScalar(Math.max(0.04, pulse * (1 - a.glow)));
    }
    if (screenLightRef.current) screenLightRef.current.intensity = a.glow * 9;
    if (vignetteRef.current) vignetteRef.current.darkness = VIGNETTE * (1 - a.cam);

    screen.draw({
      glow: a.glow,
      boot: a.boot,
      reveal: a.reveal,
      image: wallpaperRef.current,
      avatar: avatarRef.current,
      lock,
    });

    if (shadowFrames.current > 0) {
      gl.shadowMap.needsUpdate = true;
      shadowFrames.current -= 1;
    }

    // Câmera inicial: a mesa toda (paisagem) ou o notebook (retrato), com
    // paralaxe do mouse. Na entrada, ela vem de mais longe e mais alto.
    const view = aspect >= 1 ? VIEW.landscape : VIEW.portrait;
    const idleDistance =
      fitDistance({ width: view.width, height: view.height, fov: FOV, aspect }) *
      (1 + 0.75 * (1 - a.enter));
    vectors.offset.set(state.pointer.x * 0.6, state.pointer.y * 0.3 + (1 - a.enter) * 2.5, 0);
    vectors.start
      .copy(view.direction)
      .multiplyScalar(idleDistance)
      .add(view.target)
      .add(vectors.offset.multiplyScalar(1 - a.cam));

    // Câmera final: de frente para a tela, à distância que faz ela COBRIR o viewport.
    const distance =
      coverDistance({ planeWidth: SCREEN.w, planeHeight: SCREEN.h, fov: FOV, aspect }) * OVERSCAN;
    vectors.end.copy(SCREEN_NORMAL).multiplyScalar(distance).add(SCREEN_CENTER);

    const t = a.cam;
    camera.position.lerpVectors(vectors.start, vectors.end, t);
    vectors.target.lerpVectors(view.target, SCREEN_CENTER, t);
    camera.lookAt(vectors.target);
  });

  return (
    <ShadowContext value={invalidateShadows}>
      <color attach="background" args={[lights.background]} />
      <hemisphereLight args={lights.hemisphere} />
      <directionalLight
        position={WINDOW_LIGHT_POSITION}
        color={lights.window[0]}
        intensity={lights.window[1]}
        castShadow={!isDark}
        shadow-mapSize={lite ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-far={60}
      />
      {/* A luz da tela acesa se espalha pelo teclado e pela mesa. */}
      <primitive object={screenLightTarget} />
      <spotLight
        ref={screenLightRef}
        position={SCREEN_LIGHT_POSITION}
        target={screenLightTarget}
        color="#a9b8ff"
        intensity={0}
        angle={1.2}
        penumbra={1}
        decay={2}
        distance={9}
      />

      <Room isDark={isDark} />
      <Desk />
      <DeskLamp
        on={lampOn}
        castShadow={isDark}
        shadowSize={lite ? 512 : 1024}
        onToggle={() => setLampOverride(!lampOn)}
        interaction={interaction('lamp')}
      />
      {!lite && <Plant />}

      <Interactive
        {...interaction('laptop')}
        labelPosition={[0, 1.1, 0.4]}
        onActivate={() => onOpen(null)}
      >
        <Laptop
          theme={theme}
          lidRef={lidRef}
          ledRef={ledRef}
          screenTexture={screen.texture}
          logoTexture={logoTexture}
        />
      </Interactive>

      <Books interaction={interaction('books')} onActivate={shortcut('books')} />
      <ResumePaper
        locale={locale}
        interaction={interaction('resume')}
        onActivate={shortcut('resume')}
      />
      <Phone interaction={interaction('phone')} onActivate={shortcut('phone')} />
      <Mug reducedSteam={lite} />
      <Figure interaction={interaction('figure')} onActivate={shortcut('figure')} />
      <TennisRacket interaction={interaction('racket')} onActivate={shortcut('racket')} />
      <GaloFrame interaction={interaction('frame')} onActivate={shortcut('frame')} />

      {/* Luz ambiente e reflexos de uma sala de verdade (HDRI do Poly Haven, 512×256). */}
      <Environment files={lights.hdri} environmentIntensity={lights.environment} />

      {/* Acabamento: brilho só no que passa de 1 (lâmpada, rua), cantos escurecidos
          (somem quando a câmera entra na tela) e tone mapping neutro, que mantém as
          cores da tela de bloqueio iguais às do HTML. Sem AO: o N8AO custava ~80 KB. */}
      <EffectComposer multisampling={lite ? 0 : 4}>
        <Bloom luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.5} mipmapBlur />
        <Vignette ref={vignetteRef} offset={0.3} darkness={VIGNETTE} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    </ShadowContext>
  );
}
