import { PerformanceMonitor, useProgress } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profile } from '../../content/profile.js';
import { getAppMeta } from '../../lib/apps-meta.js';
import { formatLongDate, formatTime } from '../../lib/format.js';
import { useIsMobile, useLocale, useNow } from '../../lib/hooks.js';
import { useOS } from '../../lib/os-store.js';
import { useResolvedTheme } from '../../lib/theme.js';
import { getWallpaper, isLightWallpaper } from '../../lib/wallpapers.js';
import { preloadModels } from './desk/models.js';
import { DESK_SHORTCUTS, SHORTCUT_APPS } from './desk-objects.js';
import { FOV, Scene } from './Scene.jsx';

// A sequência segue o relógio real: em aparelhos lentos ela pula quadros em vez
// de ficar em câmera lenta.
gsap.ticker.lagSmoothing(0);

// Os modelos começam a baixar assim que este chunk carrega.
preloadModels({ plant: !globalThis.matchMedia?.('(max-width: 767.98px)').matches });

// Desempenho baixo com a mesa parada: abaixo de 40 fps a resolução cai para 1x;
// se nem assim passar de 20 fps, a intro é pulada. Não use o `flipflops` do
// drei: ele conta também as subidas e, numa máquina folgada, pulava a intro
// sozinho depois de uns 10s.
const MIN_FPS = { full: 40, lowRes: 20 };

/** Entrada: a cena aparece e a câmera se aproxima devagar da mesa. */
function enterTimeline(anim, onComplete) {
  return gsap.timeline({ onComplete }).to(anim, { enter: 1, duration: 2.4, ease: 'power2.out' });
}

/** Abrir: tampa → tela acende → boot → tela de bloqueio, enquanto a câmera entra (~2,8s). */
function openTimeline(anim, onComplete) {
  return gsap
    .timeline({ onComplete })
    .to(anim, { lid: 1, duration: 1.1, ease: 'power2.inOut' }, 0)
    .to(anim, { glow: 1, duration: 0.35, ease: 'power1.out' }, 0.75)
    .to(anim, { boot: 1, duration: 1.0, ease: 'power1.inOut' }, 1.0)
    .to(anim, { reveal: 1, duration: 0.35, ease: 'power1.out' }, 2.0)
    .to(anim, { cam: 1, duration: 1.3, ease: 'power3.inOut' }, 1.5);
}

