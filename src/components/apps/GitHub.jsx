import { BookMarked, CalendarCheck, Flame, GitCommitHorizontal, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub } from 'react-icons/fa6';
import { activeDays, monthLabels, toWeeks } from '../../lib/contributions.js';
import {
  formatDayMonth,
  formatMonthName,
  formatRelative,
  formatWeekday,
} from '../../lib/format.js';
import { useLocale, useNow } from '../../lib/hooks.js';
import { useGithub } from '../../lib/live-data.js';
import { siteConfig } from '../../site.config.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Spinner } from '../ui/Spinner.jsx';

// Cor de cada nível do gráfico (0 = nenhuma contribuição), na cor de destaque do sistema.
const LEVEL_CLASSES = ['bg-border', 'bg-accent/40', 'bg-accent/60', 'bg-accent/80', 'bg-accent'];
// Tamanho mínimo da célula: o gráfico mostra as semanas mais recentes que cabem na largura.
const MIN_CELL = 10;
const GAP = 3;
const WEEKDAY_COLUMN = 28;
// Segunda, quarta e sexta, como no GitHub (a semana começa no domingo).
const WEEKDAY_ROWS = [1, 3, 5];

/** GitHub ao vivo: contribuições, repositórios recentes e últimos commits. */
export default function GitHub() {
  const { t } = useTranslation();
  const { status, data } = useGithub();

  if (status === 'loading') {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted"
      >
        <Spinner className="size-5" />
        {t('github.loading')}
      </div>
    );
  }
  if (status !== 'ok') {
    return (
      <EmptyState
        icon={FaGithub}
        title={status === 'unconfigured' ? t('github.unconfigured') : t('github.error')}
        className="h-full"
      >
        {siteConfig.social.github && (
          <Button size="sm" href={siteConfig.social.github} external>
            <FaGithub aria-hidden className="size-3.5" />
            {t('github.profile')}
            <span className="sr-only">{t('common.newTab')}</span>
          </Button>
        )}
      </EmptyState>
    );
  }

  return (
    <AppScroll>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{t('github.heading')}</h3>
          <p className="font-mono text-sm text-muted">@{data.login}</p>
        </div>
        <Button size="sm" href={data.profileUrl} external>
          <FaGithub aria-hidden className="size-3.5" />
          {t('github.profile')}
          <span className="sr-only">{t('common.newTab')}</span>
        </Button>
      </header>

      <Stats data={data} />
      {data.calendar && <ContributionGraph calendar={data.calendar} />}
      {data.repos.length > 0 && <RecentRepos repos={data.repos} />}
      {data.commits.length > 0 && <RecentCommits commits={data.commits} />}
      <p className="mt-6 text-xs text-muted">{t('github.dataVia')}</p>
    </AppScroll>
  );
}

