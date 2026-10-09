import { useTranslation } from 'react-i18next';
import { LocaleToggle } from '../os/LocaleToggle.jsx';
import { ThemeToggle } from '../os/ThemeToggle.jsx';
import { Logo } from '../ui/Logo.jsx';

const PILL = 'bg-land-surface/85 shadow-[0_2px_10px_-4px_rgb(0_0_0/0.25)] backdrop-blur-md';

/** Cabeçalho fixo: logo (volta ao topo), seções da página, idioma, tema e "Fale comigo". */
export function LandingHeader({ hidden, active, onNavigate, onTop }) {
  const { t } = useTranslation();
  const links = [
    ['sobre', t('landing.nav.about')],
    ['skills', t('landing.nav.skills')],
    ['contato', t('landing.nav.contact')],
  ];

  function navigate(event, id) {
    event.preventDefault();
    onNavigate(id);
  }

  return (
    <header
      inert={hidden}
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 pt-4 transition-opacity duration-300 sm:px-6 sm:pt-5 ${
        hidden ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        onClick={onTop}
        aria-label={t('landing.nav.top')}
        className={`pointer-events-auto grid size-11 place-items-center rounded-full text-land-ink ${PILL}`}
      >
        <Logo className="size-7" />
      </button>

      <nav
        aria-label={t('landing.nav.label')}
        className={`pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 rounded-full p-1 md:flex ${PILL}`}
      >
        {links.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(event) => navigate(event, id)}
            aria-current={active === id ? 'true' : undefined}
            className={`rounded-full px-5 py-1.5 text-[13px] font-semibold tracking-wide uppercase transition-colors ${
              active === id ? 'bg-accent text-white' : 'text-land-ink hover:bg-land-line'
            }`}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="pointer-events-auto flex items-center gap-2">
        <div className={`flex h-11 items-center gap-1 rounded-full px-2.5 text-land-ink ${PILL}`}>
          <LocaleToggle />
          <ThemeToggle />
        </div>
        <a
          href="#contato"
          onClick={(event) => navigate(event, 'contato')}
          className="hidden h-11 items-center rounded-full bg-accent px-5 text-[13px] font-bold tracking-wide text-white uppercase shadow-[0_6px_18px_-6px_var(--accent)] transition-[filter] hover:brightness-110 sm:flex"
        >
          {t('landing.cta')}
        </a>
      </div>
    </header>
  );
}
