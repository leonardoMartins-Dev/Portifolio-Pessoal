import { intlLocale } from '../i18n/locales.js';

function toDate(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

/** 'YYYY-MM' → "mar 2024" (pt) / "Mar 2024" (en). */
export function formatMonth(yearMonth, locale) {
  const parts = new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(toDate(yearMonth));
  const month = parts.find((p) => p.type === 'month')?.value.replace('.', '') ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  return `${month} ${year}`;
}

/** Período de uma experiência: "mar 2024 – atual" / "Mar 2024 – Present". */
export function formatPeriod(start, end, locale, presentLabel) {
  const from = formatMonth(start, locale);
  if (end === null) return `${from} – ${presentLabel}`;
  const to = formatMonth(end, locale);
  return from === to ? from : `${from} – ${to}`;
}

/** Segundos → { hours, minutes }. */
export function splitDuration(totalSeconds) {
  const minutes = Math.round(totalSeconds / 60);
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

/** Milissegundos → "3:07". */
export function formatTrackTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function formatClock(date, locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(date, locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatWeekday(isoDate, locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    timeZone: 'UTC',
  })
    .format(new Date(`${isoDate}T00:00:00Z`))
    .replace('.', '');
}
