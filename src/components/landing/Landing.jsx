import { ArrowDown, MousePointerClick } from 'lucide-react';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profile } from '../../content/profile.js';
import { canRunIntro } from '../../lib/boot.js';
import { useIsMobile, useLocale, useReducedMotion } from '../../lib/hooks.js';
import { useOS } from '../../lib/os-store.js';
import { useResolvedTheme } from '../../lib/theme.js';
import { getWallpaper } from '../../lib/wallpapers.js';
import { siteConfig } from '../../site.config.js';
import { ErrorBoundary } from '../os/ErrorBoundary.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { AboutSection } from './AboutSection.jsx';
import { ContactSection } from './ContactSection.jsx';
import { useActiveSection, useInView, scrollToTop } from './hooks.js';
import { LandingHeader } from './LandingHeader.jsx';
import { SkillsSection } from './SkillsSection.jsx';

// O 3D (three, R3F, drei, GSAP) baixa à parte: o texto da página aparece antes.
const RoomCanvas = lazy(() => import('./three/RoomCanvas.jsx'));

const SECTIONS = ['sobre', 'skills', 'contato'];

/**
 * Página inicial (§8): o quarto 3D do autor no topo e, rolando, Sobre,
 * Skills e Contato. Clicar no PC (ou no botão flutuante) leva a câmera até a
 * tela do monitor, que já mostra a tela de bloqueio do sistema; aí `onDone`
 * entra no sistema. Em modo "shutdown" a câmera sai da tela de volta ao quarto.
 */
