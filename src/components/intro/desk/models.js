import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';

/** Modelos do Poly Haven (CC0), comprimidos com meshopt + WebP — ver `npm run models`. */
export const MODEL_URLS = {
  desk: '/models/wooden_table_02.glb',
  lamp: '/models/desk_lamp_arm_01.glb',
  plant: '/models/potted_plant_02.glb',
};

/** Sem Draco: nada de decodificador baixado de CDN (o meshopt já vem no pacote). */
const USE_DRACO = false;

export function preloadModels({ plant = true } = {}) {
  useGLTF.preload(MODEL_URLS.desk, USE_DRACO);
  useGLTF.preload(MODEL_URLS.lamp, USE_DRACO);
  if (plant) useGLTF.preload(MODEL_URLS.plant, USE_DRACO);
}

/** Cópia do modelo com sombras ligadas; `setup` pode ajustar a cópia (nunca o original em cache). */
export function useModel(url, setup) {
  const { scene } = useGLTF(url, USE_DRACO);
  return useMemo(() => {
    const root = scene.clone(true);
    root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return { root, ...setup?.(root) };
    // `setup` é estático em cada chamador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
}
