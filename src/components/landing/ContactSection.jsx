import { ArrowUp, Download, Mail, MessageSquareText } from 'lucide-react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedin, FaWhatsapp } from 'react-icons/fa6';
import { profile } from '../../content/profile.js';
import { useLocale } from '../../lib/hooks.js';
import { siteConfig } from '../../site.config.js';
import { LocaleToggle } from '../os/LocaleToggle.jsx';
import { LazyScene, SectionTitle } from './parts.jsx';

const FigureCanvas = lazy(() => import('./three/FigureCanvas.jsx'));

const ROUND =
  'grid size-12 place-items-center rounded-full bg-land-surface text-land-ink shadow-[0_2px_10px_-4px_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5';

/** Contato: chamada para conversar, redes, currículo e o boneco acenando. Termina no rodapé. */
export function ContactSection({ rootRef, motion, theme, webgl, onEnter, onTop }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const other = locale === 'pt' ? 'en' : 'pt';
  const links = [
    { href: `mailto:${profile.email}`, label: t('landing.contact.email'), Icon: Mail },
    { href: profile.links.github, label: t('landing.contact.github'), Icon: FaGithub },
    { href: profile.links.linkedin, label: t('landing.contact.linkedin'), Icon: FaLinkedin },
    {
      href: `https://wa.me/${profile.whatsapp}`,
      label: t('landing.contact.whatsapp'),
      Icon: FaWhatsapp,
    },
  ];

  return (
    <>
      <section
        id="contato"
        aria-labelledby="contact-title"
        className="relative overflow-hidden rounded-t-[2.5rem] bg-land-bg-2"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-4 px-5 pt-20 sm:px-8 lg:grid-cols-2 lg:pt-24">
          <div className="lg:pb-24">
            <SectionTitle id="contact-title" tag={t('landing.contact.tag')}>
              {t('landing.contact.title')}
            </SectionTitle>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-land-muted sm:text-base">
              {t('landing.contact.lead')}
            </p>
            <ul className="mt-7 flex flex-wrap gap-3">
              {links.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    title={label}
                    {...(href.startsWith('http')
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    className={ROUND}
                  >
                    <Icon aria-hidden className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <a
                href={profile.resume[locale]}
                download={profile.resumeFileName[locale]}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white transition-[filter] hover:brightness-110"
              >
                <Download aria-hidden className="size-4" />
                {t('landing.contact.resume')}
              </a>
              <a
                href={profile.resume[other]}
                download={profile.resumeFileName[other]}
                lang={other}
                className="text-sm font-semibold underline decoration-land-line underline-offset-4 hover:decoration-current"
              >
                {t('landing.contact.resumeOther')}
              </a>
            </div>
            <button
              type="button"
              onClick={() => onEnter('contact')}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-land-muted hover:text-land-ink"
            >
              <MessageSquareText aria-hidden className="size-4" />
              {t('landing.contact.form')}
            </button>
          </div>

          <LazyScene
            rootRef={rootRef}
            enabled={webgl}
            className="relative h-[min(62svh,560px)] min-h-[380px]"
          >
            {(visible) => (
              <FigureCanvas variant="wave" motion={motion} visible={visible} theme={theme} />
            )}
          </LazyScene>
        </div>
      </section>

      <footer className="bg-land-bg px-5 pt-10 pb-28 text-sm text-land-muted sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <p>
            {t('landing.footer.rights', {
              year: new Date().getFullYear(),
              name: siteConfig.author.name,
            })}
            {' · '}
            {t('landing.footer.made')}
          </p>
          <button
            type="button"
            onClick={onTop}
            aria-label={t('landing.nav.top')}
            className="grid size-11 place-items-center rounded-full border border-land-line text-land-ink transition-colors hover:bg-land-line sm:order-none"
          >
            <ArrowUp aria-hidden className="size-4" />
          </button>
          <div className="flex items-center gap-4">
            <a
              href={siteConfig.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-land-ink hover:underline"
            >
              {t('landing.footer.source')}
            </a>
            <LocaleToggle />
          </div>
        </div>
      </footer>
    </>
  );
}
