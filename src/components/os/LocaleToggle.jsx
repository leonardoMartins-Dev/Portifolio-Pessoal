import { useTranslation } from 'react-i18next';
import { LOCALES } from '../../i18n/locales.js';
import { useLocale } from '../../lib/hooks.js';
import { switchLocale } from '../../lib/os-bridge.js';

/** Troca PT | EN mantendo o app aberto (/pt/projects ↔ /en/projects). */
export function LocaleToggle({ className = '', inverse = false }) {
  const { t } = useTranslation();
  const locale = useLocale();

  return (
    <div
      role="group"
      aria-label={t('languages.label')}
      className={`flex items-center ${className}`}
    >
      {LOCALES.map((target, index) => (
        <span key={target} className="flex items-center">
          {index > 0 && (
            <span aria-hidden className={`px-0.5 ${inverse ? 'text-white/50' : 'text-muted'}`}>
              |
            </span>
          )}
          <button
            type="button"
            lang={target}
            aria-pressed={target === locale}
            aria-label={`${target.toUpperCase()} — ${t('languages.switchTo', { language: t(`languages.names.${target}`) })}`}
            onClick={() => target !== locale && switchLocale(target)}
            className={`rounded-[7px] px-1 text-[12px] font-semibold ${
              inverse
                ? 'min-h-11 min-w-11 text-white/60 hover:text-white aria-pressed:text-white'
                : 'min-h-6 min-w-7 text-muted hover:text-text aria-pressed:text-text'
            }`}
          >
            {target.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
