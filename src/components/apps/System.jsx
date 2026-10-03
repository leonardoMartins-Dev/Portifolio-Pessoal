import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FaGithub } from 'react-icons/fa6';
import { siteConfig } from '../../site.config.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { Button } from '../ui/Button.jsx';
import { Logo } from '../ui/Logo.jsx';

const STACK = [
  { id: 'react', name: 'React', url: 'https://react.dev/' },
  { id: 'vite', name: 'Vite', url: 'https://vite.dev/' },
  { id: 'three', name: 'Three.js + React Three Fiber', url: 'https://r3f.docs.pmnd.rs/' },
  { id: 'gsap', name: 'GSAP', url: 'https://gsap.com/' },
  { id: 'motion', name: 'Motion', url: 'https://motion.dev/' },
  { id: 'zustand', name: 'Zustand', url: 'https://zustand.docs.pmnd.rs/' },
  { id: 'i18next', name: 'i18next', url: 'https://www.i18next.com/' },
  { id: 'rhf', name: 'React Hook Form + Zod', url: 'https://react-hook-form.com/' },
  { id: 'emailjs', name: 'EmailJS', url: 'https://www.emailjs.com/' },
  { id: 'aisdk', name: 'AI SDK + Gemini', url: 'https://ai-sdk.dev/' },
  { id: 'upstash', name: 'Upstash Redis', url: 'https://upstash.com/' },
  { id: 'tailwind', name: 'Tailwind CSS', url: 'https://tailwindcss.com/' },
  { id: 'vercel', name: 'Vercel', url: 'https://vercel.com/' },
];

/** Sobre este sistema: nome, versão, stack, créditos e repositório (§10.12). */
export default function System() {
  const { t } = useTranslation();
  const { professor } = siteConfig;

  return (
    <AppScroll>
      <header className="flex flex-col items-center gap-2 text-center">
        <Logo className="size-16 text-accent-ink" />
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">{siteConfig.system.name}</h3>
        <p className="text-sm text-muted">
          {t('system.version', { version: siteConfig.system.version })}
        </p>
        <p className="text-sm">{t('system.tagline')}</p>
      </header>

      <section aria-labelledby="system-stack" className="mt-8">
        <SectionTitle id="system-stack">{t('system.builtWith')}</SectionTitle>
        <ul className="mt-3 divide-y divide-border rounded-md border border-border bg-surface-2">
          {STACK.map((item) => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm hover:bg-border/50"
              >
                <span className="font-medium">{item.name}</span>
                <span className="flex items-center gap-1.5 text-right text-xs text-muted">
                  {t(`system.stack.${item.id}`)}
                  <ExternalLink aria-hidden className="size-3" />
                  <span className="sr-only">{t('common.newTab')}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="system-credits" className="mt-8">
        <SectionTitle id="system-credits">{t('system.credits')}</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed">
          {t('system.creditsText', { name: siteConfig.author.name })}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t('system.tribute', { professor: professor.name })}{' '}
          <a
            href={professor.portfolio}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-ink underline"
          >
            aramuni.dev
            <span className="sr-only"> {t('common.newTab')}</span>
          </a>
        </p>
        <div className="mt-4">
          {siteConfig.repoUrl ? (
            <Button href={siteConfig.repoUrl} external size="sm">
              <FaGithub aria-hidden className="size-4" />
              {t('system.repo')}
              <span className="sr-only">{t('common.newTab')}</span>
            </Button>
          ) : (
            <p className="text-xs text-muted">{t('system.repoSoon')}</p>
          )}
        </div>
      </section>
    </AppScroll>
  );
}
