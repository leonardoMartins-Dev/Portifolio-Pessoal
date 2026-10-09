import { useTranslation } from 'react-i18next';
import { Spinner } from '../ui/Spinner.jsx';

/** Enquanto o código da página inicial baixa: fundo da página e "Entrar no sistema" já disponível. */
export function LandingFallback({ onSkip }) {
  const { t } = useTranslation();
  return (
    <div className="landing fixed inset-0 flex items-center justify-center bg-land-bg text-land-muted">
      <p role="status" className="flex items-center gap-2 text-sm">
        <Spinner />
        {t('landing.loading')}
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="absolute top-4 right-4 rounded-full bg-land-surface px-4 py-2 text-sm font-medium text-land-ink shadow-sm"
      >
        {t('landing.enterDirect')}
      </button>
    </div>
  );
}
