import { Download, ExternalLink, FileText, FileX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaLinkedin } from 'react-icons/fa6';
import { profile } from '../../content/profile.js';
import { useIsMobile, useLocale } from '../../lib/hooks.js';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Spinner } from '../ui/Spinner.jsx';

/** O PDF existe? (sem ele, o servidor devolve o index.html do SPA) */
function usePdfAvailable(url) {
  const [state, setState] = useState({ url: null, available: null });
  useEffect(() => {
    let active = true;
    fetch(url, { method: 'HEAD' })
      .then((response) => response.ok && response.headers.get('content-type')?.includes('pdf'))
      .catch(() => false)
      .then((available) => active && setState({ url, available: Boolean(available) }));
    return () => {
      active = false;
    };
  }, [url]);
  return state.url === url ? state.available : null;
}

/** Currículo: visualizador no desktop, prévia + botões no celular (§10.5). */
export default function Resume() {
  const { t } = useTranslation();
  const locale = useLocale();
  const isMobile = useIsMobile();
  const pdf = profile.resume[locale];
  const available = usePdfAvailable(pdf);

  if (available === null) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner className="size-5 text-muted" label={t('common.loading')} />
      </div>
    );
  }

  if (!available) {
    return (
      <EmptyState icon={FileX} title={t('resume.unavailable')} className="h-full">
        <p>{t('resume.unavailableHint')}</p>
        <Button href={profile.links.linkedin} external size="sm">
          <FaLinkedin aria-hidden className="size-4" />
          LinkedIn
          <span className="sr-only">{t('common.newTab')}</span>
        </Button>
      </EmptyState>
    );
  }

  const downloads = (
    <>
      <Button size="sm" href={profile.resume.pt} download>
        <Download aria-hidden className="size-3.5" />
        {t('resume.downloadPt')}
      </Button>
      <Button size="sm" href={profile.resume.en} download>
        <Download aria-hidden className="size-3.5" />
        {t('resume.downloadEn')}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <div className="scroll-area flex h-full flex-col items-center gap-5 overflow-y-auto p-5">
        <ResumePreview src={profile.resumePreview[locale]} />
        <div className="flex w-full flex-col gap-2">
          <Button variant="primary" href={pdf} external>
            <ExternalLink aria-hidden className="size-4" />
            {t('resume.open')}
          </Button>
          <div className="grid grid-cols-2 gap-2">{downloads}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-3 py-2">
        <Button size="sm" variant="ghost" href={pdf} external>
          <ExternalLink aria-hidden className="size-3.5" />
          {t('resume.open')}
        </Button>
        {downloads}
      </div>
      <object
        data={pdf}
        type="application/pdf"
        aria-label={t('resume.viewerTitle', { name: profile.name })}
        className="min-h-0 w-full flex-1 bg-surface-2"
      >
        <p className="p-6 text-sm text-muted">{t('resume.fallback')}</p>
      </object>
    </div>
  );
}

function ResumePreview({ src }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="grid aspect-[1/1.414] w-full max-w-xs place-items-center rounded-md border border-border bg-surface-2">
        <FileText aria-hidden className="size-12 text-muted" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={t('resume.previewAlt')}
      onError={() => setFailed(true)}
      className="w-full max-w-xs rounded-md border border-border shadow-window"
    />
  );
}
