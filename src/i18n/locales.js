import { siteConfig } from '../site.config.js';

export const LOCALES = ['pt', 'en'];
export const DEFAULT_LOCALE = siteConfig.defaultLocale;

export function isLocale(value) {
  return LOCALES.includes(value);
}

/** Idioma inicial: português se o navegador pedir, inglês se pedir inglês, senão o padrão. */
export function detectLocale(languages = globalThis.navigator?.languages ?? []) {
  for (const language of languages) {
    const code = language.toLowerCase().slice(0, 2);
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

/** Locale BCP 47 usado no Intl (datas, horas, números). */
export function intlLocale(locale) {
  return locale === 'pt' ? 'pt-BR' : 'en-US';
}
