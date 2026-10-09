import { LOCALES } from '../i18n/locales.js';
import { useOS } from './os-store.js';

/**
 * Ponte entre o roteador e o código que roda fora dos componentes
 * (ferramentas do assistente, comandos do Terminal). A URL é o comando:
 * navegar para /{locale}/{appId} abre o app no desktop e no celular.
 */
const router = { navigate: null, locale: 'pt', pathname: '/', search: '' };

export function registerRouter({ navigate, locale, pathname, search }) {
  Object.assign(router, { navigate, locale, pathname, search });
}

export function navigateToApp(appId, search = '') {
  router.navigate?.(`/${router.locale}/${appId}${search}`);
}

export function navigateHome() {
  router.navigate?.(`/${router.locale}`);
}

/**
 * Volta à página inicial: a câmera sai da tela do PC para o quarto (o monitor
 * continua ligado). Recarregar depois disso mostra a página inicial de novo (OS.jsx).
 */
export function returnToLanding() {
  useOS.getState().setPhase('intro', 'return');
}

/** Troca o idioma mantendo o app aberto: /pt/projects ↔ /en/projects. */
export function localizedPath(pathname, search, locale) {
  const rest = pathname.split('/').filter(Boolean);
  if (LOCALES.includes(rest[0])) rest.shift();
  return `/${[locale, ...rest].join('/')}${search}`;
}

export function switchLocale(locale) {
  if (!LOCALES.includes(locale)) return;
  router.navigate?.(localizedPath(router.pathname, router.search, locale), { replace: true });
}

export function currentLocale() {
  return router.locale;
}
