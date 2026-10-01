import { FileText } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { navigateToApp } from '../../lib/os-bridge.js';
import { siteConfig } from '../../site.config.js';

/** Atalhos da área de trabalho. Clique duplo (ou Enter) abre. */
export function DesktopShortcuts() {
  const { t } = useTranslation();
  const hintId = useId();

  const shortcuts = [
    {
      id: 'resume',
      label: t('desktop.resumeFile'),
      icon: <FileText className="size-7" />,
      tint: ['#e8ebf2', '#b9c0cf'],
      dark: true,
      open: () => navigateToApp('resume'),
    },
    {
      id: 'github',
      label: 'GitHub',
      icon: <FaGithub className="size-7" />,
      tint: ['#3b3f4a', '#16181d'],
      open: () => window.open(siteConfig.social.github, '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: <FaLinkedin className="size-7" />,
      tint: ['#3a8fe0', '#1d5fa8'],
      open: () => window.open(siteConfig.social.linkedin, '_blank', 'noopener,noreferrer'),
    },
  ];

  return (
    <nav aria-label={t('desktop.shortcuts')} className="absolute top-4 right-4 z-0">
      <p id={hintId} className="sr-only">
        {t('desktop.shortcutHint')}
      </p>
      <ul className="flex flex-col gap-2">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.id}>
            <button
              type="button"
              aria-describedby={hintId}
              data-shortcut={shortcut.id}
              onDoubleClick={shortcut.open}
              // Enter/Espaço no teclado disparam click com detail 0.
              onClick={(event) => event.detail === 0 && shortcut.open()}
              className="group flex w-20 flex-col items-center gap-1.5 rounded-sm p-1.5 focus:bg-white/15 focus:outline-none focus-visible:outline-2 focus-visible:outline-white"
            >
              <span
                aria-hidden
                className={`grid size-12 place-items-center rounded-[12px] shadow-[0_2px_8px_rgb(0_0_0/0.3)] ${shortcut.dark ? 'text-[#2b2f3a]' : 'text-white'}`}
                style={{
                  background: `linear-gradient(145deg, ${shortcut.tint[0]}, ${shortcut.tint[1]})`,
                }}
              >
                {shortcut.icon}
              </span>
              <span className="rounded-[6px] bg-black/45 px-1.5 py-0.5 text-center text-[11px] leading-tight font-medium text-white group-focus:bg-accent">
                {shortcut.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
