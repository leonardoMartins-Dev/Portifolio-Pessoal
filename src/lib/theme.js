import { useEffect } from 'react';
import { useMediaQuery } from './hooks.js';
import { useOS } from './os-store.js';

/** Tema efetivo ('light' | 'dark'), resolvendo 'system' pela preferência do SO. */
export function useResolvedTheme() {
  const theme = useOS((state) => state.theme);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return theme;
}

/** Aplica o tema no <html> (data-theme, color-scheme e theme-color). */
export function useApplyTheme() {
  const resolved = useResolvedTheme();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#0e0f14' : '#f4f5f8');
  }, [resolved]);
  return resolved;
}
