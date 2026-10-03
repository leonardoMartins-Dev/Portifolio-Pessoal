import { LAYOUT } from './layout.js';
import { MODEL_URLS, useModel } from './models.js';

/** Planta em vaso (Poly Haven), reduzida para caber na mesa (~40 cm). */
export function Plant() {
  const { root } = useModel(MODEL_URLS.plant);
  return <primitive object={root} {...LAYOUT.plant} scale={4.8} />;
}
