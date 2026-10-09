import { MeshBasicMaterial, MeshStandardMaterial } from 'three';

const cache = new Map();

function cached(key, create) {
  let material = cache.get(key);
  if (!material) {
    material = create();
    cache.set(key, material);
  }
  return material;
}

/**
 * Material "massinha" (o visual da página inicial): cor chapada, fosco e sem
 * metal. Um por combinação de parâmetros, compartilhado entre as cenas.
 */
export function clay(color, { roughness = 0.62, ...extra } = {}) {
  return cached(JSON.stringify(['clay', color, roughness, extra]), () => {
    return new MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });
  });
}

/** Cor que não recebe luz nem tone mapping (telas, LEDs). */
export function glow(color) {
  return cached(JSON.stringify(['glow', color]), () => {
    return new MeshBasicMaterial({ color, toneMapped: false });
  });
}
