import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, Vector3 } from 'three';
import { coverDistance } from '../../lib/camera-fit.js';
import { siteConfig } from '../../site.config.js';
import { Laptop } from './Laptop.jsx';
import { lidRotation, openScreenPose } from './laptop-geometry.js';
import { createLogoTexture, createScreen } from './screen-texture.js';

export const FOV = 35;
const IDLE_TARGET = new Vector3(0, 0.45, 0.1);
const IDLE_DIRECTION = new Vector3(0.62, 0.5, 0.9).normalize();
const IDLE_DISTANCE = 7.2;
// Distância × aspect que mantém o notebook inteiro na largura da tela.
const IDLE_FIT_WIDTH = 6.8;
const SCREEN_POSE = openScreenPose();
const SCREEN_CENTER = new Vector3(...SCREEN_POSE.center);
const SCREEN_NORMAL = new Vector3(...SCREEN_POSE.normal);
// Leve sobra para a borda da moldura nunca aparecer no enquadramento final.
const OVERSCAN = 0.985;

/** Carrega o papel de parede (o mesmo SVG do sistema) para desenhar na tela. */
function useWallpaperImage(src) {
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
 * Cena da intro. A animação é dirigida pelos números em `animRef` (tweenados
 * pelo GSAP em Intro.jsx); aqui eles viram rotação da tampa, brilho da tela
 * e posição da câmera, a cada quadro.
 */
export function Scene({ animRef, theme, wallpaperSrc, interactive, onOpen }) {
  const lidRef = useRef(null);
  const hovered = useRef(false);
  const screen = useMemo(() => createScreen({ initials: siteConfig.author.initials }), []);
  const logoTexture = useMemo(
    () => createLogoTexture({ initials: siteConfig.author.initials }),
    [],
  );
  const wallpaperRef = useWallpaperImage(wallpaperSrc);
  const vectors = useMemo(
    () => ({
      start: new Vector3(),
      end: new Vector3(),
      target: new Vector3(),
      offset: new Vector3(),
    }),
    [],
  );

  useEffect(
    () => () => {
      screen.dispose();
      logoTexture.dispose();
    },
    [screen, logoTexture],
  );

  useFrame((state, delta) => {
    const { camera, size } = state;
    const a = animRef.current;
    const aspect = size.width / size.height;

    // Dica no hover: a tampa levanta uns 4° (só com o notebook fechado).
    a.hover = MathUtils.damp(a.hover, interactive && hovered.current ? 1 : 0, 8, delta);
    if (lidRef.current) lidRef.current.rotation.x = lidRotation(a.lid, a.hover);

    screen.draw({
      glow: a.glow,
      boot: a.boot,
      reveal: a.reveal,
      image: wallpaperRef.current,
    });

    // Câmera inicial: vista 3/4 (mais afastada em telas estreitas, para o notebook
    // caber na largura), com parallax do mouse.
    const idleDistance = Math.max(IDLE_DISTANCE, IDLE_FIT_WIDTH / aspect);
    vectors.offset.set(state.pointer.x * 0.45, state.pointer.y * 0.25, 0);
    vectors.start
      .copy(IDLE_DIRECTION)
      .multiplyScalar(idleDistance)
      .add(IDLE_TARGET)
      .add(vectors.offset.multiplyScalar(1 - a.cam));

    // Câmera final: de frente para a tela, à distância que faz ela COBRIR o viewport.
    const distance =
      coverDistance({ planeWidth: 2.8, planeHeight: 1.75, fov: FOV, aspect }) * OVERSCAN;
    vectors.end.copy(SCREEN_NORMAL).multiplyScalar(distance).add(SCREEN_CENTER);

    const t = a.cam;
    camera.position.lerpVectors(vectors.start, vectors.end, t);
    vectors.target.lerpVectors(IDLE_TARGET, SCREEN_CENTER, t);
    camera.lookAt(vectors.target);
  });

  const isDark = theme === 'dark';

  return (
    <>
      <color attach="background" args={[isDark ? '#101116' : '#e6e8ee']} />
      <ambientLight intensity={isDark ? 0.55 : 0.5} />
      <directionalLight position={[3, 6, 4]} intensity={isDark ? 1.6 : 1.3} />
      {/* Luz de recorte: separa o notebook grafite do fundo escuro. */}
      <directionalLight position={[-4, 3, -5]} intensity={isDark ? 1.2 : 0.4} />

      <Laptop
        theme={theme}
        lidRef={lidRef}
        screenTexture={screen.texture}
        logoTexture={logoTexture}
        onPointerOver={(event) => {
          event.stopPropagation();
          hovered.current = true;
          if (interactive) document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          hovered.current = false;
          document.body.style.cursor = '';
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (interactive) onOpen();
        }}
      />

      <ContactShadows
        position={[0, -0.001, 0]}
        opacity={isDark ? 0.6 : 0.4}
        scale={9}
        blur={2.6}
        far={1.8}
        resolution={256}
        color="#000000"
      />

      {/* Iluminação de estúdio sem baixar HDR: o mapa de ambiente vem dos Lightformers. */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, -1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={8}
          />
          <Lightformer
            form="ring"
            color="#ffffff"
            intensity={0.6}
            position={[10, 10, 0]}
            scale={10}
            target
          />
        </group>
      </Environment>
    </>
  );
}