export default function Landing({ mode = 'open', onDone }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useResolvedTheme();
  const isMobile = useIsMobile();
  const motion = !useReducedMotion();
  // "Desligar" e "Página inicial" começam dentro da tela do PC e saem para o quarto.
  const fromScreen = mode === 'shutdown' || mode === 'return';
  const [webgl, setWebgl] = useState(canRunIntro);
  // loading → idle → zooming; no "Desligar": loading → leaving → idle.
  const [stage, setStage] = useState(() => (webgl ? 'loading' : 'idle'));
  const [target, setTarget] = useState(null);
  const targetRef = useRef(null);
  const entering = useRef(false);
  const scrollRef = useRef(null);
  const heroRef = useRef(null);
  const heroVisible = useInView(heroRef, { rootRef: scrollRef });
  // O botão flutuante encolhe quando o topo sai da tela (o PC já não está à vista).
  const heroInFocus = useInView(heroRef, { rootRef: scrollRef, rootMargin: '-40% 0px -40% 0px' });
  const active = useActiveSection(SECTIONS, scrollRef);
  const wallpaperBase = getWallpaper(useOS((state) => state.wallpaper)).base;

  const insideScreen =
    stage === 'zooming' || stage === 'leaving' || (fromScreen && stage === 'loading');

  /** Entra no sistema (opcionalmente já abrindo um app depois da tela de bloqueio). */
  const enter = useCallback(
    (appId = null) => {
      if (entering.current) return;
      entering.current = true;
      targetRef.current = appId;
      setTarget(appId);
      // Sem a cena pronta (ou com movimento reduzido), entra direto.
      if (stage !== 'idle' || !webgl || !motion) {
        onDone(appId);
        return;
      }
      scrollToTop(scrollRef.current).then(() => setStage('zooming'));
    },
    [stage, webgl, motion, onDone],
  );

  const onReady = useCallback(() => {
    setStage(fromScreen && motion ? 'leaving' : 'idle');
  }, [fromScreen, motion]);
  const onZoomed = useCallback(() => onDone(targetRef.current), [onDone]);
  const onLeft = useCallback(() => setStage('idle'), []);
  const onSceneError = useCallback(() => {
    setWebgl(false);
    setStage('idle');
  }, []);

  const goTo = useCallback(
    (id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
    },
    [motion],
  );
  const goTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' });
  }, [motion]);

  const [first, second] = siteConfig.author.name.split(' ');

  return (
    <div
      ref={scrollRef}
      className={`landing fixed inset-0 bg-land-bg text-land-ink ${
        insideScreen ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto'
      }`}
    >
      <LandingHeader hidden={insideScreen} active={active} onNavigate={goTo} onTop={goTop} />

      <section
        ref={heroRef}
        aria-labelledby="hero-title"
        className="relative h-[100svh] min-h-[580px] overflow-hidden"
      >
        <div className={insideScreen ? 'fixed inset-0 z-40' : 'absolute inset-0'}>
          {/* Saindo da tela com a cena ainda baixando: a cor da tela de bloqueio segura a passagem. */}
          {fromScreen && stage === 'loading' && (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ backgroundColor: wallpaperBase }}
            />
          )}
          {/* Sem WebGL (ou em aparelho fraco): o mesmo quarto, parado (gerado pelo npm run screenshots). */}
          {!webgl && (
            <img
              src="/images/room.webp"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-[3%] mx-auto w-[min(100%,560px)] md:inset-x-auto md:top-[14%] md:right-[3vw] md:bottom-auto md:h-[82%] md:w-auto md:max-w-[62%] md:object-contain"
            />
          )}
          {webgl && (
            <ErrorBoundary fallback={false} onError={onSceneError}>
              <Suspense fallback={null}>
                <RoomCanvas
                  stage={stage}
                  mode={mode}
                  theme={theme}
                  visible={heroVisible}
                  motion={motion}
                  targetApp={target}
                  onReady={onReady}
                  onEnter={() => enter()}
                  onZoomed={onZoomed}
                  onLeft={onLeft}
                />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>

        {webgl && stage === 'loading' && !fromScreen && (
          <p
            role="status"
            className="absolute inset-x-0 bottom-[22svh] flex items-center justify-center gap-2 text-sm text-land-muted md:right-[8vw] md:bottom-1/2 md:left-auto"
          >
            <Spinner />
            {t('landing.room.loading')}
          </p>
        )}

        <div
          inert={insideScreen}
          className={`pointer-events-none relative z-10 flex h-full flex-col px-5 pt-[15svh] transition-opacity duration-300 sm:px-10 md:justify-center md:pt-0 lg:px-[7vw] ${
            insideScreen ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="pointer-events-auto w-fit max-w-xl">
            {profile.openToWork && (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-land-line bg-land-surface/80 px-3 py-1.5 text-[13px] font-semibold backdrop-blur-sm">
                <span aria-hidden className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-success/70 motion-reduce:hidden" />
                  <span className="relative size-2 rounded-full bg-success" />
                </span>
                {t('landing.hero.available')}
              </p>
            )}
            <h1
              id="hero-title"
              className="font-display text-[clamp(3.4rem,8.4vw,7rem)] leading-[0.88] font-extrabold tracking-[-0.035em]"
            >
              <span className="block">{first}</span>
              <span className="block">{second}</span>
              <span className="sr-only"> — {profile.tagline[locale]}</span>
            </h1>
            <p
              aria-hidden
              className="relative -mt-2 ml-[34%] w-fit -rotate-[5deg] bg-land-tag px-3 py-1.5 font-display text-[clamp(1.05rem,2.2vw,1.6rem)] font-extrabold tracking-[0.06em] whitespace-nowrap text-white uppercase shadow-md"
            >
              {profile.tagline[locale]}
            </p>
            <p className="mt-6 hidden max-w-sm text-[15px] leading-relaxed text-land-muted sm:block">
              {profile.role[locale]}
            </p>
          </div>
        </div>

        <button
          type="button"
          inert={insideScreen}
          onClick={() => goTo('sobre')}
          className={`absolute bottom-7 left-[7vw] z-10 hidden items-center gap-2 text-[13px] font-semibold text-land-muted transition-opacity hover:text-land-ink md:flex ${
            insideScreen ? 'opacity-0' : ''
          }`}
        >
          <ArrowDown aria-hidden className="size-4 motion-safe:animate-bounce" />
          {t('landing.hero.scroll')}
        </button>
      </section>

      <AboutSection rootRef={scrollRef} motion={motion} webgl={webgl} onEnter={enter} />
      <SkillsSection rootRef={scrollRef} webgl={webgl} onEnter={enter} />
      <ContactSection
        rootRef={scrollRef}
        motion={motion}
        theme={theme}
        webgl={webgl}
        onEnter={enter}
        onTop={goTop}
      />

      {/* Botão flutuante: o caminho acessível (e mais óbvio) para o PC. Longe do
          topo, vira um botão redondo no canto para não cobrir o conteúdo. */}
      <button
        type="button"
        inert={insideScreen}
        onClick={() => enter()}
        aria-label={heroInFocus ? undefined : t('landing.enterDirect')}
        title={heroInFocus ? undefined : t('landing.enterDirect')}
        className={`fixed z-30 flex items-center gap-3 rounded-full bg-land-ink text-left whitespace-nowrap text-land-bg shadow-[0_14px_34px_-10px_rgb(0_0_0/0.5)] transition-[opacity,translate] duration-300 hover:-translate-y-0.5 ${
          heroInFocus
            ? 'bottom-5 left-1/2 -translate-x-1/2 py-2 pr-5 pl-2 sm:bottom-7'
            : 'right-4 bottom-4 p-2 sm:right-6 sm:bottom-6'
        } ${insideScreen ? 'opacity-0' : 'opacity-100'}`}
      >
        <span className="relative grid size-10 place-items-center rounded-full bg-accent text-white">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-accent/50 [animation-duration:1.8s] motion-reduce:hidden"
          />
          <MousePointerClick aria-hidden className="relative size-[19px]" />
        </span>
        {heroInFocus && (
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold">
              {isMobile ? t('landing.enter.labelTouch') : t('landing.enter.label')}
            </span>
            <span className="text-xs opacity-70"> {t('landing.enter.hint')}</span>
          </span>
        )}
      </button>
    </div>
  );
}
