import { ChevronDown, ExternalLink, Star } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub } from 'react-icons/fa6';
import { useSearchParams } from 'react-router';
import { projects } from '../../content/projects.js';
import { formatMonth } from '../../lib/format.js';
import { useLocale, useLocalized, useReducedMotion } from '../../lib/hooks.js';
import { collectTechnologies, sortProjectsAscending } from '../../lib/timeline.js';
import { AppScroll } from '../ui/AppSection.jsx';
import { Button } from '../ui/Button.jsx';
import { Chip } from '../ui/Chip.jsx';

/** Projetos em linha do tempo, do mais antigo ao mais recente (§10.2). */
export default function Projects() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('project');
  const reduced = useReducedMotion();
  const [technology, setTechnology] = useState(null);
  const itemRefs = useRef({});

  const sorted = useMemo(() => sortProjectsAscending(projects), []);
  const technologies = useMemo(() => collectTechnologies(projects), []);
  const visible = technology
    ? sorted.filter((project) => project.technologies.includes(technology))
    : sorted;

  // ?project={id}: rola até o projeto e o destaca (usado pelo assistente).
  useEffect(() => {
    if (!highlightId) return;
    const frame = requestAnimationFrame(() =>
      itemRefs.current[highlightId]?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'center',
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [highlightId, reduced]);

  return (
    <AppScroll>
      <header>
        <h3 className="text-xl font-semibold tracking-tight">{t('projects.heading')}</h3>
        <p className="text-sm text-muted">{t('projects.subtitle')}</p>
      </header>

      {technologies.length > 1 && (
        <div
          role="group"
          aria-label={t('projects.filterLabel')}
          className="mt-4 flex flex-wrap gap-1.5"
        >
          <Chip pressed={technology === null} onClick={() => setTechnology(null)}>
            {t('projects.all')}
          </Chip>
          {technologies.map((name) => (
            <Chip
              key={name}
              pressed={technology === name}
              onClick={() => setTechnology(technology === name ? null : name)}
            >
              {name}
            </Chip>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p role="status" className="mt-8 text-sm text-muted">
          {t('projects.empty')}
        </p>
      ) : (
        <ol
          aria-label={t('projects.heading')}
          className="relative mt-6 ml-2 border-l border-border"
        >
          {visible.map((project) => (
            <li
              key={project.id}
              ref={(element) => {
                itemRefs.current[project.id] = element;
              }}
              className="relative pb-8 pl-6 last:pb-2"
            >
              <span
                aria-hidden
                className="absolute top-1.5 -left-[5px] size-[9px] rounded-full border-2 border-surface bg-accent"
              />
              <ProjectCard project={project} highlighted={project.id === highlightId} />
            </li>
          ))}
        </ol>
      )}
    </AppScroll>
  );
}

function ProjectCard({ project, highlighted }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  return (
    <article
      aria-labelledby={`project-${project.id}`}
      className={`overflow-hidden rounded-md border bg-surface-2 transition-shadow ${
        highlighted ? 'border-accent ring-2 ring-accent/60' : 'border-border'
      }`}
    >
      <ProjectMedia media={project.media} />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h4 id={`project-${project.id}`} className="text-base font-semibold">
            {project.name}
          </h4>
          <time dateTime={project.date} className="text-xs font-medium text-muted uppercase">
            {formatMonth(project.date, locale)}
          </time>
        </div>
        {project.featured && (
          <p className="flex items-center gap-1 text-xs font-medium text-accent-ink">
            <Star aria-hidden className="size-3.5 fill-current" />
            {t('projects.featured')}
          </p>
        )}
        <p className="text-sm leading-relaxed text-muted">{l(project.description)}</p>

        <ul aria-label={t('projects.technologies')} className="flex flex-wrap gap-1.5">
          {project.technologies.map((name) => (
            <li key={name}>
              <Chip>{name}</Chip>
            </li>
          ))}
        </ul>

        {project.details && expanded && (
          <p id={detailsId} className="text-sm leading-relaxed">
            {l(project.details)}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" href={project.repoUrl} external>
            <FaGithub aria-hidden className="size-3.5" />
            {t('projects.repo')}
            <span className="sr-only">{t('common.newTab')}</span>
          </Button>
          {project.demoUrl && (
            <Button size="sm" variant="primary" href={project.demoUrl} external>
              <ExternalLink aria-hidden className="size-3.5" />
              {t('projects.demo')}
              <span className="sr-only">{t('common.newTab')}</span>
            </Button>
          )}
          {project.details && (
            <Button
              size="sm"
              variant="ghost"
              aria-expanded={expanded}
              aria-controls={expanded ? detailsId : undefined}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? t('projects.hideDetails') : t('projects.showDetails')}
              <ChevronDown
                aria-hidden
                className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Mídia do projeto: vídeo curto em loop (preferível) ou imagem/GIF, com lazy-load. */
function ProjectMedia({ media }) {
  const l = useLocalized();
  const reduced = useReducedMotion();

  if (media.type === 'video') {
    return (
      <video
        src={media.src}
        poster={media.poster}
        aria-label={l(media.alt)}
        muted
        loop
        playsInline
        autoPlay={!reduced}
        controls={reduced}
        preload="metadata"
        className="aspect-video w-full bg-black object-cover"
      />
    );
  }
  return (
    <img
      src={media.src}
      alt={l(media.alt)}
      loading="lazy"
      decoding="async"
      className="aspect-video w-full bg-surface object-cover"
    />
  );
}
