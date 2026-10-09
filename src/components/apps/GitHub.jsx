import {
  Award,
  BookMarked,
  CalendarCheck,
  CircleDot,
  Flame,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
  MapPin,
  Star,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub } from 'react-icons/fa6';
import { activeDays, monthLabels, toWeeks } from '../../lib/contributions.js';
import {
  formatBytes,
  formatDate,
  formatDayMonth,
  formatMonth,
  formatMonthName,
  formatNumber,
  formatPercent,
  formatRelative,
  formatWeekday,
} from '../../lib/format.js';
import { useLocale, useNow } from '../../lib/hooks.js';
import { useGithub } from '../../lib/live-data.js';
import { siteConfig } from '../../site.config.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Segmented } from '../ui/Segmented.jsx';
import { Spinner } from '../ui/Spinner.jsx';

// Cor de cada nível do gráfico (0 = nenhuma contribuição), na cor de destaque do sistema.
const LEVEL_CLASSES = ['bg-border', 'bg-accent/40', 'bg-accent/60', 'bg-accent/80', 'bg-accent'];
// Tamanho mínimo da célula: o gráfico mostra as semanas mais recentes que cabem na largura.
const MIN_CELL = 10;
const GAP = 3;
const WEEKDAY_COLUMN = 28;
// Segunda, quarta e sexta, como no GitHub (a semana começa no domingo).
const WEEKDAY_ROWS = [1, 3, 5];
const TABS = ['overview', 'activity', 'languages', 'repos'];
// Linguagens além destas viram "Outras".
const MAX_LANGUAGES = 8;
// Horas com rótulo no eixo do gráfico de horários.
const HOUR_TICKS = [0, 6, 12, 18];
// 1º de janeiro de 2023 foi um domingo: o dia `row` da semana cai em 2023-01-0{row + 1}.
const weekdayName = (row, locale) => formatWeekday(`2023-01-0${row + 1}`, locale);

/**
 * GitHub (Stats) ao vivo: perfil, números (contribuições, sequências, commits,
 * PRs, estrelas…), atividade por ano, dia da semana e hora, linguagens,
 * repositórios recentes e últimos commits.
 */
export default function GitHub() {
  const { t } = useTranslation();
  const { status, data } = useGithub();
  const [tab, setTab] = useState('overview');

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
      <Profile data={data} />
      <div className="mt-5 max-w-full overflow-x-auto">
        <Segmented
          label={t('github.sections')}
          value={tab}
          onChange={setTab}
          options={TABS.map((id) => ({ value: id, label: t(`github.tabs.${id}`) }))}
        />
      </div>

      {tab === 'overview' && (
        <>
          <Stats data={data} />
          {data.calendar && <ContributionGraph calendar={data.calendar} />}
        </>
      )}
      {tab === 'activity' && <ActivityCharts data={data} />}
      {tab === 'languages' && <Languages languages={data.languages} />}
      {tab === 'repos' && (
        <>
          {data.repos.length > 0 && <RecentRepos repos={data.repos} />}
          {data.commits.length > 0 && <RecentCommits commits={data.commits} />}
        </>
      )}
      <p className="mt-6 text-xs text-muted">{t('github.dataVia')}</p>
    </AppScroll>
  );
}

function Profile({ data }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { profile } = data;

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3.5">
        {profile?.avatarUrl && (
          <img
            src={`${profile.avatarUrl}${profile.avatarUrl.includes('?') ? '&' : '?'}s=112`}
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-full border border-border"
          />
        )}
        <div className="min-w-0">
          <h3 className="text-xl font-semibold tracking-tight">{t('github.heading')}</h3>
          <p className="font-mono text-sm text-muted">@{data.login}</p>
        </div>
      </div>
      <Button size="sm" href={data.profileUrl} external>
        <FaGithub aria-hidden className="size-3.5" />
        {t('github.profile')}
        <span className="sr-only">{t('common.newTab')}</span>
      </Button>
      {(profile?.bio || profile?.location || profile?.createdAt) && (
        <div className="w-full text-sm text-muted">
          {profile.bio && <p className="text-text">{profile.bio}</p>}
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin aria-hidden className="size-3.5" />
                {profile.location}
              </span>
            )}
            {profile.createdAt && (
              <span className="flex items-center gap-1">
                <FaGithub aria-hidden className="size-3.5" />
                {t('github.memberSince', {
                  date: formatMonth(profile.createdAt.slice(0, 7), locale),
                })}
              </span>
            )}
          </p>
        </div>
      )}
    </header>
  );
}

