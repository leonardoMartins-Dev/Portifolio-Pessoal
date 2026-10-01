import { useTranslation } from 'react-i18next';
import { Spinner } from '../ui/Spinner.jsx';

/** Enquanto o código 3D é baixado: tela neutra com "Pular intro" já disponível. */
export function IntroFallback({ onSkip }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg text-muted">
      <p role="status" className="flex items-center gap-2 text-sm">
        <Spinner />
        {t('intro.loading')}
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="absolute top-4 right-4 rounded-full bg-surface-2 px-4 py-2 text-sm font-medium text-text hover:bg-border"
      >
        {t('intro.skip')}
      </button>
    </div>
  );
}
