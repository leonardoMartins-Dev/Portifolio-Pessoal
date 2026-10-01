import { MotionConfig } from 'motion/react';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { OS } from './components/os/OS.jsx';
import { detectLocale, intlLocale, isLocale } from './i18n/locales.js';
import { useReducedMotion } from './lib/hooks.js';
import { useApplyTheme } from './lib/theme.js';

export default function App() {
  useApplyTheme();
  const reducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      <Routes>
        <Route path="/" element={<Navigate to={`/${detectLocale()}`} replace />} />
        <Route path="/:locale/:appId?" element={<LocaleRoot />} />
        <Route path="*" element={<Navigate to={`/${detectLocale()}`} replace />} />
      </Routes>
    </MotionConfig>
  );
}

/** Valida o idioma da URL e mantém i18n e <html lang> em sincronia com ele. */
function LocaleRoot() {
  const { locale, appId } = useParams();
  const { search } = useLocation();
  const { i18n } = useTranslation();
  const valid = isLocale(locale);

  useLayoutEffect(() => {
    if (!valid) return;
    if (i18n.resolvedLanguage !== locale) i18n.changeLanguage(locale);
    document.documentElement.lang = intlLocale(locale);
  }, [i18n, locale, valid]);

  if (!valid) {
    // /projects → /pt/projects (o primeiro segmento não era um idioma).
    const rest = [locale, appId].filter(Boolean).join('/');
    return <Navigate to={`/${detectLocale()}/${rest}${search}`} replace />;
  }
  return <OS locale={locale} appId={appId} />;
}
