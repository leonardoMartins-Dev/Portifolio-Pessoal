import { Download, MapPin, MonitorUp } from 'lucide-react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { profile } from '../../content/profile.js';
import { useLocalized } from '../../lib/hooks.js';
import { siteConfig } from '../../site.config.js';
import { Avatar } from '../ui/Avatar.jsx';
import { LazyScene } from './parts.jsx';

const FigureCanvas = lazy(() => import('./three/FigureCanvas.jsx'));

/** Cartão do holograma, com a linha que o liga ao boneco (no computador). */
function HoloCard({ side, children }) {
  return (
    <div className="relative w-full max-w-sm rounded-xl border border-[#74d6ff]/40 bg-[#0c2f86]/60 p-4 font-mono text-[13px] leading-relaxed text-[#e2f5ff] shadow-[0_0_40px_-14px_rgb(95_208_255/0.7)] backdrop-blur-sm">
      {children}
      <span
        aria-hidden
        className={`absolute top-1/2 hidden h-px w-14 bg-[#74d6ff]/60 lg:block ${
          side === 'left' ? '-right-14' : '-left-14'
        }`}
      >
        <span
          className={`absolute -top-[3px] size-[7px] rounded-full bg-[#74d6ff] shadow-[0_0_8px_#74d6ff] ${
            side === 'left' ? 'right-0' : 'left-0'
          }`}
        />
      </span>
    </div>
  );
}

/** Sem WebGL: a foto do autor no lugar do holograma. */
function PhotoFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Avatar className="size-48 ring-4 ring-[#74d6ff]/50" textClassName="text-5xl" />
    </div>
  );
}

/**
 * Sobre: o boneco num pedestal holográfico (que se materializa com a
 * rolagem) e os cartões com o que um recrutador procura primeiro.
 */
export function AboutSection({ rootRef, motion, webgl, onEnter }) {
  const { t, i18n } = useTranslation();
  const l = useLocalized();
  const locale = i18n.resolvedLanguage === 'en' ? 'en' : 'pt';
  const name = siteConfig.author.name;

  return (
    <section
      id="sobre"
      aria-labelledby="about-title"
      className="relative overflow-hidden rounded-t-[2.5rem] bg-[#0a2470] text-white"
    >
      {/* Fundo: brilho no centro e o piso quadriculado em perspectiva */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,#1f5fd6_0%,#0d2f8a_45%,#071a52_100%)]"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] [perspective:700px]">
        <div className="absolute inset-x-[-50%] top-0 bottom-[-40%] origin-top [transform:rotateX(62deg)] bg-[linear-gradient(rgb(116_214_255/0.22)_1px,transparent_1px),linear-gradient(90deg,rgb(116_214_255/0.22)_1px,transparent_1px)] [mask-image:radial-gradient(60%_70%_at_50%_0%,black,transparent)] bg-[size:64px_64px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 sm:px-8 lg:pt-24">
        <p className="text-center font-mono text-xs tracking-[0.3em] text-[#9fe3ff] uppercase">
          {t('landing.about.eyebrow')}
        </p>
        <h2 id="about-title" className="sr-only">
          {t('landing.about.title', { name: siteConfig.author.firstName })}
        </h2>

        <div className="mt-6 grid items-center gap-6 lg:grid-cols-[1fr_minmax(300px,420px)_1fr] lg:gap-14">
          <LazyScene
            rootRef={rootRef}
            enabled={webgl}
            fallback={<PhotoFallback />}
            className="relative order-first h-[min(72svh,620px)] min-h-[440px] lg:order-none lg:col-start-2 lg:row-start-1"
          >
            {(visible) => <FigureCanvas variant="holo" motion={motion} visible={visible} />}
          </LazyScene>

          <div className="flex flex-col items-center gap-6 lg:col-start-1 lg:row-start-1 lg:items-end">
            <HoloCard side="left">
              <p className="font-display text-xl font-bold tracking-tight text-white">{name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[#bfeaff]">
                <MapPin aria-hidden className="size-3.5" />
                {l(profile.location)}
              </p>
            </HoloCard>
            <HoloCard side="left">
              <p>{l(profile.summary)}</p>
            </HoloCard>
          </div>

          <div className="flex flex-col items-center gap-6 lg:col-start-3 lg:row-start-1 lg:items-start">
            <HoloCard side="right">
              <p className="font-display text-base font-bold text-white">
                {t('landing.about.focus')}
              </p>
              <ul className="mt-2 space-y-1">
                {profile.focus.map((item) => (
                  <li key={item.en} className="flex gap-2">
                    <span aria-hidden className="text-[#74d6ff]">
                      •
                    </span>
                    {l(item)}
                  </li>
                ))}
              </ul>
            </HoloCard>
            <HoloCard side="right">
              <p className="font-display text-base font-bold text-white">
                {t('landing.about.status')}
              </p>
              {profile.openToWork && (
                <p className="mt-1.5 flex items-center gap-2 font-semibold text-[#8ff0c2]">
                  <span
                    aria-hidden
                    className="size-2 rounded-full bg-[#45d39a] shadow-[0_0_8px_#45d39a]"
                  />
                  {t('landing.about.available')}
                </p>
              )}
              <p className="mt-2">{l(profile.educationShort)}</p>
              <p className="text-[#bfeaff]">{l(profile.educationPeriod)}</p>
              <div className="mt-3 flex flex-wrap gap-2 font-sans">
                <a
                  href={profile.resume[locale]}
                  download={profile.resumeFileName[locale]}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#0a2470] transition-colors hover:bg-[#dff4ff]"
                >
                  <Download aria-hidden className="size-3.5" />
                  {t('landing.about.resume')}
                </a>
                <button
                  type="button"
                  onClick={() => onEnter('about')}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#74d6ff]/50 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <MonitorUp aria-hidden className="size-3.5" />
                  {t('landing.about.more')}
                </button>
              </div>
            </HoloCard>
          </div>
        </div>
      </div>
    </section>
  );
}
