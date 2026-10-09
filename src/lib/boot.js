import { isLocale } from '../i18n/locales.js';
import { KEYS, session } from './storage.js';

/** O navegador consegue rodar o 3D da página inicial? (WebGL + heurística de hardware) */
export function canRunIntro() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
  } catch {
    return false;
  }
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = navigator.deviceMemory ?? 4;
  return cores > 2 && memory > 2;
}

/**
 * Fase inicial do sistema (§8.3). Recarregar (F5) continua onde o visitante estava:
 * - deep link (/{locale}/{appId}) → direto ao desktop, sem boot;
 * - estava no sistema nesta sessão (recarregou) → boot curto em HTML;
 * - senão (primeira visita ou recarregou na página inicial) → página inicial (o
 *   quarto 3D; sem WebGL ou com movimento reduzido ela aparece sem o 3D ou sem o
 *   zoom), que termina na tela de bloqueio.
 */
export function decideInitialPhase({
  pathname,
  introSeen = session.getItem(KEYS.introSeen) === '1',
}) {
  const segments = pathname.split('/').filter(Boolean);
  const deepLink = segments.length >= 2 || (segments.length === 1 && !isLocale(segments[0]));
  if (deepLink) return 'desktop';
  if (introSeen) return 'boot';
  return 'intro';
}

/** Guarda na sessão se o visitante está na página inicial ou no sistema (lido no F5). */
export function rememberPhase(phase) {
  if (phase === 'intro') session.removeItem(KEYS.introSeen);
  else session.setItem(KEYS.introSeen, '1');
}
