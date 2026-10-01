import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { getAppMeta, isAppId } from '../../lib/apps-meta.js';
import { canRunIntro, markIntroSeen } from '../../lib/boot.js';
import { useIsMobile, useReducedMotion } from '../../lib/hooks.js';
import { registerRouter } from '../../lib/os-bridge.js';
import { useOS } from '../../lib/os-store.js';
import { siteConfig } from '../../site.config.js';
import { IntroFallback } from '../intro/IntroFallback.jsx';
import { BootScreen } from './BootScreen.jsx';
import { DesktopShell } from './DesktopShell.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { MobileShell } from './MobileShell.jsx';
import { PowerOffScreen } from './PowerOffScreen.jsx';

// O 3D (three, R3F, drei, GSAP) só é baixado se a intro for rodar.
const Intro = lazy(() => import('../intro/Intro.jsx'));

/**
 * Raiz do sistema. Fica montada no layout de /{locale}: trocar de app ou
 * de idioma não a remonta.
 */
export function OS({ locale, appId }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const phase = useOS((state) => state.phase);
  const introMode = useOS((state) => state.introMode);
  const setPhase = useOS((state) => state.setPhase);

  useEffect(() => {
    registerRouter({ navigate, locale, pathname, search });
  }, [navigate, locale, pathname, search]);

  useDocumentMeta(locale, appId, isMobile);

  const finishIntro = useCallback(() => {
    markIntroSeen();
    setPhase('desktop');
  }, [setPhase]);

  const skipIntro = useCallback(() => {
    markIntroSeen();
    setPhase('boot');
  }, [setPhase]);

  const finishBoot = useCallback(() => setPhase('desktop'), [setPhase]);

  // Movimento reduzido ligado no meio da intro: pula para o boot.
  useEffect(() => {
    if (phase === 'intro' && (reducedMotion || !canRunIntro())) {
      setPhase(introMode === 'shutdown' ? 'off' : 'boot');
    }
  }, [phase, introMode, reducedMotion, setPhase]);

  return (
    <div className="fixed inset-0" data-reduced-motion={reducedMotion}>
      {phase === 'desktop' &&
        (isMobile ? (
          <MobileShell locale={locale} appId={appId} />
        ) : (
          <DesktopShell locale={locale} appId={appId} />
        ))}

      {phase === 'boot' && <BootScreen onDone={finishBoot} />}
      {phase === 'off' && <PowerOffScreen onPowerOn={finishBoot} />}

      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[100]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ErrorBoundary fallback={null} onError={skipIntro}>
              <Suspense fallback={<IntroFallback onSkip={skipIntro} />}>
                <Intro mode={introMode} onDone={finishIntro} onSkip={skipIntro} />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Título e descrição da página por idioma e por app em foco. */
function useDocumentMeta(locale, appId, isMobile) {
  const { t } = useTranslation();
  const focusedAppId = useOS(
    (state) => state.windows.find((win) => win.id === state.focusedId)?.appId,
  );
  const activeApp = isMobile ? appId : (focusedAppId ?? appId);

  useEffect(() => {
    const name = siteConfig.author.name;
    document.title =
      activeApp && isAppId(activeApp)
        ? t('meta.appTitle', { app: getAppMeta(activeApp).title[locale], name })
        : t('meta.title', { system: siteConfig.system.name, name });
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        activeApp && isAppId(activeApp)
          ? getAppMeta(activeApp).description[locale]
          : t('meta.description', { name }),
      );
  }, [activeApp, locale, t]);
}
