import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOS } from '../../lib/os-store.js';
import { useResolvedTheme } from '../../lib/theme.js';

/** Alterna entre claro e escuro (o modo "sistema" fica em Ajustes). */
export function ThemeToggle({ className = '', inverse = false }) {
  const { t } = useTranslation();
  const resolved = useResolvedTheme();
  const setTheme = useOS((state) => state.setTheme);
  const next = resolved === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === 'light' ? t('theme.toLight') : t('theme.toDark')}
      className={`grid place-items-center rounded-[7px] ${
        inverse ? 'size-11 text-white hover:bg-white/15' : 'size-7 hover:bg-border'
      } ${className}`}
    >
      {resolved === 'dark' ? (
        <Moon aria-hidden className="size-4" />
      ) : (
        <Sun aria-hidden className="size-4" />
      )}
    </button>
  );
}
