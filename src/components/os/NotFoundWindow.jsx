import { SearchX } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../ui/Button.jsx';

/** Janela "App não encontrado" no estilo do sistema (o 404). */
export function NotFoundWindow({ locale, path }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => ref.current?.focus(), []);

  return (
    <div className="absolute inset-0 z-[5000] grid place-items-center p-4">
      <section
        ref={ref}
        role="alertdialog"
        aria-labelledby="not-found-title"
        aria-describedby="not-found-body"
        tabIndex={-1}
        className="w-full max-w-sm overflow-hidden rounded-md border border-border-strong bg-surface shadow-window-focused outline-none"
      >
        <NotFoundContent path={path} onBack={() => navigate(`/${locale}`)} />
      </section>
    </div>
  );
}

export function NotFoundContent({ path, onBack }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-md bg-surface-2 text-muted">
        <SearchX aria-hidden className="size-6" />
      </span>
      <h2 id="not-found-title" className="text-base font-semibold">
        {t('notFound.title')}
      </h2>
      <p id="not-found-body" className="text-sm text-muted">
        {t('notFound.body', { path: `/${path}` })}
      </p>
      <Button variant="primary" size="sm" onClick={onBack} className="mt-2">
        {t('notFound.action')}
      </Button>
    </div>
  );
}
