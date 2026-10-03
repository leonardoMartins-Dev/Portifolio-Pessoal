import { Box3 } from 'three';
import { DESK_SCALE } from './layout.js';
import { MODEL_URLS, useModel } from './models.js';

function prepareDesk(model) {
  model.scale.set(...DESK_SCALE);
  // Tira um pouco do laranja da madeira sob a luz quente.
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.color.set('#e2d4c4');
      // Menos reflexo da sala: em ângulo rasante a madeira puxava o roxo da HDRI.
      child.material.envMapIntensity = 0.35;
    }
  });
  model.position.y = -new Box3().setFromObject(model).max.y;
}

/** Mesa de madeira (Poly Haven), esticada e com o tampo em y = 0. */
export function Desk() {
  const { root } = useModel(MODEL_URLS.desk, prepareDesk);
  return <primitive object={root} />;
}
