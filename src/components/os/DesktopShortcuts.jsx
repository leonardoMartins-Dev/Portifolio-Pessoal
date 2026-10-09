import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { apps } from '../../lib/apps.jsx';
import { useLocalized } from '../../lib/hooks.js';
import { useOS } from '../../lib/os-store.js';
import { siteConfig } from '../../site.config.js';

const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer');

/**
 * Ícones da área de trabalho: os apps do dock à esquerda e os links
 * (GitHub, LinkedIn) à direita. Clique duplo (ou Enter) abre; no toque,
 * um toque basta.
 */
export function DesktopShortcuts() {
  const { t } = useTranslation();
  const l = useLocalized();
  const hintId = useId();
  const openApp = useOS((state) => state.openApp);

  const appIcons = apps
    .filter((app) => app.inDock)
    .map((app) => {
      const Icon = app.icon;
      return {
        id: app.id,
        label: l(app.title),
        icon: <Icon className="size-6" />,
        tint: app.tint,
        open: () => openApp(app.id),
      };
    });

  const links = [
    {
      id: 'github',
      label: 'GitHub',
      icon: <FaGithub className="size-7" />,
      tint: ['#3b3f4a', '#16181d'],
      open: () => openExternal(siteConfig.social.github),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: <FaLinkedin className="size-7" />,
      tint: ['#3a8fe0', '#1d5fa8'],
      open: () => openExternal(siteConfig.social.linkedin),
    },
  ];

  return (
    <>
      <p id={hintId} className="sr-only">
        {t('desktop.shortcutHint')}
      </p>
      <nav aria-label={t('desktop.apps')} className="absolute inset-y-0 left-0 py-4 pl-3">
        {/* Preenche de cima para baixo e abre novas colunas quando a altura acaba. */}
        <ul className="grid h-full auto-cols-[5.75rem] grid-flow-col grid-rows-[repeat(auto-fill,6rem)] gap-x-1">
          {appIcons.map((item) => (
            <li key={item.id}>
              <DesktopIcon item={item} hintId={hintId} data-desktop-app={item.id} />
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label={t('desktop.links')} className="absolute top-4 right-3">
        <ul className="flex flex-col">
          {links.map((item) => (
            <li key={item.id}>
              <DesktopIcon item={item} hintId={hintId} data-shortcut={item.id} />
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

function DesktopIcon({ item, hintId, ...props }) {
  const pointerType = useRef('mouse');

  return (
    <button
      type="button"
      aria-describedby={hintId}
      onPointerDown={(event) => {
        pointerType.current = event.pointerType;
      }}
      onDoubleClick={() => pointerType.current === 'mouse' && item.open()}
      // Teclado (Enter/Espaço dispara click com detail 0) ou toque: abre direto.
      onClick={(event) => (event.detail === 0 || pointerType.current !== 'mouse') && item.open()}
      className="group flex min-h-[5.25rem] w-[5.75rem] flex-col items-center gap-1.5 rounded-sm p-1.5 focus:bg-white/15 focus:outline-none focus-visible:outline-2 focus-visible:outline-white"
      {...props}
    >
      <span
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded-[12px] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_8px_rgb(0_0_0/0.3)]"
        style={{ background: `linear-gradient(145deg, ${item.tint[0]}, ${item.tint[1]})` }}
      >
        {item.icon}
      </span>
      <span className="line-clamp-2 max-w-full rounded-[6px] bg-black/45 px-1.5 py-0.5 text-center text-[11px] leading-tight font-medium text-white group-focus:bg-accent">
        {item.label}
      </span>
    </button>
  );
}
