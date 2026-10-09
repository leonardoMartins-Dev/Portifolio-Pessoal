import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NeutralToneMapping } from 'three';
import { profile } from '../../../content/profile.js';
import { getAppMeta } from '../../../lib/apps-meta.js';
import { formatLongDate, formatTime } from '../../../lib/format.js';
import { useIsMobile, useLocale, useNow } from '../../../lib/hooks.js';
import { useOS } from '../../../lib/os-store.js';
import { getWallpaper, isLightWallpaper } from '../../../lib/wallpapers.js';
import { FOV, RoomScene } from './RoomScene.jsx';

// A sequência segue o relógio real: em aparelhos lentos ela pula quadros em vez
// de ficar em câmera lenta.
gsap.ticker.lagSmoothing(0);

/** Zoom até a tela. Com o monitor desligado (depois do "Desligar"), ele liga e faz o boot no caminho. */
function zoomTimeline(anim, onComplete) {
  const timeline = gsap.timeline({ onComplete });
  if (anim.glow < 1) {
    timeline
      .to(anim, { glow: 1, duration: 0.3, ease: 'power1.out' }, 0)
      .to(anim, { boot: 1, duration: 0.9, ease: 'power1.inOut' }, 0.2)
      .to(anim, { reveal: 1, duration: 0.35, ease: 'power1.out' }, 1.1)
      .to(anim, { zoom: 1, duration: 1.7, ease: 'power3.inOut' }, 0.15);
  } else {
    timeline.to(anim, { zoom: 1, duration: 1.6, ease: 'power3.inOut' }, 0);
  }
  return timeline;
}

/** A câmera sai da tela de volta para o quarto; no "Desligar", o monitor apaga no fim. */
function leaveTimeline(anim, { powerOff }, onComplete) {
  const timeline = gsap
    .timeline({ onComplete })
    .to(anim, { zoom: 0, duration: 1.5, ease: 'power3.inOut' }, 0.1);
  if (powerOff) {
    timeline
      .to(anim, { glow: 0, duration: 0.5, ease: 'power1.in' }, 1.3)
      .set(anim, { boot: 0, reveal: 0 });
  }
  return timeline;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Cena 3D do topo da página inicial (carregada sob demanda). `stage` vem da
 * página: 'loading' | 'idle' | 'zooming' | 'leaving'. `mode` ('open' | 'return' |
 * 'shutdown') diz se a câmera começa no quarto ou dentro da tela. No clique no PC chama
 * `onEnter`; quando o zoom termina, `onZoomed`; quando a saída termina, `onLeft`.
 */
export default function RoomCanvas({
  stage,
  mode,
  theme,
  visible,
  motion,
  targetApp,
  onReady,
  onEnter,
  onZoomed,
  onLeft,
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const isMobile = useIsMobile();
  const now = useNow(5_000);
  const wallpaper = getWallpaper(useOS((state) => state.wallpaper));
  const powerOff = mode === 'shutdown';
  const fromScreen = powerOff || mode === 'return';
  const [dpr, setDpr] = useState(2);
  const anim = useRef(
    fromScreen
      ? { enter: 1, zoom: motion ? 1 : 0, glow: powerOff && !motion ? 0 : 1, boot: 1, reveal: 1 }
      : { enter: motion ? 0 : 1, zoom: 0, glow: 1, boot: 1, reveal: 1 },
  );
  const timeline = useRef(null);
  const callbacks = useRef({ onReady, onZoomed, onLeft });
  useEffect(() => {
    callbacks.current = { onReady, onZoomed, onLeft };
  });

  // O que o monitor do sistema mostra: a tela de bloqueio (igual à do HTML).
  const lock = useMemo(
    () => ({
      time: formatTime(now, locale),
      date: capitalize(formatLongDate(now, locale)),
      name: profile.name,
      role: profile.role[locale],
      enter: targetApp
        ? t('lock.enterAndOpen', { app: getAppMeta(targetApp).title[locale] })
        : t('lock.enter'),
      hint: isMobile ? t('lock.hintTouch') : t('lock.hint'),
      dim: isLightWallpaper(wallpaper) ? 0.45 : 0.25,
    }),
    [now, locale, targetApp, isMobile, wallpaper, t],
  );
  const notes = useMemo(() => [t('landing.room.note1'), t('landing.room.note2')], [t]);

  const handleReady = useCallback(() => {
    timeline.current?.kill();
    if (fromScreen && motion) {
      timeline.current = leaveTimeline(anim.current, { powerOff }, () =>
        callbacks.current.onLeft(),
      );
    } else if (motion) {
      timeline.current = gsap.to(anim.current, { enter: 1, duration: 2.2, ease: 'power2.out' });
    }
    callbacks.current.onReady();
  }, [fromScreen, powerOff, motion]);

  useEffect(() => {
    if (stage !== 'zooming') return;
    timeline.current?.kill();
    timeline.current = zoomTimeline(anim.current, () => callbacks.current.onZoomed());
  }, [stage]);

  useEffect(() => () => timeline.current?.kill(), []);

  const animating = stage === 'zooming' || stage === 'leaving';

  return (
    <Canvas
      dpr={[1, isMobile ? Math.min(dpr, 1.5) : dpr]}
      shadows="percentage"
      frameloop={visible || animating ? 'always' : 'never'}
      camera={{ fov: FOV, near: 0.5, far: 200, position: [-20, 24, 48] }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: NeutralToneMapping,
        powerPreference: 'high-performance',
      }}
      aria-hidden
    >
      {/* Só mede com a cena parada: o carregamento e o zoom travam quadros. */}
      {stage === 'idle' && (
        <PerformanceMonitor bounds={() => [40, Infinity]} onDecline={() => setDpr(1)} />
      )}
      <Suspense fallback={null}>
        <RoomScene
          animRef={anim}
          theme={theme}
          wallpaperSrc={wallpaper.src}
          lock={lock}
          notes={notes}
          interactive={stage === 'idle'}
          motion={motion}
          showHint={stage === 'idle' && !isMobile}
          hintLabel={t('landing.room.hint')}
          onEnter={onEnter}
          onReady={handleReady}
        />
      </Suspense>
    </Canvas>
  );
}