function Stats({ data }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const number = (value) => formatNumber(value, locale);
  const days = (count) => t('github.days', { count, value: number(count) });
  const streakRange = ({ start, end }) =>
    start === end
      ? formatDate(start, locale)
      : `${formatDayMonth(start, locale)} – ${formatDate(end, locale)}`;
  const c = data.contributions;

  const stats = [
    (c || data.calendar) && {
      id: 'contributions',
      icon: Flame,
      label: t('github.stats.contributions'),
      value: number(c?.total ?? data.calendar.total),
      note: c?.firstDate
        ? t('github.notes.since', { date: formatDate(c.firstDate, locale) })
        : t('github.notes.lastYear'),
    },
    data.commitsLastYear != null && {
      id: 'commits',
      icon: GitCommitHorizontal,
      label: t('github.stats.commits'),
      value: number(data.commitsLastYear),
      note: t('github.notes.last12Months'),
    },
    data.pullRequests != null && {
      id: 'pullRequests',
      icon: GitPullRequest,
      label: t('github.stats.pullRequests'),
      value: number(data.pullRequests),
    },
    data.issues != null && {
      id: 'issues',
      icon: CircleDot,
      label: t('github.stats.issues'),
      value: number(data.issues),
    },
    {
      id: 'stars',
      icon: Star,
      label: t('github.stats.stars'),
      value: number(data.stars ?? 0),
      note: t('github.notes.inRepos', { count: data.repoCount }),
    },
    { id: 'forks', icon: GitFork, label: t('github.stats.forks'), value: number(data.forks ?? 0) },
    data.profile && {
      id: 'followers',
      icon: Users,
      label: t('github.stats.followers'),
      value: number(data.profile.followers),
      note: t('github.notes.following', { count: data.profile.following }),
    },
    { id: 'repos', icon: BookMarked, label: t('github.repos'), value: number(data.repoCount) },
    c && {
      id: 'currentStreak',
      icon: Zap,
      label: t('github.stats.currentStreak'),
      value: days(c.currentStreak.length),
      note: c.currentStreak.length
        ? t('github.notes.since', { date: formatDayMonth(c.currentStreak.start, locale) })
        : t('github.notes.noStreak'),
    },
    c?.longestStreak.length > 0 && {
      id: 'longestStreak',
      icon: Award,
      label: t('github.stats.longestStreak'),
      value: days(c.longestStreak.length),
      note: streakRange(c.longestStreak),
    },
    c?.bestDay && {
      id: 'bestDay',
      icon: Trophy,
      label: t('github.stats.bestDay'),
      value: number(c.bestDay.count),
      note: formatDate(c.bestDay.date, locale),
    },
    data.calendar && {
      id: 'active',
      icon: CalendarCheck,
      label: t('github.activeDays'),
      value: number(activeDays(data.calendar.days, 30)),
    },
  ].filter(Boolean);

  // Pela largura da janela (container query), não da tela.
  return (
    <div className="@container mt-5">
      <dl className="grid grid-cols-2 gap-2 @lg:grid-cols-3 @lg:gap-3 @4xl:grid-cols-4">
        {stats.map(({ id, icon: Icon, label, value, note }) => (
          <div key={id} className="rounded-md border border-border bg-surface-2 px-3.5 py-3">
            <dt className="flex items-start gap-1.5 text-xs leading-snug text-muted">
              <Icon aria-hidden className="mt-px size-3.5 shrink-0" />
              {label}
            </dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight">{value}</dd>
            {note && <dd className="mt-0.5 text-xs text-muted">{note}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Colunas de uma série só, na cor de destaque. O pico fica destacado e é o
 * valor da linha de leitura; passar o mouse ou tocar mostra o de cada coluna.
 * O leitor de tela recebe os mesmos valores numa tabela escondida.
 */
function Columns({ id, title, items, value, readout, axis }) {
  const [active, setActive] = useState(null);
  const values = items.map(value);
  const max = Math.max(...values, 0);
  const peak = values.indexOf(max);
  const shown = active ?? peak;

  return (
    <section aria-labelledby={id} className="mt-6">
      <SectionTitle id={id}>{title}</SectionTitle>
      <p aria-hidden className="mt-3 h-5 text-sm font-medium tabular-nums">
        {readout(items[shown])}
      </p>
      <div
        aria-hidden
        className="mt-2 flex h-28 items-end border-b border-border"
        onPointerLeave={() => setActive(null)}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="flex h-full flex-1 items-end justify-center px-px"
            onPointerEnter={() => setActive(index)}
            onPointerDown={() => setActive(index)}
          >
            <span
              className={`w-full max-w-6 rounded-t-[4px] transition-colors ${
                index === shown ? 'bg-accent' : 'bg-accent/40'
              }`}
              style={{
                height: max ? `${(values[index] / max) * 100}%` : 0,
                minHeight: values[index] ? 2 : 0,
              }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-1.5 flex text-[10px] text-muted tabular-nums">
        {items.map((item, index) => (
          <span key={index} className="flex-1 text-center whitespace-nowrap">
            {axis(item, index)}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{readout(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ActivityCharts({ data }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { contributions: c, commitHours: hours } = data;
  const percent = (value) => formatPercent(value, locale);

  if (!c && !hours) {
    return <EmptyState icon={FaGithub} title={t('github.noActivity')} />;
  }

  const weekdayTotal = c ? c.weekdays.reduce((sum, value) => sum + value, 0) : 0;
  const weekdayMax = c ? Math.max(...c.weekdays, 1) : 1;
  const hourRange = (hour) => t('github.hourRange', { from: hour, to: (hour + 1) % 24 });

  return (
    <>
      {c && (
        <Columns
          id="github-years"
          title={t('github.byYear')}
          items={c.years}
          value={(item) => item.total}
          readout={(item) =>
            t('github.yearContributions', {
              year: item.year,
              count: item.total,
              value: formatNumber(item.total, locale),
            })
          }
          axis={(item) => item.year}
        />
      )}

      {c && weekdayTotal > 0 && (
        <section aria-labelledby="github-weekdays" className="mt-6">
          <SectionTitle id="github-weekdays">{t('github.byWeekday')}</SectionTitle>
          <ul className="mt-3 flex flex-col gap-2">
            {c.weekdays.map((count, row) => (
              <li
                key={row}
                className="grid grid-cols-[2.5rem_1fr_6.5rem] items-center gap-3 text-sm"
              >
                <span className="text-muted capitalize">{weekdayName(row, locale)}</span>
                <span aria-hidden className="h-2 overflow-hidden rounded-full bg-border">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(count / weekdayMax) * 100}%` }}
                  />
                </span>
                <span className="text-right text-xs text-muted tabular-nums">
                  {formatNumber(count, locale)} · {percent((count / weekdayTotal) * 100)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hours && (
        <>
          <Columns
            id="github-hours"
            title={t('github.commitHours')}
            items={hours.hours.map((share, hour) => ({ hour, share }))}
            value={(item) => item.share}
            readout={(item) =>
              t('github.hourShare', { range: hourRange(item.hour), percent: percent(item.share) })
            }
            axis={(item) => (HOUR_TICKS.includes(item.hour) ? `${item.hour}h` : '')}
          />
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {hours.periods.map((period) => {
              const top = period.percent === Math.max(...hours.periods.map((p) => p.percent));
              return (
                <li
                  key={period.id}
                  className={`rounded-md border px-3 py-2.5 ${
                    top ? 'border-accent/50 bg-accent-soft' : 'border-border bg-surface-2'
                  }`}
                >
                  <p className="text-xs text-muted">{t(`github.periods.${period.id}`)}</p>
                  <p className="text-lg font-semibold">{percent(period.percent)}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">
            {t('github.hoursNote', {
              sampled: formatNumber(hours.sampled, locale),
              total: formatNumber(hours.total, locale),
            })}
          </p>
        </>
      )}
    </>
  );
}

function Languages({ languages }) {
  const { t } = useTranslation();
  const locale = useLocale();
  if (!languages?.items.length) {
    return <EmptyState icon={FaGithub} title={t('github.noLanguages')} />;
  }

  const shown = languages.items.slice(0, MAX_LANGUAGES);
  const rest = languages.items.slice(MAX_LANGUAGES);
  const rows = rest.length
    ? [
        ...shown,
        {
          name: t('github.otherLanguages', { count: rest.length }),
          color: null,
          value: rest.reduce((sum, item) => sum + item.value, 0),
          percent: rest.reduce((sum, item) => sum + item.percent, 0),
        },
      ]
    : shown;
  const amount = (item) =>
    languages.unit === 'bytes'
      ? formatBytes(item.value, locale)
      : t('github.reposCount', { count: item.value });

  return (
    <section aria-labelledby="github-languages" className="mt-6">
      <SectionTitle id="github-languages">{t('github.tabs.languages')}</SectionTitle>
      <p className="mt-2 text-sm text-muted">
        {languages.unit === 'bytes'
          ? t('github.languagesByBytes', {
              size: formatBytes(languages.total, locale),
              count: languages.repos,
            })
          : t('github.languagesByRepo', { count: languages.total })}
      </p>
      {/* Uma barra dividida por linguagem (2px de respiro entre as partes); a lista traz os valores. */}
      <div aria-hidden className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full">
        {rows.map((item) => (
          <span
            key={item.name}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ flexGrow: item.value, background: item.color ?? 'var(--text-muted)' }}
          />
        ))}
      </div>
      <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {rows.map((item) => (
          <li key={item.name} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: item.color ?? 'var(--text-muted)' }}
            />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            <span className="text-xs text-muted tabular-nums">
              {amount(item)} · {formatPercent(item.percent, locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
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
            {weekdayName(row, locale)}
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
