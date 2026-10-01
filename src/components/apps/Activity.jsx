import { ChartColumn, Clock, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatWeekday, splitDuration } from '../../lib/format.js';
import { useLocale } from '../../lib/hooks.js';
import { useWakatime } from '../../lib/live-data.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Spinner } from '../ui/Spinner.jsx';

const MAX_LANGUAGES = 6;

/** Atividade: horas programando na semana e linguagens (WakaTime) (§12.2). */
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
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat icon={Clock} label={t('activity.total')} seconds={data.totalSeconds} />
        <Stat icon={Timer} label={t('activity.average')} seconds={data.dailyAverageSeconds} />
      </div>
      <DayBars days={data.days} />
      <LanguageBars languages={data.languages} />
      <p className="mt-6 text-xs text-muted">{t('activity.dataVia')}</p>
    </AppScroll>
  );
}

function useDuration() {
  const { t } = useTranslation();
  return (seconds) => t('activity.duration', splitDuration(seconds));
}

function Stat({ icon: Icon, label, seconds }) {
  const duration = useDuration();
  return (
    <div className="rounded-md border border-border bg-surface-2 p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Icon aria-hidden className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{duration(seconds)}</p>
    </div>
  );
}

function DayBars({ days }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const max = Math.max(1, ...days.map((day) => day.seconds));

  return (
    <section aria-labelledby="activity-days" className="mt-6">
      <SectionTitle id="activity-days">{t('activity.byDay')}</SectionTitle>
      <ul className="mt-3 flex h-36 items-end gap-2">
        {days.map((day) => {
          const weekday = formatWeekday(day.date, locale);
          return (
            <li
              key={day.date}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="sr-only">
                {t('activity.dayBar', { day: weekday, ...splitDuration(day.seconds) })}
              </span>
              <span
                aria-hidden
                className="w-full max-w-10 rounded-t-[6px] bg-accent/85"
                style={{ height: `${Math.max(2, (day.seconds / max) * 100)}%` }}
              />
              <span aria-hidden className="text-[11px] text-muted capitalize">
                {weekday}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
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
