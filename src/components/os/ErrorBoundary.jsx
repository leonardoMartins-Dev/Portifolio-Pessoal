import { TriangleAlert } from 'lucide-react';
import { Component } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button.jsx';

/** Captura erros de um app para que ele não derrube o sistema inteiro. */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return this.props.fallback ?? <AppCrashed onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

function AppCrashed({ onRetry }) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <TriangleAlert aria-hidden className="size-8 text-danger" />
      <p className="text-sm font-medium">{t('errors.appCrashed')}</p>
      <Button size="sm" onClick={onRetry}>
        {t('errors.retry')}
      </Button>
    </div>
  );
}
