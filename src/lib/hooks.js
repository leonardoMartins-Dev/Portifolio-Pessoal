import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useOS } from './os-store.js';

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Celular: abaixo de 768px o sistema vira a interface de telefone. */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767.98px)');
}

/** Movimento reduzido: preferência do sistema OU o ajuste do usuário. */
export function useReducedMotion() {
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const setting = useOS((state) => state.reducedMotion);
  return prefersReduced || setting;
}

function subscribeVisibility(onChange) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/** true enquanto a aba está visível (o polling só roda nesse caso). */
export function usePageVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'visible',
    () => true,
  );
}

/** Data atual, atualizada a cada `intervalMs`. */
export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Idioma atual ('pt' | 'en'). */
export function useLocale() {
  const { i18n } = useTranslation();
  return i18n.resolvedLanguage === 'en' ? 'en' : 'pt';
}

/** Lê um texto `{ pt, en }` no idioma atual. */
export function useLocalized() {
  const locale = useLocale();
  return useCallback((value) => value?.[locale] ?? '', [locale]);
}

/** Tecla de atalho do assistente conforme o sistema: ⌘K no Mac, Ctrl K nos demais. */
export function useShortcutLabel() {
  const isMac =
    typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform ?? '');
  return isMac ? '⌘K' : 'Ctrl K';
}
