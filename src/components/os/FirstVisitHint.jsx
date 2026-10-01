import { ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useShortcutLabel } from '../../lib/hooks.js';
import { siteConfig } from '../../site.config.js';

/** Aviso discreto da primeira visita: aponta o dock e o atalho do assistente. */
export function FirstVisitHint({ onDismiss }) {
  const { t } = useTranslation();
  const shortcut = useShortcutLabel();

  return (
    <motion.aside
      role="status"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.3 }}
      className="absolute bottom-[calc(var(--dock-h)+12px)] left-1/2 z-30 flex w-[min(92vw,420px)] -translate-x-1/2 items-start gap-3 rounded-md p-3.5 shadow-window-focused glass"
    >
      <ArrowDown aria-hidden className="mt-0.5 size-4 shrink-0 animate-bounce text-accent-ink" />
      <div className="flex-1 text-[13px]">
        <p className="font-semibold">{t('firstVisit.title', { system: siteConfig.system.name })}</p>
        <p className="mt-0.5 text-muted">{t('firstVisit.body', { shortcut })}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-[8px] px-2 py-1 text-[13px] font-medium text-accent-ink hover:bg-accent-soft"
      >
        {t('firstVisit.dismiss')}
      </button>
    </motion.aside>
  );
}
