import { Power } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/** Tela "desligado" usada quando não há 3D (sem WebGL ou movimento reduzido). */
export function PowerOffScreen({ onPowerOn }) {
  const { t } = useTranslation();
  const buttonRef = useRef(null);

  useEffect(() => buttonRef.current?.focus(), []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#08090c] text-white">
      <p className="text-sm text-white/50">{t('intro.off')}</p>
      <button
        ref={buttonRef}
        type="button"
        onClick={onPowerOn}
        className="grid size-16 place-items-center rounded-full border border-white/20 text-white/90 transition-colors hover:bg-white/10"
        aria-label={t('intro.powerOn')}
      >
        <Power aria-hidden className="size-7" />
      </button>
    </div>
  );
}
