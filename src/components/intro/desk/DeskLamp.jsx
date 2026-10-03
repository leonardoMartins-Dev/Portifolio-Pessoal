import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Box3, Euler, MathUtils, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import { LAYOUT } from './layout.js';
import { MODEL_URLS, useModel } from './models.js';
import { Interactive } from './Interactive.jsx';

const SCALE = 8.5;
const WARM = '#ffd6a3';
const SPOT_INTENSITY = 170;

/** Acha a cúpula (material "light"): uma cópia do material, para acender, e o centro dela. */
function prepareLamp(model) {
  let bulb = null;
  const box = new Box3();
  model.traverse((child) => {
    // A luz sai de dentro da cúpula: se a luminária fizesse sombra, apagaria o próprio foco.
    if (child.isMesh) child.castShadow = false;
    // Corpo em preto fosco (o laranja original brigava com a paleta da cena).
    if (child.isMesh && !child.material.name.includes('light')) {
      child.material = child.material.clone();
      child.material.map = null;
      child.material.color.set('#1c1c1e');
      child.material.roughness = 0.5;
      child.material.metalness = 0.35;
    }
    if (child.isMesh && child.material.name.includes('light')) {
      child.material = child.material.clone();
      child.material.emissive.set(WARM);
      bulb = child.material;
      box.expandByObject(child);
    }
  });
  return { bulb, head: box.getCenter(new Vector3()) };
}

/**
 * Luminária articulada (Poly Haven). A luz quente sai da cúpula: o ponto é
 * achado pelo material "light" do modelo. Clique liga/desliga.
 */
export function DeskLamp({ on, castShadow, shadowSize, onToggle, interaction }) {
  const spotRef = useRef(null);
  const glowRef = useRef(null);
  const level = useRef(on ? 1 : 0);
  const bulbRef = useRef(null);
  const { root, bulb, head } = useModel(MODEL_URLS.lamp, prepareLamp);
  useEffect(() => {
    bulbRef.current = bulb;
  }, [bulb]);

  const { headWorld, target } = useMemo(() => {
    const { position, rotation } = LAYOUT.lamp;
    const matrix = new Matrix4().compose(
      new Vector3(...position),
      new Quaternion().setFromEuler(new Euler(...rotation)),
      new Vector3(SCALE, SCALE, SCALE),
    );
    const spotTarget = new Object3D();
    spotTarget.position.set(...LAYOUT.lampTarget);
    return { headWorld: head.clone().applyMatrix4(matrix), target: spotTarget };
  }, [head]);

  // Liga/desliga com um fade curto, em vez de piscar.
  useFrame((_, delta) => {
    level.current = MathUtils.damp(level.current, on ? 1 : 0, 10, delta);
    if (spotRef.current) spotRef.current.intensity = SPOT_INTENSITY * level.current;
    if (glowRef.current) glowRef.current.intensity = 4 * level.current;
    if (bulbRef.current) bulbRef.current.emissiveIntensity = 2.5 * level.current;
  });

  return (
    <>
      <Interactive
        {...interaction}
        position={LAYOUT.lamp.position}
        rotation={LAYOUT.lamp.rotation}
        labelPosition={[head.x * SCALE, head.y * SCALE + 1.4, head.z * SCALE]}
        onActivate={onToggle}
      >
        <primitive object={root} scale={SCALE} />
      </Interactive>
      <primitive object={target} />
      <spotLight
        ref={spotRef}
        position={headWorld}
        target={target}
        color={WARM}
        angle={0.85}
        penumbra={0.75}
        decay={2}
        castShadow={castShadow}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
      />
      <pointLight ref={glowRef} position={headWorld} color={WARM} distance={7} decay={2} />
    </>
  );
}
