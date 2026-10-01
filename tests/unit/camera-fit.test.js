import { describe, expect, it } from 'vitest';
import { coverDistance, visibleSize } from '../../src/lib/camera-fit.js';

const SCREEN = { planeWidth: 2.8, planeHeight: 1.75 };
const FOV = 35;

/** Viewports dos critérios de aceite da intro (§8.4). */
const VIEWPORTS = [
  [375, 812],
  [768, 1024],
  [1440, 900],
  [2560, 1440],
];

describe('enquadramento final da intro (cover)', () => {
  it.each(VIEWPORTS)('a tela cobre o viewport %ix%i sem sobrar borda', (width, height) => {
    const aspect = width / height;
    const distance = coverDistance({ ...SCREEN, fov: FOV, aspect });
    const visible = visibleSize({ distance, fov: FOV, aspect });
    // A área visível cabe dentro da tela (nenhuma borda aparece)…
    expect(visible.width).toBeLessThanOrEqual(SCREEN.planeWidth + 1e-9);
    expect(visible.height).toBeLessThanOrEqual(SCREEN.planeHeight + 1e-9);
    // …e encosta em pelo menos uma das dimensões (não corta mais que o necessário).
    const touches =
      Math.abs(visible.width - SCREEN.planeWidth) < 1e-9 ||
      Math.abs(visible.height - SCREEN.planeHeight) < 1e-9;
    expect(touches).toBe(true);
  });

  it('em 16:10 a tela preenche exatamente o viewport', () => {
    const distance = coverDistance({ ...SCREEN, fov: FOV, aspect: 16 / 10 });
    const visible = visibleSize({ distance, fov: FOV, aspect: 16 / 10 });
    expect(visible.width).toBeCloseTo(2.8);
    expect(visible.height).toBeCloseTo(1.75);
  });
});
