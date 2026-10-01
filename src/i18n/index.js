import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, detectLocale, isLocale, LOCALES } from './locales.js';
import en from './messages/en.json';
import pt from './messages/pt.json';

/** Idioma inicial: o da URL (/pt, /en) ou, na raiz, o do navegador. */
function initialLocale() {
  const segment = globalThis.location?.pathname.split('/')[1];
  return isLocale(segment) ? segment : detectLocale();
}

i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: initialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: LOCALES,
  initAsync: false,
  interpolation: { escapeValue: false },
});

export default i18n;
