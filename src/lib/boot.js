import { isLocale } from '../i18n/locales.js';
import { KEYS, session } from './storage.js';

/** O navegador consegue rodar a intro 3D? (WebGL + heurística de hardware) */
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

export function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Fase inicial do sistema (§8.3):
 * - deep link (/{locale}/{appId}) → direto ao desktop, sem boot;
 * - intro já vista na sessão, movimento reduzido ou sem WebGL → boot curto em HTML;
 * - senão → intro 3D.
 */
export function decideInitialPhase({
  pathname,
  introSeen = session.getItem(KEYS.introSeen) === '1',
  reducedMotion = prefersReducedMotion(),
  supportsIntro = canRunIntro,
}) {
  const segments = pathname.split('/').filter(Boolean);
  const deepLink = segments.length >= 2 || (segments.length === 1 && !isLocale(segments[0]));
  if (deepLink) return 'desktop';
  if (introSeen || reducedMotion || !supportsIntro()) return 'boot';
  return 'intro';
}

export function markIntroSeen() {
  session.setItem(KEYS.introSeen, '1');
}

export function clearIntroSeen() {
  session.removeItem(KEYS.introSeen);
}
