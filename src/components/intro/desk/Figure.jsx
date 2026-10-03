import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Interactive } from './Interactive.jsx';
import { LAYOUT } from './layout.js';
import { LuffyModel } from './Luffy.jsx';
import { useInvalidateShadows } from './shadows.js';

// O modelo mede ~1,6 "cabeças" de altura; na mesa, ~19 cm (tamanho de um boneco grande).
const SCALE = 1.2;
const BOBBLE_SECONDS = 1.8;

/** Boneco do Luffy em cima da mesa. Clique: a cabeça balança e o notebook abre no Sobre. */
export function Figure({ interaction, onActivate }) {
  const headRef = useRef(null);
  const bobbleStart = useRef(-Infinity);
  // O clique só pede; o início é marcado no relógio da cena, no próximo quadro.
  const bobbleRequested = useRef(false);
  const invalidateShadows = useInvalidateShadows();

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
      invalidateShadows(1);
    } else if (head.rotation.z !== 0 || head.rotation.x !== 0) {
      head.rotation.set(0, 0, 0);
    }
  });

  return (
    <Interactive
      {...interaction}
      {...LAYOUT.figure}
      labelPosition={[0, 2.4, 0]}
      onActivate={() => {
        bobbleRequested.current = true;
        onActivate();
      }}
    >
      <group scale={SCALE}>
        <LuffyModel headRef={headRef} />
      </group>
    </Interactive>
  );
}
