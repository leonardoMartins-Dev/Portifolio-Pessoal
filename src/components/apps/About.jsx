import { FileText, GraduationCap, Heart, Mail, MapPin, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FaGithub } from 'react-icons/fa6';
import { profile } from '../../content/profile.js';
import { useLocalized } from '../../lib/hooks.js';
import { navigateToApp } from '../../lib/os-bridge.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';

export default function About() {
  const { t } = useTranslation();
  const l = useLocalized();

  const sections = [
    {
      id: 'education',
      icon: GraduationCap,
      title: t('about.education'),
      text: l(profile.education),
    },
    { id: 'interests', icon: Heart, title: t('about.interests'), text: l(profile.interests) },
    { id: 'goals', icon: Target, title: t('about.goals'), text: l(profile.goals) },
  ];

  return (
    <AppScroll>
      <header className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <Avatar />
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-semibold tracking-tight">{profile.name}</h3>
          <p className="text-muted">{l(profile.role)}</p>
          <p className="flex items-center justify-center gap-1 text-sm text-muted sm:justify-start">
            <MapPin aria-hidden className="size-3.5" />
            {l(profile.location)}
          </p>
        </div>
      </header>

      <section aria-labelledby="about-intro" className="mt-8">
        <SectionTitle id="about-intro">{t('about.intro')}</SectionTitle>
        <p className="mt-2 text-[15px] leading-relaxed">{l(profile.bio)}</p>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {sections.map(({ id, icon: Icon, title, text }) => (
          <section
            key={id}
            aria-labelledby={`about-${id}`}
            className="rounded-md border border-border bg-surface-2 p-4"
          >
            <Icon aria-hidden className="size-5 text-accent-ink" />
            <h4 id={`about-${id}`} className="mt-2 text-sm font-semibold">
              {title}
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
          </section>
        ))}
      </div>

      <nav aria-label={t('about.quickLinks')} className="mt-8 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => navigateToApp('resume')}>
          <FileText aria-hidden className="size-4" />
          {t('about.resume')}
        </Button>
        <Button onClick={() => navigateToApp('contact')}>
          <Mail aria-hidden className="size-4" />
          {t('about.contact')}
        </Button>
        <Button href={profile.links.github} external>
          <FaGithub aria-hidden className="size-4" />
          {t('about.github')}
          <span className="sr-only">{t('common.newTab')}</span>
        </Button>
      </nav>
    </AppScroll>
  );
}
