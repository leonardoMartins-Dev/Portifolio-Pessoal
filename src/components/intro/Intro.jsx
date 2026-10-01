import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOS } from '../../lib/os-store.js';
import { useResolvedTheme } from '../../lib/theme.js';
import { getWallpaper } from '../../lib/wallpapers.js';
import { FOV, Scene } from './Scene.jsx';

// A sequência segue o relógio real: em aparelhos lentos ela pula quadros em vez
// de ficar em câmera lenta.
gsap.ticker.lagSmoothing(0);

/** Abrir: tampa → tela acende → boot → papel de parede, enquanto a câmera entra (~2,8s). */
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

/**
 * Intro 3D (§8): o notebook fechado; no clique (ou Enter/Espaço) a tampa
 * abre, o sistema liga e a câmera entra na tela. Em modo "shutdown" a
 * sequência toca ao contrário.
 */
export default function Intro({ mode, onDone, onSkip }) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const wallpaper = getWallpaper(useOS((state) => state.wallpaper));
  const shuttingDown = mode === 'shutdown';
  const [stage, setStage] = useState(shuttingDown ? 'shutting-down' : 'closed');
  const [dpr, setDpr] = useState(2);
  const anim = useRef(
    shuttingDown
      ? { lid: 1, glow: 1, boot: 1, reveal: 1, cam: 1, hover: 0 }
      : { lid: 0, glow: 0, boot: 0, reveal: 0, cam: 0, hover: 0 },
  );
  const timeline = useRef(null);
  const openButtonRef = useRef(null);

  const open = useCallback(() => {
    if (stage !== 'closed') return;
    setStage('opening');
    timeline.current?.kill();
    timeline.current = openTimeline(anim.current, onDone);
  }, [stage, onDone]);

  // Desligar: toca a sequência inversa e volta a esperar o clique.
  useEffect(() => {
    if (!shuttingDown) return;
    timeline.current = shutdownTimeline(anim.current, () => setStage('closed'));
  }, [shuttingDown]);

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

  return (
    <div
      className={`fixed inset-0 ${isDark ? 'bg-[#101116] text-white' : 'bg-[#e6e8ee] text-[#14161b]'}`}
    >
      <Canvas
        dpr={[1, dpr]}
        camera={{ fov: FOV, near: 0.05, far: 60, position: [4.5, 3.6, 6.6] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        aria-hidden
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onFallback={onSkip} flipflops={3} />
        <Scene
          animRef={anim}
          theme={theme}
          wallpaperSrc={wallpaper.src}
          interactive={stage === 'closed'}
          onOpen={open}
        />
      </Canvas>

      <button
        type="button"
        onClick={onSkip}
        className={`absolute top-4 right-4 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-md transition-colors ${
          isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
        }`}
      >
        {t('intro.skip')}
      </button>

      {stage === 'closed' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[12vh] flex justify-center">
          <button
            ref={openButtonRef}
            type="button"
            onClick={open}
            className={`pointer-events-auto animate-pulse rounded-full px-5 py-2.5 text-sm font-medium backdrop-blur-md ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            }`}
          >
            {t('intro.hint')}
            <span className="sr-only"> {t('intro.hintTarget')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
