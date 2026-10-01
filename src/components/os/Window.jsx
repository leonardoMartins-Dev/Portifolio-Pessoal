import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApp } from '../../lib/apps.jsx';
import { useLocalized } from '../../lib/hooks.js';
import { useOS } from '../../lib/os-store.js';
import { playSound } from '../../lib/sound.js';
import { AppIcon } from '../ui/AppIcon.jsx';
import { AppSkeleton } from './AppSkeleton.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';

const SPRING = { type: 'spring', stiffness: 460, damping: 36, mass: 0.8 };
const RESIZE_DIRECTIONS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
// As alças ficam um pouco para fora da borda, onde o canto arredondado não recorta.
const RESIZE_CLASSES = {
  n: '-top-1 inset-x-3 h-2 cursor-ns-resize',
  s: '-bottom-1 inset-x-3 h-2 cursor-ns-resize',
  e: '-right-1 inset-y-3 w-2 cursor-ew-resize',
  w: '-left-1 inset-y-3 w-2 cursor-ew-resize',
  ne: '-top-1 -right-1 size-4 cursor-nesw-resize',
  nw: '-top-1 -left-1 size-4 cursor-nwse-resize',
  se: '-bottom-1 -right-1 size-4 cursor-nwse-resize',
  sw: '-bottom-1 -left-1 size-4 cursor-nesw-resize',
};

/** Deslocamento do centro da janela até o ícone do app no dock. */
function offsetToDock(appId, rect) {
  const icon = document.querySelector(`[data-dock-app="${appId}"]`);
  const area = document.querySelector('main[aria-label]');
  if (!icon || !area) return { x: 0, y: 40 };
  const iconBox = icon.getBoundingClientRect();
  const areaBox = area.getBoundingClientRect();
  return {
    x: iconBox.left + iconBox.width / 2 - (areaBox.left + rect.x + rect.w / 2),
    y: iconBox.top + iconBox.height / 2 - (areaBox.top + rect.y + rect.h / 2),
  };
}

/** Arrasta com o ponteiro, chamando `onMove(dx, dy)` a cada movimento. */
function startPointerDrag(event, onMove) {
  const startX = event.clientX;
  const startY = event.clientY;
  document.body.classList.add('is-dragging');
  const move = (e) => onMove(e.clientX - startX, e.clientY - startY);
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    document.body.classList.remove('is-dragging');
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

export function Window({ win, focused, area }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const ref = useRef(null);
  const app = getApp(win.appId);
  const AppComponent = app.component;
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, moveWindow, resizeWindow } =
    useOS.getState();
  const maximized = win.state === 'maximized';
  const rect = maximized ? { x: 0, y: 0, w: area.w, h: area.h } : win;
  const titleId = `window-title-${win.id}`;
  const [origin] = useState(() => offsetToDock(win.appId, rect));
  const [animatingSize, setAnimatingSize] = useState(false);

  useEffect(() => playSound('open'), []);

  // A janela focada recebe o foco do teclado.
  useEffect(() => {
    if (focused && !ref.current?.contains(document.activeElement)) {
      ref.current?.focus({ preventScroll: true });
    }
  }, [focused]);

  function handleToggleMaximize() {
    setAnimatingSize(true);
    toggleMaximize(win.id);
    setTimeout(() => setAnimatingSize(false), 240);
  }

  function handleTitlePointerDown(event) {
    if (event.button !== 0 || event.target.closest('button')) return;
    focusWindow(win.id);
    if (maximized) return;
    const start = { x: win.x, y: win.y };
    startPointerDrag(event, (dx, dy) => moveWindow(win.id, start.x + dx, start.y + dy));
  }

  function handleResizePointerDown(direction) {
    return (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      focusWindow(win.id);
      const start = { x: win.x, y: win.y, w: win.w, h: win.h };
      const { minSize } = app;
      startPointerDrag(event, (dx, dy) => {
        const next = { ...start };
        if (direction.includes('e')) next.w = start.w + dx;
        if (direction.includes('s')) next.h = start.h + dy;
        if (direction.includes('w')) {
          next.w = Math.max(minSize.w, start.w - dx);
          next.x = start.x + start.w - next.w;
        }
        if (direction.includes('n')) {
          next.h = Math.max(minSize.h, start.h - dy);
          next.y = start.y + start.h - next.h;
        }
        resizeWindow(win.id, next);
      });
    };
  }

  function handleClose() {
    playSound('close');
    closeWindow(win.id);
  }

  return (
    <motion.section
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      aria-modal="false"
      tabIndex={-1}
      data-window={win.appId}
      onPointerDownCapture={() => !focused && focusWindow(win.id)}
      className={`absolute rounded-md border bg-surface outline-none ${
        focused ? 'border-border-strong shadow-window-focused' : 'border-border shadow-window'
      } ${animatingSize ? 'transition-[left,top,width,height] duration-200 ease-out' : ''}`}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex: win.z }}
      initial={{ opacity: 0, scale: 0.4, x: origin.x, y: origin.y }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit="exit"
      variants={{
        // Minimizar: volta para o ícone no dock. Fechar: encolhe e some.
        exit: () =>
          useOS.getState().windows.some((w) => w.id === win.id)
            ? { opacity: 0, scale: 0.3, ...offsetToDock(win.appId, rect), transition: SPRING }
            : { opacity: 0, scale: 0.94, transition: { duration: 0.15 } },
      }}
      transition={SPRING}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[inherit]">
        <header
          onPointerDown={handleTitlePointerDown}
          onDoubleClick={(e) => !e.target.closest('button') && handleToggleMaximize()}
          className={`flex h-10 shrink-0 items-center gap-2.5 border-b border-border pr-1.5 pl-3 select-none ${
            maximized ? '' : 'cursor-grab active:cursor-grabbing'
          } ${focused ? 'bg-surface' : 'bg-surface-2'}`}
        >
          <AppIcon app={app} size="sm" />
          <h2
            id={titleId}
            className={`min-w-0 flex-1 truncate text-[13px] font-medium ${focused ? 'text-text' : 'text-muted'}`}
          >
            {l(app.title)}
          </h2>
          <div role="group" aria-label={t('window.controls')} className="flex items-center gap-0.5">
            <WindowButton label={t('common.minimize')} onClick={() => minimizeWindow(win.id)}>
              <Minus className="size-4" />
            </WindowButton>
            <WindowButton
              label={maximized ? t('common.restore') : t('common.maximize')}
              onClick={handleToggleMaximize}
            >
              {maximized ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </WindowButton>
            <WindowButton label={t('common.close')} onClick={handleClose} danger>
              <X className="size-4" />
            </WindowButton>
          </div>
        </header>

        <div className="relative min-h-0 flex-1">
          <ErrorBoundary>
            <Suspense fallback={<AppSkeleton />}>
              <AppComponent appId={win.appId} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {!maximized &&
        RESIZE_DIRECTIONS.map((direction) => (
          <div
            key={direction}
            aria-hidden
            onPointerDown={handleResizePointerDown(direction)}
            className={`absolute z-10 ${RESIZE_CLASSES[direction]}`}
          />
        ))}
    </motion.section>
  );
}

function WindowButton({ label, onClick, danger, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid size-7 place-items-center rounded-[8px] text-muted transition-colors hover:text-text ${
        danger ? 'hover:bg-danger hover:text-white' : 'hover:bg-border'
      }`}
    >
      {children}
    </button>
  );
}
