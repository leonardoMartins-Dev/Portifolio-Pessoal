import { Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAppMeta } from '../../lib/apps-meta.js';
import { useLocalized, useShortcutLabel } from '../../lib/hooks.js';
import { useOS } from '../../lib/os-store.js';
import { siteConfig } from '../../site.config.js';
import { Clock } from './Clock.jsx';
import { LocaleToggle } from './LocaleToggle.jsx';
import { LogoMenu } from './LogoMenu.jsx';
import { MiniPlayer } from './MiniPlayer.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

/** Barra de menu (cabeçalho do sistema), fixa no topo, com vidro. */
export function MenuBar() {
  const { t } = useTranslation();
  const l = useLocalized();
  const shortcut = useShortcutLabel();
  const openLauncher = useOS((state) => state.openLauncher);
  const focusedAppId = useOS(
    (state) => state.windows.find((win) => win.id === state.focusedId)?.appId,
  );

  return (
    <header
      aria-label={t('menu.header')}
      className="absolute inset-x-0 top-0 z-20 flex h-[var(--menubar-h)] items-center justify-between border-x-0 border-t-0 px-1.5 text-[13px] glass"
    >
      <div className="flex min-w-0 items-center gap-0.5">
        <LogoMenu />
        <span className="truncate px-2 font-semibold">
          {focusedAppId ? l(getAppMeta(focusedAppId).title) : siteConfig.system.name}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <MiniPlayer />
        <button
          type="button"
          onClick={openLauncher}
          aria-label={`${t('menu.assistant')} ${shortcut}`}
          title={t('menu.openAssistant', { shortcut })}
          className="flex h-6 items-center gap-1.5 rounded-[7px] px-2 hover:bg-border"
        >
          <Bot aria-hidden className="size-4" />
          <span className="hidden lg:inline">{t('menu.assistant')}</span>
          <kbd className="hidden rounded border border-border px-1 font-sans text-[11px] text-muted lg:inline">
            {shortcut}
          </kbd>
        </button>
        <LocaleToggle />
        <ThemeToggle />
        <Clock />
      </div>
    </header>
  );
}
