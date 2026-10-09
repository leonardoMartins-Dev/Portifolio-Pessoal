import { ArrowRight, Bot } from 'lucide-react';
import { motion, useIsPresent } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profile } from '../../content/profile.js';
import { fetchAssistantAvailability } from '../../lib/ai/availability.js';
import { blurredCanvas } from '../../lib/blur.js';
import { getAppMeta, isAppId } from '../../lib/apps-meta.js';
import { formatLongDate, formatTime } from '../../lib/format.js';
import { useIsMobile, useLocale, useNow, useReducedMotion } from '../../lib/hooks.js';
import { useOS } from '../../lib/os-store.js';
import { getWallpaper, isLightWallpaper } from '../../lib/wallpapers.js';
import { siteConfig } from '../../site.config.js';
import { Avatar } from '../ui/Avatar.jsx';
import { LocaleToggle } from './LocaleToggle.jsx';

// Teclas que não destravam: navegação e modificadores.
const IGNORED_KEYS = new Set(['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn']);

function useAssistantAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    fetchAssistantAvailability().then((value) => active && setAvailable(value));
    return () => {
      active = false;
    };
  }, []);
  return available;
}

/** O papel de parede desfocado como imagem pequena (null até carregar: fica a cor de base). */
function useBlurredWallpaper(src) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (active) setUrl(blurredCanvas(image).toDataURL());
    };
    image.src = src;
    return () => {
      active = false;
      image.onload = null;
    };
  }, [src]);
  return url;
}

function variants(reduced) {
  const shift = (y) => (reduced ? 0 : y);
  return {
    screen: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.35 } },
      exit: { opacity: 0, transition: { duration: 0.45, delay: reduced ? 0 : 0.12 } },
    },
    top: {
      hidden: { opacity: 0, y: shift(-12) },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      exit: { opacity: 0, y: shift(-56), transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } },
    },
    bottom: {
      hidden: { opacity: 0, y: shift(12) },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      exit: { opacity: 0, y: shift(40), transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } },
    },
    notification: {
      hidden: { opacity: 0, y: shift(-10), scale: reduced ? 1 : 0.97 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { delay: 0.7, duration: 0.35 } },
      exit: { opacity: 0, y: shift(-56), transition: { duration: 0.3 } },
    },
  };
}

/**
 * Tela de bloqueio (sem senha): papel de parede desfocado, relógio, foto e
 * nome do autor. Clique ou qualquer tecla entra. O sistema fica montado por
 * baixo, então ao sair o desfoque "se desfaz" revelando o desktop.
 */
export function LockScreen({ onUnlock }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const isPresent = useIsPresent();
  const now = useNow(5_000);
  const wallpaper = getWallpaper(useOS((state) => state.wallpaper));
  const pendingApp = useOS((state) => state.pendingApp);
  const fromDesktop = useOS((state) => state.lockedFromDesktop);
  const assistantAvailable = useAssistantAvailable();
  const blurred = useBlurredWallpaper(wallpaper.src);
  const enterRef = useRef(null);
  const motionVariants = useMemo(() => variants(reduced), [reduced]);

  useEffect(() => {
    enterRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!isPresent) return;
    function onKeyDown(event) {
      if (event.defaultPrevented || event.repeat || IGNORED_KEYS.has(event.key)) return;
      // Enter/Espaço num botão (idioma, notificação, Entrar) ficam com o próprio botão.
      if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('button')) return;
      event.preventDefault();
      onUnlock();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPresent, onUnlock]);

  const pendingTitle = isAppId(pendingApp) ? getAppMeta(pendingApp).title[locale] : null;

  function openAssistant(event) {
    event.stopPropagation();
    useOS.getState().setPendingApp('assistant');
    onUnlock();
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t('lock.label', { system: siteConfig.system.name })}
      variants={motionVariants.screen}
      // Vindo da página inicial, a tela já está desenhada no monitor 3D: aparece sem fade.
      initial={fromDesktop ? 'hidden' : 'visible'}
      animate="visible"
      exit="exit"
      onClick={onUnlock}
      style={{ backgroundColor: wallpaper.base }}
      className={`fixed inset-0 z-[90] cursor-default overflow-hidden text-white select-none ${
        isPresent ? '' : 'pointer-events-none'
      }`}
    >
      {blurred && (
        <img src={blurred} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
      )}
      <div
        aria-hidden
        className={`absolute inset-0 ${isLightWallpaper(wallpaper) ? 'bg-black/45' : 'bg-black/25'}`}
      />

      <div
        className="absolute top-3 right-3 z-10 safe-top"
        onClick={(event) => event.stopPropagation()}
      >
        <LocaleToggle inverse />
      </div>

      <div className="relative flex h-full flex-col items-center px-6 safe-top safe-bottom text-center [text-shadow:0_1px_12px_rgb(0_0_0/0.25)]">
        <motion.div variants={motionVariants.top} className="mt-[9vh] flex flex-col items-center">
          <p className="text-lg font-medium text-white/90 first-letter:uppercase sm:text-xl">
            {formatLongDate(now, locale)}
          </p>
          <time
            dateTime={now.toISOString()}
            className="text-[clamp(4.5rem,15vw,8.5rem)] leading-none font-semibold tracking-tight tabular-nums"
          >
            {formatTime(now, locale)}
          </time>
        </motion.div>

        {assistantAvailable && (
          <motion.button
            type="button"
            variants={motionVariants.notification}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={openAssistant}
            className="mt-8 flex w-[min(100%,360px)] items-start gap-3 rounded-2xl border border-white/15 bg-white/15 p-3 text-left transition-colors [text-shadow:none] hover:bg-white/25"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-accent to-[#2b2f6b]">
              <Bot aria-hidden className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2 text-[13px]">
                <span className="font-semibold">{t('lock.notification.app')}</span>
                <span className="text-white/70">{t('lock.notification.time')}</span>
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-white/90">
                {t('lock.notification.body', { name: siteConfig.author.firstName })}
              </span>
            </span>
          </motion.button>
        )}

        <div className="flex-1" />

        <motion.div
          variants={motionVariants.bottom}
          className="mb-[7vh] flex flex-col items-center gap-2"
        >
          <Avatar className="size-20 ring-2 ring-white/40" textClassName="text-2xl" />
          <p className="mt-1 text-lg font-semibold">{profile.name}</p>
          <p className="max-w-[34ch] text-sm text-white/80">{profile.role[locale]}</p>
          <button
            ref={enterRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUnlock();
            }}
            className="mt-3 flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/15 px-5 text-sm font-medium transition-colors [text-shadow:none] hover:bg-white/25"
          >
            {pendingTitle ? t('lock.enterAndOpen', { app: pendingTitle }) : t('lock.enter')}
            <ArrowRight aria-hidden className="size-4" />
          </button>
          <p className="text-xs text-white/70">{isMobile ? t('lock.hintTouch') : t('lock.hint')}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
