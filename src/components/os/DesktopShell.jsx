import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isAppId } from '../../lib/apps-meta.js';
import { useOS } from '../../lib/os-store.js';
import { DesktopShortcuts } from './DesktopShortcuts.jsx';
import { Dock } from './Dock.jsx';
import { FirstVisitHint } from './FirstVisitHint.jsx';
import { Launcher } from './Launcher.jsx';
import { MenuBar } from './MenuBar.jsx';
import { NotFoundWindow } from './NotFoundWindow.jsx';
import { useUrlSync } from './useUrlSync.js';
import { Wallpaper } from './Wallpaper.jsx';
import { WindowLayer } from './WindowLayer.jsx';

/** Shell do desktop (≥ 768px): barra de menu (cabeçalho), janelas (conteúdo) e dock (rodapé). */
export function DesktopShell({ locale, appId }) {
  const { t } = useTranslation();
  const areaRef = useRef(null);
  // Primeira visita: o app Sobre abre sozinho e um aviso aponta o dock e o atalho.
  const [showHint, setShowHint] = useState(() => !useOS.getState().firstVisitDone && !appId);
  const notFound = Boolean(appId) && !isAppId(appId);

  useUrlSync(locale, appId);
  useWorkArea(areaRef);
  useGlobalShortcuts();

  useEffect(() => {
    if (!showHint) return;
    useOS.getState().openApp('about');
    useOS.getState().markFirstVisitDone();
    // Só na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Wallpaper />
      <MenuBar />
      <main
        ref={areaRef}
        aria-label={t('desktop.label')}
        className="absolute inset-x-0 top-[var(--menubar-h)] bottom-[var(--dock-h)] isolate"
      >
        <DesktopShortcuts />
        <WindowLayer />
        {notFound && <NotFoundWindow locale={locale} path={appId} />}
      </main>
      <Dock />
      {showHint && <FirstVisitHint onDismiss={() => setShowHint(false)} />}
      <Launcher />
    </div>
  );
}

/** Mede a área útil (entre a barra de menu e o dock) para posicionar as janelas. */
function useWorkArea(ref) {
  const setWorkArea = useOS((state) => state.setWorkArea);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWorkArea({ w: element.clientWidth, h: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, setWorkArea]);
}

/** Ctrl/⌘K abre o assistente; Esc fecha o lançador ou a janela em foco. */
function useGlobalShortcuts() {
  useEffect(() => {
    function onKeyDown(event) {
      const state = useOS.getState();
      // Bloqueado: as teclas são da tela de bloqueio.
      if (state.phase !== 'desktop') return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        state.toggleLauncher();
        return;
      }
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (state.launcherOpen) {
        state.closeLauncher();
      } else if (state.focusedId) {
        state.closeWindow(state.focusedId);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
