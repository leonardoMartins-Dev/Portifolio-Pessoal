import { AnimatePresence } from 'motion/react';
import { useOS } from '../../lib/os-store.js';
import { Window } from './Window.jsx';

/** Renderiza as janelas visíveis (minimizadas ficam só no dock). */
export function WindowLayer() {
  const windows = useOS((state) => state.windows);
  const focusedId = useOS((state) => state.focusedId);
  const area = useOS((state) => state.workArea);

  return (
    <AnimatePresence>
      {windows
        .filter((win) => win.state !== 'minimized')
        .map((win) => (
          <Window key={win.id} win={win} focused={win.id === focusedId} area={area} />
        ))}
    </AnimatePresence>
  );
}