function Stats({ data }) {
  const { t } = useTranslation();
  const stats = [
    data.calendar && {
      id: 'contributions',
      icon: Flame,
      label: t('github.contributionsYear'),
      value: data.calendar.total,
    },
    data.calendar && {
      id: 'active',
      icon: CalendarCheck,
      label: t('github.activeDays'),
      value: activeDays(data.calendar.days, 30),
    },
    { id: 'repos', icon: BookMarked, label: t('github.repos'), value: data.repoCount },
  ].filter(Boolean);

  // Pela largura da janela (container query), não da tela: estreito vira lista.
  return (
    <div className="@container mt-4">
      <dl
        className="grid gap-2 @md:grid-cols-[repeat(var(--stats),minmax(0,1fr))] @md:gap-3"
        style={{ '--stats': stats.length }}
      >
        {stats.map(({ id, icon: Icon, label, value }) => (
          <div
            key={id}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-4 py-3 @md:flex-col @md:items-stretch @md:gap-1 @md:p-4"
          >
            <dt className="flex items-start gap-1.5 text-xs leading-snug text-muted">
              <Icon aria-hidden className="mt-px size-3.5 shrink-0" />
              {label}
            </dt>
            <dd className="text-xl font-semibold tracking-tight tabular-nums @md:text-2xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Largura disponível do elemento (null até a primeira medida). */
function useWidth(ref) {
  const [width, setWidth] = useState(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function ContributionGraph({ calendar }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const gridRef = useRef(null);
  const width = useWidth(gridRef);

  const allWeeks = toWeeks(calendar.days);
  const fits = width
    ? Math.max(1, Math.floor((width - WEEKDAY_COLUMN + GAP) / (MIN_CELL + GAP)))
    : allWeeks.length;
  const weeks = allWeeks.slice(-fits);
  // 1º de janeiro de 2023 foi um domingo: a linha 1 é segunda, e assim por diante.
  const weekday = (row) => formatWeekday(`2023-01-0${row + 1}`, locale);

  return (
    <section aria-labelledby="github-calendar" className="mt-6">
      <SectionTitle id="github-calendar">{t('github.contributions')}</SectionTitle>
      <div
        ref={gridRef}
        role="img"
        aria-label={t('github.calendarLabel', { count: calendar.total })}
        className="mt-3 grid gap-[3px] text-[10px] leading-none text-muted"
        style={{
          gridTemplateColumns: `${WEEKDAY_COLUMN - GAP}px repeat(${weeks.length}, minmax(0, 1fr))`,
        }}
      >
        {monthLabels(weeks).map(({ column, month }) => (
          <span
            key={month}
            className="pb-1 whitespace-nowrap capitalize"
            style={{ gridRow: 1, gridColumn: `${column + 2} / span 3` }}
          >
            {formatMonthName(month, locale)}
          </span>
        ))}
        {WEEKDAY_ROWS.map((row) => (
          <span
            key={row}
            className="self-center capitalize"
            style={{ gridRow: row + 2, gridColumn: 1 }}
          >
            {weekday(row)}
          </span>
        ))}
        {weeks.flatMap((week, column) =>
          week.map((day, row) =>
            day ? (
              <span
                key={day.date}
                title={t('github.dayContributions', {
                  count: day.count,
                  date: formatDayMonth(day.date, locale),
                })}
                className={`aspect-square rounded-[3px] ${LEVEL_CLASSES[day.level]}`}
                style={{ gridRow: row + 2, gridColumn: column + 2 }}
              />
            ) : null,
          ),
        )}
      </div>
      <div
        aria-hidden
        className="mt-2 flex items-center justify-end gap-[3px] text-[10px] text-muted"
      >
        <span className="mr-1">{t('github.less')}</span>
        {LEVEL_CLASSES.map((className) => (
          <span key={className} className={`size-2.5 rounded-[3px] ${className}`} />
        ))}
        <span className="ml-1">{t('github.more')}</span>
      </div>
    </section>
  );
}

function RecentRepos({ repos }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const now = useNow(60_000);

  return (
    <section aria-labelledby="github-repos" className="mt-6">
      <SectionTitle id="github-repos">{t('github.recentRepos')}</SectionTitle>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {repos.map((repo) => (
          <li key={repo.name}>
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col gap-1.5 rounded-md border border-border bg-surface-2 p-3.5 transition-colors hover:border-border-strong"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                <BookMarked aria-hidden className="size-4 shrink-0 text-muted" />
                <span className="truncate">{repo.name}</span>
                <span className="sr-only">{t('common.newTab')}</span>
              </span>
              {repo.description && (
                <span className="line-clamp-2 text-xs leading-relaxed text-muted">
                  {repo.description}
                </span>
              )}
              <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted">
                {repo.language && (
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full bg-accent"
                      style={repo.language.color ? { background: repo.language.color } : undefined}
                    />
                    {repo.language.name}
                  </span>
                )}
                {repo.stars > 0 && (
                  <span className="flex items-center gap-1">
                    <Star aria-hidden className="size-3" />
                    <span className="sr-only">{t('github.stars', { count: repo.stars })}</span>
                    <span aria-hidden>{repo.stars}</span>
                  </span>
                )}
                <time dateTime={repo.pushedAt}>
                  {t('github.updated', { when: formatRelative(repo.pushedAt, locale, now) })}
                </time>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentCommits({ commits }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const now = useNow(60_000);

  return (
    <section aria-labelledby="github-commits" className="mt-6">
      <SectionTitle id="github-commits">{t('github.recentCommits')}</SectionTitle>
      <ol className="mt-3 divide-y divide-border overflow-hidden rounded-md border border-border bg-surface-2">
        {commits.map((commit) => (
          <li key={`${commit.repo}-${commit.sha}`}>
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface"
            >
              <GitCommitHorizontal aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-ink" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{commit.message}</span>
                <span className="mt-0.5 flex flex-wrap gap-x-1.5 text-xs text-muted">
                  <span className="font-medium">{commit.repo}</span>
                  <span aria-hidden>·</span>
                  <code className="font-mono">{commit.sha}</code>
                  <span aria-hidden>·</span>
                  <time dateTime={commit.date}>{formatRelative(commit.date, locale, now)}</time>
                </span>
                <span className="sr-only">{t('common.newTab')}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
