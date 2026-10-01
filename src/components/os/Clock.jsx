import { formatClock, formatTime } from '../../lib/format.js';
import { useLocale, useNow } from '../../lib/hooks.js';

/** Relógio no formato do idioma atual. `compact` mostra só a hora. */
export function Clock({ compact = false, className = '' }) {
  const locale = useLocale();
  const now = useNow();
  return (
    <time
      dateTime={now.toISOString()}
      className={`px-2 whitespace-nowrap tabular-nums ${className}`}
    >
      {compact ? formatTime(now, locale) : formatClock(now, locale)}
    </time>
  );
}
