import { Award, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { certificates } from '../../content/certificates.js';
import { getAppMeta } from '../../lib/apps-meta.js';
import { formatDate } from '../../lib/format.js';
import { useLocale, useLocalized } from '../../lib/hooks.js';
import { sortCertificatesDescending } from '../../lib/timeline.js';
import { AppScroll } from '../ui/AppSection.jsx';
import { Button } from '../ui/Button.jsx';
import { Chip } from '../ui/Chip.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';

const TINT = getAppMeta('certificates').tint;

/** Certificados: cursos concluídos, do mais recente ao mais antigo. */
export default function Certificates() {
  const { t } = useTranslation();
  const sorted = sortCertificatesDescending(certificates);

  if (!sorted.length) {
    return <EmptyState icon={Award} title={t('certificates.empty')} className="h-full" />;
  }

  const hours = sorted.reduce((sum, certificate) => sum + (certificate.hours ?? 0), 0);
  const summary = [
    t('certificates.count', { count: sorted.length }),
    hours > 0 && t('certificates.totalHours', { hours }),
  ].filter(Boolean);

  return (
    <AppScroll>
      <header>
        <h3 className="text-xl font-semibold tracking-tight">{t('certificates.heading')}</h3>
        <p className="text-sm text-muted">{summary.join(' · ')}</p>
      </header>
      <ul aria-label={t('certificates.heading')} className="mt-5 flex flex-col gap-4">
        {sorted.map((certificate) => (
          <li key={certificate.id}>
            <CertificateCard certificate={certificate} />
          </li>
        ))}
      </ul>
    </AppScroll>
  );
}

function CertificateCard({ certificate }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const locale = useLocale();
  const titleId = `certificate-${certificate.id}`;
  const details = [
    certificate.issuer,
    formatDate(certificate.date, locale),
    certificate.hours && t('certificates.hours', { hours: certificate.hours }),
  ].filter(Boolean);

  return (
    // Pela largura da janela (container query): lado a lado quando cabe, empilhado quando não.
    <article aria-labelledby={titleId} className="@container">
      <div className="flex flex-col overflow-hidden rounded-md border border-border bg-surface-2 @lg:flex-row">
        <CertificatePreview certificate={certificate} />
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div>
            <h4 id={titleId} className="text-base leading-snug font-semibold">
              {certificate.name}
            </h4>
            <p className="mt-0.5 text-sm text-muted">
              {details.map((detail, index) => (
                <span key={detail}>
                  {index > 0 && <span aria-hidden> · </span>}
                  {index === 1 ? <time dateTime={certificate.date}>{detail}</time> : detail}
                </span>
              ))}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted">{l(certificate.description)}</p>
          {certificate.topics?.length > 0 && (
            <ul aria-label={t('certificates.topics')} className="flex flex-wrap gap-1.5">
              {certificate.topics.map((topic) => (
                <li key={topic.en}>
                  <Chip>{l(topic)}</Chip>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            {certificate.file && (
              <>
                <Button size="sm" variant="primary" href={certificate.file} external>
                  <ExternalLink aria-hidden className="size-3.5" />
                  {t('certificates.open')}
                  <span className="sr-only">{t('common.newTab')}</span>
                </Button>
                <Button size="sm" href={certificate.file} download>
                  <Download aria-hidden className="size-3.5" />
                  {t('certificates.download')}
                </Button>
              </>
            )}
            {certificate.credentialUrl && (
              <Button size="sm" variant="ghost" href={certificate.credentialUrl} external>
                <ShieldCheck aria-hidden className="size-3.5" />
                {t('certificates.verify')}
                <span className="sr-only">{t('common.newTab')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Prévia do certificado num painel (abre o PDF no clique); sem imagem, um selo na cor do app. */
function CertificatePreview({ certificate }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const frame = 'aspect-[1.414] w-full rounded-[6px] shadow-[0_1px_3px_rgb(0_0_0/0.25)]';

  let content;
  if (!certificate.image || failed) {
    content = (
      <div
        aria-hidden
        className={`grid place-items-center ${frame}`}
        style={{ background: `linear-gradient(145deg, ${TINT[0]}, ${TINT[1]})` }}
      >
        <Award className="size-12 text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.25)]" />
      </div>
    );
  } else {
    const image = (
      <img
        src={certificate.image}
        alt={t('certificates.previewAlt', { name: certificate.name, issuer: certificate.issuer })}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`bg-white object-contain ${frame}`}
      />
    );
    // O botão "Ver certificado" já leva ao PDF pelo teclado; a prévia é o atalho do mouse.
    content = certificate.file ? (
      <a
        href={certificate.file}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        className="block w-full transition-transform duration-200 hover:scale-[1.015]"
      >
        {image}
      </a>
    ) : (
      image
    );
  }

  return (
    <div className="flex shrink-0 items-center justify-center border-b border-border bg-surface p-3 @lg:w-72 @lg:border-r @lg:border-b-0">
      {content}
    </div>
  );
}
