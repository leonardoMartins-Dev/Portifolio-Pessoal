import { ChevronLeft, House } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { profile } from '../../content/profile.js';
import { isAppId, MAX_MOBILE_DOCK_APPS } from '../../lib/apps-meta.js';
import { apps, getApp } from '../../lib/apps.jsx';
import { splitDuration } from '../../lib/format.js';
import { useLocalized } from '../../lib/hooks.js';
import { useSpotify, useWakatime } from '../../lib/live-data.js';
import { returnToLanding } from '../../lib/os-bridge.js';
import { AppIcon } from '../ui/AppIcon.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { AppSkeleton } from './AppSkeleton.jsx';
import { Clock } from './Clock.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { LocaleToggle } from './LocaleToggle.jsx';
import { EqualizerBars } from './MiniPlayer.jsx';
import { NotFoundContent } from './NotFoundWindow.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { Wallpaper } from './Wallpaper.jsx';

/**
 * Shell do celular (< 768px): o sistema vira uma interface de telefone com os
 * mesmos apps. A URL manda: /{locale}/{appId} abre o app em tela cheia, e o
 * Voltar do navegador fecha.
 */
export function MobileShell({ locale, appId }) {
  const navigate = useNavigate();
  const location = useLocation();

  function openApp(id) {
    navigate(`/${locale}/${id}`, { state: { fromHome: true } });
  }

  function closeApp() {
    if (location.state?.fromHome) navigate(-1);
    else navigate(`/${locale}`, { replace: true });
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <Wallpaper />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40"
      />
      <StatusBar />
      <main className="scroll-area relative flex-1 overflow-y-auto px-4 pt-2 pb-6">
        <HomeScreen onOpen={openApp} />
      </main>
      <MobileDock onOpen={openApp} />

      <AnimatePresence>
        {appId && <MobileAppScreen key={appId} appId={appId} locale={locale} onBack={closeApp} />}
      </AnimatePresence>
    </div>
  );
}

/** Barra de status: relógio, a volta para a página inicial (o quarto 3D), idioma e tema. */
function StatusBar() {
  const { t } = useTranslation();
  return (
    <header
      aria-label={t('mobile.statusBar')}
      className="relative z-10 flex items-center justify-between gap-2 px-4 safe-top text-white"
    >
      <Clock compact className="py-3 text-sm font-semibold" />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={returnToLanding}
          className="mr-1 flex min-h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-[13px] font-semibold backdrop-blur-md transition-colors hover:bg-white/25"
        >
          <House aria-hidden className="size-4" />
          {t('mobile.landing')}
        </button>
        <LocaleToggle inverse />
        <ThemeToggle inverse />
      </div>
    </header>
  );
}

function HomeScreen({ onOpen }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const gridApps = apps.filter((app) => !app.inMobileDock);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-center gap-4 rounded-lg p-4 text-text glass">
        <Avatar className="size-16" textClassName="text-lg" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{profile.name}</h1>
          <p className="truncate text-sm text-muted">{l(profile.role)}</p>
        </div>
      </section>

      <Widgets onOpen={onOpen} />

      <section aria-labelledby="mobile-apps">
        <h2 id="mobile-apps" className="sr-only">
          {t('mobile.apps')}
        </h2>
        <ul className="grid grid-cols-4 gap-x-2 gap-y-5">
          {gridApps.map((app) => (
            <li key={app.id}>
              <button
                type="button"
                onClick={() => onOpen(app.id)}
                className="flex w-full flex-col items-center gap-1.5 rounded-md py-1"
              >
                <AppIcon app={app} size="lg" />
                <span className="line-clamp-2 w-full text-center text-[11px] leading-tight font-medium text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]">
                  {l(app.title)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Widgets opcionais: "Tocando agora" e "Tempo programando" (só se configurados). */
function Widgets({ onOpen }) {
  const { t } = useTranslation();
  const spotify = useSpotify();
  const wakatime = useWakatime();

  const track =
    spotify.status === 'ok' ? (spotify.data.nowPlaying?.track ?? spotify.data.recent?.[0]) : null;
  const playing = Boolean(spotify.data?.nowPlaying?.isPlaying);
  const coding = wakatime.status === 'ok' ? splitDuration(wakatime.data.totalSeconds) : null;

  if (!track && !coding) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {track && (
        <button
          type="button"
          onClick={() => onOpen('music')}
          className="flex min-h-24 flex-col justify-between gap-2 rounded-lg p-3 text-left text-text glass"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-ink uppercase">
            {playing && <EqualizerBars />}
            {playing ? t('mobile.nowPlaying') : t('mobile.lastPlayed')}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{track.title}</span>
            <span className="block truncate text-xs text-muted">{track.artists}</span>
          </span>
        </button>
      )}
      {coding && (
        <button
          type="button"
          onClick={() => onOpen('activity')}
          className="flex min-h-24 flex-col justify-between gap-2 rounded-lg p-3 text-left text-text glass"
        >
          <span className="text-[11px] font-semibold text-accent-ink uppercase">
            {t('mobile.codingTime')}
          </span>
          <span className="text-2xl font-semibold tabular-nums">
            {t('mobile.hoursShort', coding)}
          </span>
        </button>
      )}
    </div>
  );
}

function MobileDock({ onOpen }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const dockApps = apps.filter((app) => app.inMobileDock).slice(0, MAX_MOBILE_DOCK_APPS);

  return (
    <footer className="relative z-10 px-3 pb-2 safe-bottom">
      <nav aria-label={t('dock.label')} className="rounded-[26px] p-2.5 glass">
        <ul className="grid grid-cols-4 gap-2">
          {dockApps.map((app) => (
            <li key={app.id} className="flex justify-center">
              <button
                type="button"
                onClick={() => onOpen(app.id)}
                aria-label={l(app.title)}
                data-mobile-dock-app={app.id}
                className="rounded-[16px]"
              >
                <AppIcon app={app} size="lg" />
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}

/** App em tela cheia, com animação de subir e cabeçalho com voltar + título. */
function MobileAppScreen({ appId, locale, onBack }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const valid = isAppId(appId);
  const app = valid ? getApp(appId) : null;
  const AppComponent = app?.component;

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <motion.section
      role="dialog"
      aria-labelledby="mobile-app-title"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="fixed inset-0 z-30 flex flex-col bg-surface safe-top"
    >
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-1.5">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-11 items-center gap-0.5 rounded-sm pr-3 pl-1.5 text-[15px] text-accent-ink"
        >
          <ChevronLeft aria-hidden className="size-6" />
          {t('common.back')}
        </button>
        <h2
          ref={headingRef}
          id="mobile-app-title"
          tabIndex={-1}
          className="absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-[15px] font-semibold outline-none"
        >
          {valid ? l(app.title) : t('notFound.title')}
        </h2>
      </header>
      <div className="relative min-h-0 flex-1 safe-bottom">
        {valid ? (
          <ErrorBoundary>
            <Suspense fallback={<AppSkeleton />}>
              <AppComponent appId={appId} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <NotFoundContent path={appId} onBack={() => navigate(`/${locale}`, { replace: true })} />
        )}
      </div>
    </motion.section>
  );
}
