import { isAppId } from '../apps-meta.js';
import { navigateToApp, switchLocale } from '../os-bridge.js';
import { useOS } from '../os-store.js';

/** Executa no navegador uma ferramenta pedida pelo assistente. */
export function runClientTool(toolName, input = {}) {
  switch (toolName) {
    case 'openApp':
      if (!isAppId(input.appId)) return { ok: false, error: 'unknown app' };
      navigateToApp(input.appId);
      return { ok: true };
    case 'showProject':
      navigateToApp('projects', `?project=${encodeURIComponent(input.projectId ?? '')}`);
      return { ok: true };
    case 'setLanguage':
      switchLocale(input.locale);
      return { ok: true };
    case 'setTheme':
      if (input.theme !== 'light' && input.theme !== 'dark') return { ok: false };
      useOS.getState().setTheme(input.theme);
      return { ok: true };
    default:
      return { ok: false, error: 'unknown tool' };
  }
}
