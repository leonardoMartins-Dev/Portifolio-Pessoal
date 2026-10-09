import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { LuffyModel } from '../Luffy.jsx';
import { LAYOUT } from './layout.js';

// O modelo mede ~1,6 "cabeças"; na mesa ele fica do tamanho da cabeça do boneco.
const SCALE = 1.5;
const BOBBLE_SECONDS = 1.8;

/** Boneco do Luffy no canto da mesa. Clique: a cabeça balança. */
export function LuffyFigure({ enabled }) {
  const headRef = useRef(null);
  const bobbleStart = useRef(-Infinity);
  // O clique só pede; o início é marcado no relógio da cena, no próximo quadro.
  const bobbleRequested = useRef(false);

  useFrame(({ clock }) => {
    if (bobbleRequested.current) {
      bobbleRequested.current = false;
      bobbleStart.current = clock.elapsedTime;
    }
    const head = headRef.current;
    if (!head) return;
    const t = clock.elapsedTime - bobbleStart.current;
    if (t < BOBBLE_SECONDS) {
      const decay = Math.exp(-t * 2.4);
      head.rotation.z = Math.sin(t * 13) * 0.16 * decay;
      head.rotation.x = Math.sin(t * 9 + 1) * 0.08 * decay;
    } else if (head.rotation.z !== 0 || head.rotation.x !== 0) {
      head.rotation.set(0, 0, 0);
    }
  });

  return (
    <group
      {...LAYOUT.luffy}
      onClick={(event) => {
        event.stopPropagation();
        if (enabled) bobbleRequested.current = true;
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (enabled) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <group scale={SCALE}>
        <LuffyModel headRef={headRef} />
      </group>
    </group>
  );
}
