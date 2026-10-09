import { CalendarCheck, ChartColumn, Clock, Timer, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate, splitDuration } from '../../lib/format.js';
import { useLocale } from '../../lib/hooks.js';
import { useWakatime } from '../../lib/live-data.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Spinner } from '../ui/Spinner.jsx';

const MAX_LANGUAGES = 6;

/** Atividade: tempo total programando e linguagens (WakaTime) (§12.2). */
export default function Activity() {
  const { t } = useTranslation();
  const { status, data } = useWakatime();

  if (status === 'loading') {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted"
      >
        <Spinner className="size-5" />
        {t('activity.loading')}
      </div>
    );
  }
  if (status !== 'ok') {
    return (
      <EmptyState
        icon={ChartColumn}
        title={status === 'unconfigured' ? t('activity.unconfigured') : t('activity.error')}
        className="h-full"
      />
    );
  }

  return (
    <AppScroll>
      <h3 className="text-xl font-semibold tracking-tight">{t('activity.heading')}</h3>
      <Stats data={data} />
      <LanguageBars languages={data.languages} />
      <p className="mt-6 text-xs text-muted">{t('activity.dataVia')}</p>
    </AppScroll>
  );
}

function useDuration() {
  const { t } = useTranslation();
  return (seconds) => t('activity.duration', splitDuration(seconds));
}

function Stats({ data }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const duration = useDuration();
  const stats = [
    {
      id: 'total',
      icon: Clock,
      label: t('activity.total'),
      value: duration(data.totalSeconds),
      note: data.since && t('activity.since', { date: formatDate(data.since, locale) }),
    },
    {
      id: 'average',
      icon: Timer,
      label: t('activity.average'),
      value: duration(data.dailyAverageSeconds),
    },
    { id: 'days', icon: CalendarCheck, label: t('activity.activeDays'), value: data.activeDays },
    data.bestDay && {
      id: 'best',
      icon: Trophy,
      label: t('activity.bestDay'),
      value: duration(data.bestDay.seconds),
      note: formatDate(data.bestDay.date, locale),
    },
  ].filter(Boolean);

  // Pela largura da janela (container query), não da tela.
  return (
    <div className="@container mt-4">
      <dl className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
        {stats.map(({ id, icon: Icon, label, value, note }) => (
          <div key={id} className="rounded-md border border-border bg-surface-2 p-4">
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <Icon aria-hidden className="size-3.5 shrink-0" />
              {label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
            {note && <dd className="mt-0.5 text-xs text-muted">{note}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

function LanguageBars({ languages }) {
  const { t } = useTranslation();
  const duration = useDuration();
  const shown = languages.slice(0, MAX_LANGUAGES);
  const rest = languages.slice(MAX_LANGUAGES);
  const rows = rest.length
    ? [
        ...shown,
        {
          name: t('activity.other'),
          percent: rest.reduce((sum, item) => sum + item.percent, 0),
          seconds: rest.reduce((sum, item) => sum + item.seconds, 0),
        },
      ]
    : shown;

  if (!rows.length) return null;
  return (
    <section aria-labelledby="activity-languages" className="mt-6">
      <SectionTitle id="activity-languages">{t('activity.languages')}</SectionTitle>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.map((language) => (
          <li key={language.name} className="text-sm">
            <div className="flex justify-between gap-3">
              <span>{language.name}</span>
              <span className="text-muted tabular-nums">
                {duration(language.seconds)} · {language.percent.toFixed(1)}%
              </span>
            </div>
            <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, language.percent)}%`,
                  background: language.color ?? 'var(--accent)',
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
