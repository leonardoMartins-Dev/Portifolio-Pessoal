import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { getAppMeta, isAppId } from '../../lib/apps-meta.js';
import { rememberPhase } from '../../lib/boot.js';
import { useIsMobile, useReducedMotion } from '../../lib/hooks.js';
import { navigateToApp, registerRouter } from '../../lib/os-bridge.js';
import { useOS } from '../../lib/os-store.js';
import { siteConfig } from '../../site.config.js';
import { BootScreen } from './BootScreen.jsx';
import { DesktopShell } from './DesktopShell.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { LockScreen } from './LockScreen.jsx';
import { LandingFallback } from '../landing/LandingFallback.jsx';
import { MobileShell } from './MobileShell.jsx';

// A página inicial (e o 3D dela) só é baixada se o visitante passar por ela.
const Landing = lazy(() => import('../landing/Landing.jsx'));

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

  // F5 continua onde o visitante está: a sessão guarda se é a página inicial ou o
  // sistema, e a página inicial fica em /{locale} (um link de app abriria o sistema).
  useEffect(() => {
    rememberPhase(phase);
  }, [phase]);
  useEffect(() => {
    if (phase === 'intro' && appId) navigate(`/${locale}`, { replace: true });
  }, [phase, appId, locale, navigate]);

  // A página inicial termina na tela de bloqueio; `targetApp` vem dos atalhos dela (Ver projetos…).
  const finishIntro = useCallback(
    (targetApp = null) => {
      useOS.getState().setPendingApp(targetApp);
      setPhase('lock');
    },
    [setPhase],
  );

  const skipIntro = useCallback(() => setPhase('lock'), [setPhase]);

  const finishBoot = useCallback(() => setPhase('desktop'), [setPhase]);

  const unlock = useCallback(() => {
    if (useOS.getState().phase !== 'lock') return;
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

      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[100]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <ErrorBoundary fallback={null} onError={skipIntro}>
              <Suspense fallback={<LandingFallback onSkip={skipIntro} />}>
                <Landing mode={introMode} onDone={finishIntro} />
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
