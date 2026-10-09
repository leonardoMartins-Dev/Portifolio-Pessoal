import { Float, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaJava } from 'react-icons/fa6';
import {
  SiApachemaven,
  SiBootstrap,
  SiCss,
  SiGit,
  SiGithub,
  SiHtml5,
  SiIntellijidea,
  SiJavascript,
  SiMongodb,
  SiPostgresql,
  SiPostman,
  SiPython,
  SiReact,
  SiScrapy,
  SiSpringboot,
  SiSpringsecurity,
  SiSqlite,
  SiSupabase,
  SiThymeleaf,
  SiVite,
} from 'react-icons/si';
import { VscVscode } from 'react-icons/vsc';
import { AdditiveBlending, BackSide, DoubleSide, MathUtils, Vector3 } from 'three';
import { skillName, skills } from '../../content/skills.js';
import { useLocale, useReducedMotion } from '../../lib/hooks.js';
import { useResolvedTheme } from '../../lib/theme.js';
import { siteConfig } from '../../site.config.js';

/*
 * Skills num globo 3D que gira e pode ser arrastado (inspirado no
 * "Skills.json" de abdulmomin.dev). Adaptado do SkillsGlobe do portfólio do
 * prof. João Paulo Aramuni (github.com/joaopauloaramuni/joaopauloaramuni-portfolio,
 * licença MIT): pontos na espiral de Fibonacci e os ícones numa camada HTML
 * única, reposicionada a cada quadro (um <Html> do drei por ícone pesa mais).
 * Este arquivo (e o three.js) só é baixado quando o visitante escolhe o globo.
 */

// Logo e cor de cada skill (o `icon` de src/content/skills.js). A cor é a da
// marca clareada para o fundo escuro; no tema claro o CSS escurece. Sem cor,
// o logo usa a cor do texto (GitHub).
const BRANDS = {
  java: [FaJava, '#f0913a'],
  python: [SiPython, '#5a9fd4'],
  javascript: [SiJavascript, '#f7df1e'],
  html: [SiHtml5, '#e34f26'],
  css: [SiCss, '#3c99dc'],
  spring: [SiSpringboot, '#6db33f'],
  'spring-security': [SiSpringsecurity, '#6db33f'],
  thymeleaf: [SiThymeleaf, '#3fa34d'],
  react: [SiReact, '#61dafb'],
  bootstrap: [SiBootstrap, '#9b7fe0'],
  scrapy: [SiScrapy, '#60a839'],
  postgresql: [SiPostgresql, '#6b8fe8'],
  supabase: [SiSupabase, '#3ecf8e'],
  sqlite: [SiSqlite, '#44a8e0'],
  mongodb: [SiMongodb, '#47a248'],
  git: [SiGit, '#f05032'],
  github: [SiGithub, null],
  maven: [SiApachemaven, '#e5584a'],
  vite: [SiVite, '#9d8cff'],
  postman: [SiPostman, '#ff6c37'],
  intellij: [SiIntellijidea, '#fe315d'],
  vscode: [VscVscode, '#23a9f2'],
};

/** Skills com ícone (linguagens, frameworks, bancos e ferramentas), na ordem do conteúdo. */
const globeSkills = skills
  .filter((group) => group.layout === 'icons')
  .flatMap((group) => group.items)
  .filter((item) => item.icon);

const RADIUS = 3.3;
// Tamanho do ícone no CSS (ver o item abaixo): o quadro escala o item inteiro.
const ICON_PX = 40;

/** Espiral de Fibonacci: N pontos bem distribuídos numa esfera. */
function fibonacciSphere(count, radius) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (2 * (index + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * index;
    return new Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius);
  });
}

const world = new Vector3();
const direction = new Vector3();
const toCamera = new Vector3();
const ndc = new Vector3();
const view = new Vector3();