/** Desligar: a sequência ao contrário — câmera recua, tela apaga, tampa fecha. */
function shutdownTimeline(anim, onComplete) {
  return gsap
    .timeline({ onComplete })
    .to(anim, { cam: 0, duration: 1.2, ease: 'power3.inOut' }, 0)
    .to(anim, { glow: 0, duration: 0.4, ease: 'power1.in' }, 1.0)
    .to(anim, { lid: 0, duration: 1.0, ease: 'power2.inOut' }, 1.35)
    .set(anim, { boot: 0, reveal: 0 });
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Intro 3D (§8): o canto de trabalho do autor. No clique no notebook (ou
 * Enter/Espaço) a tampa abre, o sistema liga na tela de bloqueio e a câmera
 * entra na tela. Os objetos da mesa são atalhos para apps. Em modo
 * "shutdown" a sequência toca ao contrário.
 */
export default function Intro({ mode, onDone, onSkip }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useResolvedTheme();
  const isMobile = useIsMobile();
  const now = useNow(5_000);
  const { progress } = useProgress();
  const wallpaper = getWallpaper(useOS((state) => state.wallpaper));
  const shuttingDown = mode === 'shutdown';
  // loading → entering → closed → opening; no desligar: loading → shutting-down → closed.
  const [stage, setStage] = useState('loading');
  const [target, setTarget] = useState(null);
  const [dpr, setDpr] = useState(2);
  // Terminou (ou foi pulada): a cena para de renderizar enquanto a intro some.
  const [frozen, setFrozen] = useState(false);
  const anim = useRef(
    shuttingDown
      ? { enter: 1, lid: 1, glow: 1, boot: 1, reveal: 1, cam: 1, hover: 0 }
      : { enter: 0, lid: 0, glow: 0, boot: 0, reveal: 0, cam: 0, hover: 0 },
  );
  const timeline = useRef(null);
  const openButtonRef = useRef(null);

  const appLabel = useCallback(
    (appId) => t('intro.openApp', { app: getAppMeta(appId).title[locale] }),
    [t, locale],
  );

  const labels = useMemo(
    () => ({
      laptop: t('intro.openLaptop'),
      lamp: t('intro.lamp'),
      ...Object.fromEntries(
        Object.entries(DESK_SHORTCUTS).map(([id, appId]) => [id, appLabel(appId)]),
      ),
    }),
    [t, appLabel],
  );

  // O que a tela do notebook desenha antes da câmera chegar: a tela de bloqueio.
  const lock = useMemo(
    () => ({
      time: formatTime(now, locale),
      date: capitalize(formatLongDate(now, locale)),
      name: profile.name,
      role: profile.role[locale],
      enter: target
        ? t('lock.enterAndOpen', { app: getAppMeta(target).title[locale] })
        : t('lock.enter'),
      hint: isMobile ? t('lock.hintTouch') : t('lock.hint'),
      dim: isLightWallpaper(wallpaper) ? 0.45 : 0.25,
    }),
    [now, locale, target, isMobile, wallpaper, t],
  );

  const onReady = useCallback(() => {
    setStage(shuttingDown ? 'shutting-down' : 'entering');
    timeline.current?.kill();
    timeline.current = shuttingDown
      ? shutdownTimeline(anim.current, () => setStage('closed'))
      : enterTimeline(anim.current, () => setStage('closed'));
  }, [shuttingDown]);

  const open = useCallback(
    (appId = null) => {
      if (stage !== 'closed') return;
      setStage('opening');
      setTarget(appId);
      timeline.current?.kill();
      timeline.current = openTimeline(anim.current, () => {
        setFrozen(true);
        onDone(appId);
      });
    },
    [stage, onDone],
  );

  const skip = useCallback(() => {
    setFrozen(true);
    onSkip();
  }, [onSkip]);

  useEffect(() => () => timeline.current?.kill(), []);

  // Enter/Espaço também abrem.
  useEffect(() => {
    if (stage !== 'closed') return;
    openButtonRef.current?.focus();
    function onKeyDown(event) {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest?.('button')) {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage, open]);

  const isDark = theme === 'dark';
  const pill = isDark
    ? 'bg-black/45 text-white hover:bg-black/60'
    : 'bg-white/75 text-[#14161b] shadow-sm hover:bg-white/90';

  return (
    <div
      className={`fixed inset-0 ${isDark ? 'bg-[#06070b] text-white' : 'bg-[#dfe4ec] text-[#14161b]'}`}
    >
      <Canvas
        dpr={[1, isMobile ? Math.min(dpr, 1.5) : dpr]}
        shadows="percentage"
        frameloop={frozen ? 'never' : 'always'}
        camera={{ fov: FOV, near: 0.05, far: 120, position: [6, 9, 22] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        // As sombras só são recalculadas quando algo se mexe (ver Scene).
        onCreated={({ gl }) => {
          gl.shadowMap.autoUpdate = false;
        }}
        aria-hidden
      >
        {/* Só mede com a mesa parada: o carregamento trava quadros, e pular no
            meio da abertura perderia o app escolhido. */}
        {stage === 'closed' && (
          <PerformanceMonitor
            bounds={() => [dpr > 1 ? MIN_FPS.full : MIN_FPS.lowRes, Infinity]}
            onDecline={() => (dpr > 1 ? setDpr(1) : skip())}
          />
        )}
        <Suspense fallback={null}>
          <Scene
            animRef={anim}
            theme={theme}
            wallpaperSrc={wallpaper.src}
            locale={locale}
            lock={lock}
            labels={labels}
            interactive={stage === 'closed'}
            lite={isMobile}
            onOpen={open}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>

      {/* Véu: a cena surge do escuro quando termina de carregar. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-1000 ${
          stage === 'loading' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {stage === 'loading' && (
        <p
          role="status"
          className="absolute inset-x-0 bottom-[12vh] text-center text-sm text-white/70 tabular-nums"
        >
          {t('intro.loadingProgress', { progress: Math.round(progress) })}
        </p>
      )}

      <button
        type="button"
        onClick={skip}
        className={`absolute top-4 right-4 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-md transition-colors ${
          stage === 'loading' ? 'bg-white/10 text-white hover:bg-white/20' : pill
        }`}
      >
        {t('intro.skip')}
      </button>

      {stage === 'closed' && (
        <>
          {/* Os atalhos da mesa, também pelo teclado (aparecem ao receber foco). */}
          <nav
            aria-label={t('intro.shortcuts')}
            className="absolute top-4 left-4 flex flex-col gap-2"
          >
            {SHORTCUT_APPS.map((appId) => (
              <button
                key={appId}
                type="button"
                onClick={() => open(appId)}
                className={`sr-only rounded-full px-4 py-2 text-sm font-medium backdrop-blur-md focus:not-sr-only ${pill}`}
              >
                {appLabel(appId)}
              </button>
            ))}
          </nav>

          <div className="pointer-events-none absolute inset-x-0 bottom-[8vh] flex justify-center">
            <button
              ref={openButtonRef}
              type="button"
              onClick={() => open()}
              className={`pointer-events-auto animate-pulse rounded-full px-5 py-2.5 text-sm font-medium backdrop-blur-md ${pill}`}
            >
              {isMobile ? t('intro.hintTouch') : t('intro.hint')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
