import { RoundedBox } from '@react-three/drei';
import { clay } from '../materials.js';
import { MONITOR } from './layout.js';

const BODY = clay('#4a4558', { roughness: 0.45 });
const NECK_H = MONITOR.centerY - MONITOR.body[1] / 2 + 0.2;

/**
 * Monitor no estilo da cena: carcaça arroxeada arredondada, pé e base.
 * `screenMaterial` desenha a tela (16:10).
 */
export function Monitor({ position, rotationY, screenMaterial }) {
  const [width, height, depth] = MONITOR.body;
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox
        args={[2.3, 0.14, 1.45]}
        radius={0.07}
        smoothness={3}
        position={[0, 0.07, -0.2]}
        material={BODY}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[0.6, NECK_H, 0.26]}
        radius={0.1}
        smoothness={2}
        position={[0, NECK_H / 2, -0.42]}
        material={BODY}
        castShadow
      />
      <group position-y={MONITOR.centerY}>
        <RoundedBox
          args={[width, height, depth]}
          radius={0.16}
          smoothness={4}
          material={BODY}
          castShadow
        />
        <RoundedBox
          args={[3.3, 2.3, 0.4]}
          radius={0.18}
          smoothness={3}
          position-z={-0.28}
          material={BODY}
          castShadow
        />
        <mesh position-z={depth / 2 + 0.004} material={screenMaterial}>
          <planeGeometry args={[MONITOR.screen.w, MONITOR.screen.h]} />
        </mesh>
      </group>
    </group>
  );
}