function Globe({ count, itemsRef, motion, light }) {
  const groupRef = useRef(null);
  const points = useMemo(() => fibonacciSphere(count, RADIUS), [count]);
  const shell = RADIUS * 0.85;
  // Ícone no mundo 3D: diminui conforme a quantidade de skills.
  const iconWorld = MathUtils.clamp((RADIUS * 0.8) / Math.sqrt(count), 0.32, 0.6);
  const accent = siteConfig.accentColor;

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const { camera, size } = state;

    // Enquadra o globo (com folga para os nomes) em qualquer proporção da janela.
    const vFov = MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / size.height));
    camera.position.setLength((RADIUS * 1.2) / Math.sin(Math.min(vFov, hFov) / 2));

    if (motion) group.rotation.y += delta * 0.06;
    group.updateWorldMatrix(true, false);
    camera.updateMatrixWorld();
    toCamera.copy(camera.position).normalize();
    const tanHalfFov = Math.tan(vFov / 2);

    // Projeta cada ponto na tela e move o ícone direto no DOM (sem re-render).
    points.forEach((point, index) => {
      const element = itemsRef.current[index];
      if (!element) return;
      world.copy(point).applyMatrix4(group.matrixWorld);
      // 1 = de frente para a câmera, 0 = atrás do globo.
      const front = MathUtils.clamp(
        (direction.copy(world).normalize().dot(toCamera) - 0.1) * 2,
        0,
        1,
      );
      ndc.copy(world).project(camera);
      const x = (ndc.x + 1) * 0.5 * size.width;
      const y = (1 - ndc.y) * 0.5 * size.height;
      const depth = -view.copy(world).applyMatrix4(camera.matrixWorldInverse).z;
      const pxPerUnit = size.height / (2 * tanHalfFov * depth);
      const scale = ((iconWorld * pxPerUnit) / ICON_PX) * (0.8 + 0.4 * front);

      element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
      element.style.opacity = String(front);
      element.style.zIndex = String(Math.round(front * 100));
      element.style.visibility = front < 0.02 ? 'hidden' : 'visible';
    });
  });

  return (
    <group ref={groupRef}>
      {/* Grade: a frente mais visível, o fundo bem fraco. */}
      <mesh>
        <icosahedronGeometry args={[shell, 2]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={light ? 0.3 : 0.14} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[shell, 2]} />
        <meshBasicMaterial
          color={accent}
          wireframe
          transparent
          opacity={light ? 0.1 : 0.04}
          side={BackSide}
        />
      </mesh>
      {/* Núcleo: escurece no tema escuro, clareia no claro. */}
      <mesh>
        <sphereGeometry args={[shell * 0.98, 32, 32]} />
        <meshBasicMaterial
          color={light ? '#ffffff' : '#000000'}
          transparent
          opacity={light ? 0.35 : 0.25}
          side={DoubleSide}
        />
      </mesh>
      {/* Halo (soma de luz). */}
      <mesh>
        <sphereGeometry args={[shell * 1.035, 32, 32]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.07}
          blending={AdditiveBlending}
          side={BackSide}
        />
      </mesh>
    </group>
  );
}

/** Globo das skills: arrastar gira; com movimento reduzido, ele só gira no arrasto. */
export default function SkillsGlobe() {
  const { t } = useTranslation();
  const locale = useLocale();
  const light = useResolvedTheme() === 'light';
  const motion = !useReducedMotion();
  const stageRef = useRef(null);
  const itemsRef = useRef([]);
  // Fora da tela (janela minimizada), o globo para de renderizar.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className="flex min-h-0 flex-1 flex-col">
      <div
        ref={stageRef}
        className="relative min-h-72 flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      >
        {/* eventSource = palco: o arrasto funciona também em cima dos ícones. */}
        <Canvas
          eventSource={stageRef}
          frameloop={visible ? 'always' : 'never'}
          camera={{ position: [0, 0, 9], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          aria-hidden
        >
          <Float
            speed={motion ? 1 : 0}
            rotationIntensity={motion ? 0.2 : 0}
            floatIntensity={motion ? 0.2 : 0}
          >
            <Globe count={globeSkills.length} itemsRef={itemsRef} motion={motion} light={light} />
          </Float>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={motion}
            autoRotateSpeed={0.8}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Canvas>

        {/* Os nomes vão para o leitor de tela pela lista abaixo; esta camada é só visual. */}
        <ul aria-hidden className="pointer-events-none absolute inset-0">
          {globeSkills.map((item, index) => {
            const [Icon, color] = BRANDS[item.icon] ?? [];
            const file = item.themed ? `${item.icon}-${light ? 'light' : 'dark'}` : item.icon;
            return (
              <li
                key={item.icon}
                ref={(element) => {
                  itemsRef.current[index] = element;
                }}
                className="absolute top-0 left-0 flex flex-col items-center gap-1.5 p-1 opacity-0 will-change-transform"
              >
                {Icon ? (
                  <Icon
                    className={`size-10 ${color ? '' : 'text-text'}`}
                    // No tema claro, a cor da marca escurece para manter o contraste.
                    style={
                      color
                        ? { color: light ? `color-mix(in oklab, ${color} 62%, black)` : color }
                        : undefined
                    }
                  />
                ) : (
                  <img src={`/skills/${file}.svg`} alt="" className="size-10" />
                )}
                <span className="text-[15px] leading-none font-semibold whitespace-nowrap text-muted">
                  {skillName(item, locale)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="sr-only">
        {globeSkills.map((item) => (
          <li key={item.icon}>{skillName(item, locale)}</li>
        ))}
      </ul>
      <figcaption className="mt-2 text-center text-xs text-muted">
        {t('skills.globeHint')}
      </figcaption>
    </figure>
  );
}
