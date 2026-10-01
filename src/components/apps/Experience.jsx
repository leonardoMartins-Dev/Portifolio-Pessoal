import { ExternalLink, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EXPERIENCE_TYPES, experiences } from '../../content/experiences.js';
import { formatPeriod } from '../../lib/format.js';
import { useLocale, useLocalized } from '../../lib/hooks.js';
import { sortExperiencesDescending } from '../../lib/timeline.js';
import { AppScroll } from '../ui/AppSection.jsx';
import { Chip } from '../ui/Chip.jsx';

/** Experiências da mais recente para a mais antiga, com filtro por tipo (§10.3). */
export default function Experience() {
  const { t } = useTranslation();
  const l = useLocalized();
  const locale = useLocale();
  const [type, setType] = useState(null);

  const sorted = useMemo(() => sortExperiencesDescending(experiences), []);
  const presentTypes = EXPERIENCE_TYPES.filter((candidate) =>
    experiences.some((experience) => experience.type === candidate),
  );
  const visible = type ? sorted.filter((experience) => experience.type === type) : sorted;

  return (
    <AppScroll>
      <h3 className="text-xl font-semibold tracking-tight">{t('experience.heading')}</h3>

      {presentTypes.length > 1 && (
        <div
          role="group"
          aria-label={t('experience.filterLabel')}
          className="mt-4 flex flex-wrap gap-1.5"
        >
          <Chip pressed={type === null} onClick={() => setType(null)}>
            {t('experience.all')}
          </Chip>
          {presentTypes.map((candidate) => (
            <Chip
              key={candidate}
              pressed={type === candidate}
              onClick={() => setType(type === candidate ? null : candidate)}
            >
              {t(`experience.types.${candidate}`)}
            </Chip>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p role="status" className="mt-8 text-sm text-muted">
          {t('experience.empty')}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {visible.map((experience) => (
            <li key={experience.id}>
              <article
                aria-labelledby={`experience-${experience.id}`}
                className="rounded-md border border-border bg-surface-2 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 id={`experience-${experience.id}`} className="text-base font-semibold">
                      {l(experience.role)}
                    </h4>
                    <p className="text-sm text-muted">
                      {experience.url ? (
                        <a
                          href={experience.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-text hover:underline"
                        >
                          {experience.organization}
                          <ExternalLink aria-hidden className="size-3" />
                          <span className="sr-only">{t('common.newTab')}</span>
                        </a>
                      ) : (
                        experience.organization
                      )}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-ink">
                    {t(`experience.types.${experience.type}`)}
                  </span>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>
                    {formatPeriod(
                      experience.start,
                      experience.end,
                      locale,
                      t('experience.present'),
                    )}
                  </span>
                  {experience.location && (
                    <span className="flex items-center gap-1">
                      <MapPin aria-hidden className="size-3" />
                      {l(experience.location)}
                    </span>
                  )}
                </p>
                <p className="mt-3 text-sm leading-relaxed">{l(experience.description)}</p>
                {experience.technologies?.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {experience.technologies.map((name) => (
                      <li key={name}>
                        <Chip>{name}</Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </AppScroll>
  );
}
