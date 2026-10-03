import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { getAppMeta, isAppId } from '../../lib/apps-meta.js';
import { canRunIntro, markIntroSeen } from '../../lib/boot.js';
import { useIsMobile, useReducedMotion } from '../../lib/hooks.js';
import { navigateToApp, registerRouter } from '../../lib/os-bridge.js';
import { useOS } from '../../lib/os-store.js';
import { siteConfig } from '../../site.config.js';
import { IntroFallback } from '../intro/IntroFallback.jsx';
import { BootScreen } from './BootScreen.jsx';
import { DesktopShell } from './DesktopShell.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { LockScreen } from './LockScreen.jsx';
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

  // A intro termina na tela de bloqueio; `targetApp` vem dos atalhos da mesa 3D.
  const finishIntro = useCallback(
    (targetApp = null) => {
      markIntroSeen();
      useOS.getState().setPendingApp(targetApp);
      setPhase('lock');
    },
    [setPhase],
  );

  const skipIntro = useCallback(() => {
    markIntroSeen();
    setPhase('lock');
  }, [setPhase]);

  const finishBoot = useCallback(() => setPhase('desktop'), [setPhase]);

  const powerOn = useCallback(() => setPhase('lock'), [setPhase]);

  const unlock = useCallback(() => {
    if (useOS.getState().phase !== 'lock') return;
    markIntroSeen();
    const pending = useOS.getState().unlock();
    if (pending) {
      navigateToApp(pending);
      return;
    }
    // Sem app pendente, o foco volta para a janela em foco (o `inert` sai neste mesmo render).
    requestAnimationFrame(() => {
      const { focusedId } = useOS.getState();
      if (focusedId) document.querySelector(`[data-window="${focusedId}"]`)?.focus();
    });
  }, []);

  // Movimento reduzido ligado no meio da intro: pula para a tela de bloqueio.
  useEffect(() => {
    if (phase === 'intro' && (reducedMotion || !canRunIntro())) {
      setPhase(introMode === 'shutdown' ? 'off' : 'lock');
    }
  }, [phase, introMode, reducedMotion, setPhase]);

  const locked = phase === 'lock';
  const showShell = phase === 'desktop' || locked;

  return (
    <div className="fixed inset-0" data-reduced-motion={reducedMotion}>
      {/* Bloqueado: o sistema continua montado por baixo, mas fora do alcance do teclado e dos leitores de tela. */}
      {showShell && (
        <div inert={locked}>
          {isMobile ? (
            <MobileShell locale={locale} appId={appId} />
          ) : (
            <DesktopShell locale={locale} appId={appId} />
          )}
        </div>
      )}

      <AnimatePresence>{locked && <LockScreen key="lock" onUnlock={unlock} />}</AnimatePresence>

      {phase === 'boot' && <BootScreen onDone={finishBoot} />}
      {phase === 'off' && <PowerOffScreen onPowerOn={powerOn} />}

      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[100]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
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
