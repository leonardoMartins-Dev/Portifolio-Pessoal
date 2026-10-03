import { Check, FileText, GraduationCap, Heart, Mail, MapPin, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { GiPirateFlag, GiRooster, GiTennisRacket } from 'react-icons/gi';
import { profile } from '../../content/profile.js';
import { useLocalized } from '../../lib/hooks.js';
import { navigateToApp } from '../../lib/os-bridge.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';

// Ícones dos hobbies (o conteúdo fica em profile.hobbies).
const HOBBY_ICONS = {
  'one-piece': GiPirateFlag,
  tennis: GiTennisRacket,
  galo: GiRooster,
};

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
        <Avatar className="size-28 ring-4 ring-accent-soft sm:size-32" textClassName="text-3xl" />
        <div className="flex flex-col items-center gap-1 sm:items-start">
          {profile.openToWork && (
            <p className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              {t('about.openToWork')}
            </p>
          )}
          <h3 className="text-2xl font-semibold tracking-tight">{profile.name}</h3>
          <p className="text-muted">{l(profile.role)}</p>
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPin aria-hidden className="size-3.5" />
            {l(profile.location)}
          </p>
        </div>
      </header>

      <section aria-labelledby="about-intro" className="mt-8">
        <SectionTitle id="about-intro">{t('about.intro')}</SectionTitle>
        <p className="mt-2 text-[15px] leading-relaxed">{l(profile.bio)}</p>
      </section>

      {profile.focus?.length > 0 && (
        <section aria-labelledby="about-focus" className="mt-6">
          <SectionTitle id="about-focus">{t('about.focus')}</SectionTitle>
          <ul className="mt-2 flex flex-col gap-1.5">
            {profile.focus.map((item) => (
              <li key={item.en} className="flex items-start gap-2 text-sm">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                {l(item)}
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {profile.hobbies?.length > 0 && (
        <section aria-labelledby="about-hobbies" className="mt-8">
          <SectionTitle id="about-hobbies">{t('about.hobbies')}</SectionTitle>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {profile.hobbies.map((hobby) => (
              <Hobby key={hobby.id} hobby={hobby} />
            ))}
          </ul>
        </section>
      )}

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
        <Button href={profile.links.linkedin} external>
          <FaLinkedin aria-hidden className="size-4" />
          {t('about.linkedin')}
          <span className="sr-only">{t('common.newTab')}</span>
        </Button>
      </nav>
    </AppScroll>
  );
}

function Hobby({ hobby }) {
  const l = useLocalized();
  const Icon = HOBBY_ICONS[hobby.id] ?? Heart;
  return (
    <li className="flex gap-3 rounded-md border border-border bg-surface-2 p-4 sm:flex-col">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-[11px] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_1px_2px_rgb(0_0_0/0.2)]"
        style={{ background: `linear-gradient(145deg, ${hobby.tint[0]}, ${hobby.tint[1]})` }}
      >
        <Icon className="size-[22px] drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">
          {l(hobby.label)}
        </p>
        <h4 className="text-sm font-semibold">{l(hobby.name)}</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted">{l(hobby.text)}</p>
      </div>
    </li>
  );
}
