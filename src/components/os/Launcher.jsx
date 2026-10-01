import { Bot } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { navigateToApp } from '../../lib/os-bridge.js';
import { useOS } from '../../lib/os-store.js';
import { Spinner } from '../ui/Spinner.jsx';

// O chat (AI SDK + markdown) só é baixado quando o lançador abre.
const ChatPanel = lazy(() =>
  import('../chat/ChatPanel.jsx').then((module) => ({ default: module.ChatPanel })),
);

/** Lançador central do assistente (Ctrl/⌘K), estilo "spotlight". */
export function Launcher() {
  const { t } = useTranslation();
  const open = useOS((state) => state.launcherOpen);
  const closeLauncher = useOS((state) => state.closeLauncher);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      return;
    }
    // Ao fechar, devolve o foco para onde estava.
    if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="launcher"
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/20 px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onPointerDown={(event) => event.target === event.currentTarget && closeLauncher()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="launcher-title"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            className="flex max-h-[76vh] w-full max-w-xl flex-col overflow-hidden rounded-lg shadow-window-focused glass"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 id="launcher-title" className="flex items-center gap-2 text-sm font-semibold">
                <Bot aria-hidden className="size-4 text-accent-ink" />
                {t('assistant.launcherTitle')}
              </h2>
              <span className="text-[11px] text-muted">{t('assistant.launcherHint')}</span>
            </div>
            <Suspense
              fallback={
                <div className="grid h-40 place-items-center">
                  <Spinner className="size-5 text-muted" />
                </div>
              }
            >
              <ChatPanel
                compact
                autoFocus
                footer={
                  <button
                    type="button"
                    onClick={() => {
                      closeLauncher();
                      navigateToApp('assistant');
                    }}
                    className="font-medium text-accent-ink hover:underline"
                  >
                    {t('assistant.openFull')}
                  </button>
                }
              />
            </Suspense>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
