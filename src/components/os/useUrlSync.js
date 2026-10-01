import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { isAppId } from '../../lib/apps-meta.js';
import { useOS } from '../../lib/os-store.js';

/**
 * Mantém janelas e URL em sincronia no desktop (§6.1):
 * - URL → sistema: abrir /{locale}/{appId} (link direto, Voltar do navegador,
 *   assistente, Terminal) abre ou foca o app;
 * - sistema → URL: focar uma janela atualiza a URL; fechar todas volta a /{locale}.
 */
export function useUrlSync(locale, appId) {
  const navigate = useNavigate();
  const { key } = useLocation();
  const focusedAppId = useOS(
    (state) => state.windows.find((win) => win.id === state.focusedId)?.appId ?? null,
  );
  const hasWindows = useOS((state) => state.windows.length > 0);

  // URL → sistema
  useEffect(() => {
    if (!appId || !isAppId(appId)) return;
    const { windows, focusedId, openApp } = useOS.getState();
    const win = windows.find((w) => w.appId === appId);
    if (!win || focusedId !== win.id || win.state === 'minimized') openApp(appId);
  }, [appId, key]);

  // sistema → URL
  useEffect(() => {
    const current = window.location.pathname.split('/')[2];
    if (focusedAppId && focusedAppId !== current) {
      navigate(`/${locale}/${focusedAppId}`);
    } else if (!hasWindows && current && isAppId(current)) {
      navigate(`/${locale}`);
    }
    // Reage só a mudanças de foco/janelas, não a mudanças de URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedAppId, hasWindows]);
}
