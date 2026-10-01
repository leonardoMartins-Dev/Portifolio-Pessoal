import { motion } from 'motion/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../../lib/hooks.js';
import { siteConfig } from '../../site.config.js';
import { Logo } from '../ui/Logo.jsx';

const DURATION_MS = 1100;

/** Boot curto em HTML (≤ 1,2s), pulável com clique ou tecla. */
export function BootScreen({ onDone }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const duration = reduced ? 300 : DURATION_MS;

  useEffect(() => {
    const timer = setTimeout(onDone, duration);
    const skip = () => onDone();
    window.addEventListener('keydown', skip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', skip);
    };
  }, [onDone, duration]);

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-8 bg-[#0b0c10] text-white"
      onClick={onDone}
      role="status"
      aria-label={t('boot.label', { system: siteConfig.system.name })}
    >
      <Logo className="size-14 text-white" />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full bg-white"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: duration / 1000, ease: 'easeInOut' }}
        />
      </div>
      <p className="absolute bottom-8 text-xs text-white/50">{t('boot.skip')}</p>
    </div>
  );
}
