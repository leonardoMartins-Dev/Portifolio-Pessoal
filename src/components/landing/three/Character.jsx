import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import {
  CatmullRomCurve3,
  ExtrudeGeometry,
  LatheGeometry,
  MathUtils,
  Object3D,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { ANKLE, characterMaterial, HEAD_Y, HIP, NECK_Y, SHIN, THIGH } from './character-look.js';

/*
 * Boneco do autor no estilo "massinha" da página inicial, feito a partir da
 * foto de perfil: cabelo preto cacheado com volume em cima e laterais curtas,
 * óculos de armação fina, pele morena e sorriso aberto. Camiseta preta, jeans
 * e tênis branco.
 *
 * Medidas em unidades da cena (cabeça ≈ 3,2; de pé ≈ 10,2). A origem é a
 * cintura e a frente é +z; de pé, a sola fica em y = −STAND_WAIST.
 */

const HEAD_R = 1.6;
const SHOULDER = { x: 1.12, y: 2.3 };
const UPPER_ARM = 1.2;

// Rotações [x, y, z] de cada articulação. Índice 0 = lado +x, 1 = lado −x.
// Braço e perna pendem para −y: x negativo leva para a frente; z abre para fora no lado +x.
const POSES = {
  stand: {
    spine: [0, 0, 0],
    head: [0.02, 0, 0],
    arms: [
      { shoulder: [0.04, 0, 0.14], elbow: [-0.22, 0, 0] },
      { shoulder: [0.04, 0, -0.14], elbow: [-0.22, 0, 0] },
    ],
    legs: [
      { hip: [0, 0, 0.03], knee: [0, 0, 0] },
      { hip: [0, 0, -0.03], knee: [0, 0, 0] },
    ],
  },
  sit: {
    spine: [0.12, 0, 0],
    head: [0.16, 0, 0],
    arms: [
      { shoulder: [-1.05, 0, 0.06], elbow: [-0.5, 0, -0.18] },
      { shoulder: [-1.05, 0, -0.06], elbow: [-0.5, 0, 0.18] },
    ],
    legs: [
      { hip: [-1.36, 0, 0.1], knee: [1.36, 0, 0] },
      { hip: [-1.36, 0, -0.1], knee: [1.36, 0, 0] },
    ],
  },
  sitWave: {
    spine: [0.02, 0, 0],
    head: [0.02, 0, 0],
    arms: [
      { shoulder: [-0.3, 0, 2.3], elbow: [0, 0, 0.75] },
      { shoulder: [-0.55, 0, -0.1], elbow: [-0.85, 0, 0.35] },
    ],
    legs: [
      { hip: [-1.36, 0, 0.1], knee: [1.36, 0, 0] },
      { hip: [-1.36, 0, -0.1], knee: [1.36, 0, 0] },
    ],
  },
  wave: {
    spine: [0, 0, -0.04],
    head: [0.02, 0, 0.06],
    arms: [
      { shoulder: [-0.15, 0, 2.45], elbow: [0, 0, 0.6] },
      { shoulder: [0.04, 0, -0.14], elbow: [-0.22, 0, 0] },
    ],
    legs: [
      { hip: [0, 0, 0.05], knee: [0, 0, 0] },
      { hip: [0, 0, -0.02], knee: [0, 0, 0] },
    ],
  },
};

/** Posição e rotação de um detalhe colado à superfície da cabeça (esfera de raio HEAD_R). */
function onFace(x, y, lift = 0) {
  const z = Math.sqrt(Math.max(0, HEAD_R * HEAD_R - x * x - y * y));
  const n = new Vector3(x, y, z).normalize();
  return {
    position: [x + n.x * lift, y + n.y * lift, z + n.z * lift],
    rotation: [-Math.asin(n.y), Math.atan2(n.x, n.z), 0, 'YXZ'],
  };
}

function roundedRect(width, height, radius) {
  const shape = new Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

// Geometrias fixas, criadas uma vez para todos os bonecos.
const GEOMETRY = (() => {
  const lens = roundedRect(0.92, 0.66, 0.22);
  lens.holes.push(roundedRect(0.78, 0.52, 0.16));
  const frame = new ExtrudeGeometry(lens, { depth: 0.05, bevelEnabled: false, curveSegments: 8 });
  frame.translate(0, 0, -0.025);

  const temple = (side) =>
    new TubeGeometry(
      new CatmullRomCurve3(
        [
          [1.0, -0.05, 1.34],
          [1.32, -0.04, 0.99],
          [1.55, -0.04, 0.5],
          [1.62, -0.07, 0.0],
          [1.56, -0.28, -0.4],
        ].map(([x, y, z]) => new Vector3(x * side, y, z)),
      ),
      20,
      0.035,
      6,
    );

  // Camiseta: perfil (raio, altura) girado em volta do eixo, achatado depois em z.
  const torso = new LatheGeometry(
    [
      [0, -0.12],
      [0.98, -0.12],
      [1.07, 0.06],
      [1.1, 0.8],
      [1.14, 1.6],
      [1.1, 2.1],
      [0.97, 2.45],
      [0.7, 2.68],
      [0.36, 2.78],
      [0, 2.8],
    ].map(([r, y]) => new Vector2(r, y)),
    36,
  );

  return {
    frame,
    temples: [temple(1), temple(-1)],
    torso,
    // Cabelo: calota no topo e uma parte de trás que desce até a nuca (as laterais ficam curtas).
    hairTop: new SphereGeometry(1.69, 48, 20, 0, Math.PI * 2, 0, 1.02),
    hairBack: new SphereGeometry(1.68, 40, 24, Math.PI + 0.55, Math.PI - 1.1, 0, 2.05),
    curl: new SphereGeometry(1, 14, 10),
  };
})();

/** Cachos: esferas espalhadas pela calota (mais altas no topo) e uma franja na testa. */
const CURLS = (() => {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const curls = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const count = 54;
  for (let index = 0; index < count; index += 1) {
    // Espiral de Fibonacci restrita à calota (θ até ~62° a partir do topo).
    const cosTheta = 1 - ((index + 0.5) / count) * (1 - Math.cos(1.08));
    const theta = Math.acos(cosTheta);
    const phi = golden * index;
    const radius = 1.72 + (1 - theta / 1.08) * 0.2 + random() * 0.05;
    curls.push({
      position: [
        -radius * Math.cos(phi) * Math.sin(theta),
        radius * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
      ],
      size: 0.3 + random() * 0.12,
    });
  }
  // Franja: uma fileira de cachos menores na linha do cabelo, na frente.
  for (let index = 0; index < 9; index += 1) {
    const phi = Math.PI / 2 + (index - 4) * 0.26;
    const theta = 0.98 + Math.abs(index - 4) * 0.025;
    const radius = 1.66;
    curls.push({
      position: [
        -radius * Math.cos(phi) * Math.sin(theta),
        radius * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
      ],
      size: 0.27 + random() * 0.06,
    });
  }
  return curls;
})();

const EYE = { x: 0.55, y: -0.12 };
const FACE = {
  eyes: [1, -1].map((side) => onFace(EYE.x * side, EYE.y, -0.04)),
  brows: [1, -1].map((side) => ({ ...onFace(0.56 * side, 0.5, 0.02), tilt: side * 0.1 })),
  lenses: [1, -1].map((side) => {
    const face = onFace(EYE.x * side, EYE.y + 0.02, 0.17);
    face.rotation[1] *= 0.55;
    return face;
  }),
  bridge: onFace(0, 0.0, 0.14),
  nose: onFace(0, -0.42, 0.02),
  mouth: onFace(0, -0.8, 0.005),
  blush: [1, -1].map((side) => onFace(0.98 * side, -0.55, 0.01)),
};

function clonePose(pose) {
  return {
    spine: [...pose.spine],
    head: [...pose.head],
    arms: pose.arms.map((arm) => ({ shoulder: [...arm.shoulder], elbow: [...arm.elbow] })),
    legs: pose.legs.map((leg) => ({ hip: [...leg.hip], knee: [...leg.knee] })),
  };
}

/** Aproxima `current` de `target` (suave; com `snap`, de uma vez). */
function approach(current, target, delta, snap) {
  for (let i = 0; i < 3; i += 1) {
    current[i] = snap ? target[i] : MathUtils.damp(current[i], target[i], 7, delta);
  }
}

function applyRotation(object, [x, y, z]) {
  object.rotation.set(x, y, z);
}

/** Cachos numa única malha instanciada. */
function Curls({ material, castShadow }) {
  const meshRef = useRef(null);
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    CURLS.forEach((curl, index) => {
      dummy.position.set(...curl.position);
      dummy.scale.setScalar(curl.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  return (
    <instancedMesh
      ref={meshRef}
      args={[GEOMETRY.curl, material, CURLS.length]}
      castShadow={castShadow}
    />
  );
}

/**
 * O boneco. `pose`: 'stand' | 'sit' | 'sitWave' | 'wave'. `lookRef` (opcional) recebe
 * { yaw, pitch } em radianos para onde a cabeça deve virar (suavizado aqui).
 * `materialFor(chave)` permite trocar os materiais (o holograma do Sobre).
 */
export function Character({
  pose = 'stand',
  lookRef,
  animate = true,
  typing = true,
  materialFor = characterMaterial,
  castShadow = true,
  ...props
}) {
  const rig = useRef({ shoulders: [], elbows: [], hips: [], knees: [] });
  // Pose atual (vai até a pedida aos poucos: trocar de pose não dá salto).
  const current = useRef(null);
  const m = materialFor;
  const blink = useRef({ next: 2.5, until: 0 });

  const set = (name, index) => (element) => {
    if (index === undefined) rig.current[name] = element;
    else rig.current[name][index] = element;
  };

  useFrame((state, delta) => {
    const r = rig.current;
    const target = POSES[pose];
    const t = animate ? state.clock.elapsedTime : 0;
    if (!r.spine || !r.head) return;

    current.current ??= clonePose(target);
    const p = current.current;
    const snap = !animate;
    approach(p.spine, target.spine, delta, snap);
    approach(p.head, target.head, delta, snap);
    p.arms.forEach((arm, index) => {
      approach(arm.shoulder, target.arms[index].shoulder, delta, snap);
      approach(arm.elbow, target.arms[index].elbow, delta, snap);
    });
    p.legs.forEach((leg, index) => {
      approach(leg.hip, target.legs[index].hip, delta, snap);
      approach(leg.knee, target.legs[index].knee, delta, snap);
    });

    applyRotation(r.spine, p.spine);
    r.spine.rotation.z += Math.sin(t * 0.9) * 0.012;
    if (r.torso) r.torso.scale.y = 1 + Math.sin(t * 1.8) * 0.012;

    p.arms.forEach((arm, index) => {
      applyRotation(r.shoulders[index], arm.shoulder);
      applyRotation(r.elbows[index], arm.elbow);
    });
    p.legs.forEach((leg, index) => {
      applyRotation(r.hips[index], leg.hip);
      applyRotation(r.knees[index], leg.knee);
    });

    if (pose === 'sit' && typing && animate) {
      // Digita em rajadas: as mãos sobem e descem alternadas.
      const burst = MathUtils.smoothstep(Math.sin(t * 0.7), -0.2, 0.3);
      r.elbows.forEach((elbow, index) => {
        elbow.rotation.x += Math.sin(t * 17 + index * Math.PI) * 0.07 * burst;
      });
    }
    if ((pose === 'wave' || pose === 'sitWave') && animate) {
      r.elbows[0].rotation.z += Math.sin(t * 7) * 0.38;
      r.shoulders[0].rotation.z += Math.sin(t * 3.5) * 0.04;
    }
    if (pose === 'stand' && animate) {
      r.shoulders.forEach((shoulder, index) => {
        shoulder.rotation.x += Math.sin(t * 1.1 + index) * 0.03;
      });
    }

    // Cabeça: vira para o alvo (ou fica na pose, com um leve balanço).
    const look = lookRef?.current;
    const yaw = (look?.yaw ?? 0) + p.head[1] + Math.sin(t * 0.5) * 0.06;
    const pitch = (look?.pitch ?? 0) + p.head[0];
    r.head.rotation.y = MathUtils.damp(r.head.rotation.y, yaw, 5, delta);
    r.head.rotation.x = MathUtils.damp(r.head.rotation.x, pitch, 5, delta);
    r.head.rotation.z = p.head[2] + Math.sin(t * 0.7) * 0.03;

    // Piscada a cada poucos segundos.
    if (r.eyes && animate) {
      const b = blink.current;
      if (t > b.next) {
        b.until = t + 0.12;
        b.next = t + 2.5 + ((t * 7.3) % 3);
      }
      r.eyes.scale.y = t < b.until ? 0.12 : 1;
    }
  });

  return (
    <group {...props}>
      {/* Pernas (presas à cintura, fora da coluna: não inclinam junto) */}
      {[1, -1].map((side, index) => (
        <group key={side} ref={set('hips', index)} position={[side * HIP.x, HIP.y, 0]}>
          <mesh position-y={-0.78} material={m('pants')} castShadow={castShadow}>
            <capsuleGeometry args={[0.5, 0.95, 8, 18]} />
          </mesh>
          <group ref={set('knees', index)} position-y={-THIGH}>
            <mesh position-y={-0.62} material={m('pants')} castShadow={castShadow}>
              <capsuleGeometry args={[0.44, 0.8, 8, 18]} />
            </mesh>
            <mesh position-y={-1.2} material={m('cuff')} castShadow={castShadow}>
              <cylinderGeometry args={[0.5, 0.48, 0.24, 20]} />
            </mesh>
            <mesh position-y={-1.42} material={m('sole')}>
              <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
            </mesh>
            {/* Tênis: cabedal escuro, biqueira e sola brancas */}
            <group position-y={-SHIN}>
              <RoundedBox
                args={[0.84, 0.48, 1.32]}
                radius={0.22}
                smoothness={3}
                position={[0, -0.27, 0.24]}
                material={m('shoe')}
                castShadow={castShadow}
              />
              <RoundedBox
                args={[0.86, 0.32, 0.5]}
                radius={0.15}
                smoothness={3}
                position={[0, -0.36, 0.72]}
                material={m('sole')}
              />
              <RoundedBox
                args={[0.92, 0.2, 1.42]}
                radius={0.09}
                smoothness={2}
                position={[0, -ANKLE + 0.1, 0.25]}
                material={m('sole')}
                castShadow={castShadow}
              />
            </group>
          </group>
        </group>
      ))}

      {/* Quadril (calça) */}
      <RoundedBox
        args={[2.04, 0.86, 1.46]}
        radius={0.4}
        smoothness={4}
        position-y={-0.14}
        material={m('pants')}
        castShadow={castShadow}
      />

      {/* Tronco, braços e cabeça: inclinam juntos a partir da cintura */}
      <group ref={set('spine')}>
        <mesh
          ref={set('torso')}
          geometry={GEOMETRY.torso}
          scale={[1.04, 1, 0.7]}
          material={m('shirt')}
          castShadow={castShadow}
        />
        <mesh
          position-y={2.66}
          rotation-x={Math.PI / 2}
          scale={[1, 0.82, 1]}
          material={m('collar')}
        >
          <torusGeometry args={[0.5, 0.09, 10, 28]} />
        </mesh>
        <mesh position-y={2.85} material={m('skin')}>
          <cylinderGeometry args={[0.42, 0.46, 0.5, 20]} />
        </mesh>

        {[1, -1].map((side, index) => (
          <group
            key={side}
            ref={set('shoulders', index)}
            position={[side * SHOULDER.x, SHOULDER.y, 0]}
          >
            <mesh
              position-y={-0.26}
              scale={[1, 1, 0.9]}
              material={m('shirt')}
              castShadow={castShadow}
            >
              <capsuleGeometry args={[0.49, 0.34, 8, 18]} />
            </mesh>
            <mesh position-y={-0.62} material={m('skin')} castShadow={castShadow}>
              <capsuleGeometry args={[0.32, 0.78, 6, 14]} />
            </mesh>
            <group ref={set('elbows', index)} position-y={-UPPER_ARM}>
              <mesh position-y={-0.45} material={m('skin')} castShadow={castShadow}>
                <capsuleGeometry args={[0.3, 0.66, 6, 14]} />
              </mesh>
              <mesh
                position-y={-1.06}
                scale={[0.82, 1, 0.72]}
                material={m('skin')}
                castShadow={castShadow}
              >
                <sphereGeometry args={[0.38, 18, 14]} />
              </mesh>
              <mesh position={[side * -0.22, -0.94, 0.16]} material={m('skin')}>
                <sphereGeometry args={[0.13, 12, 10]} />
              </mesh>
            </group>
          </group>
        ))}

        {/* Cabeça: gira a partir da base do pescoço */}
        <group ref={set('head')} position-y={NECK_Y}>
          <group position-y={HEAD_Y} scale={[1.06, 0.98, 1]}>
            <mesh material={m('skin')} castShadow={castShadow}>
              <sphereGeometry args={[HEAD_R, 48, 36]} />
            </mesh>
            {[1, -1].map((side) => (
              <mesh
                key={side}
                position={[side * 1.6, -0.14, -0.06]}
                scale={[0.5, 1, 0.82]}
                material={m('skin')}
              >
                <sphereGeometry args={[0.34, 16, 12]} />
              </mesh>
            ))}

            {/* Cabelo */}
            <mesh
              geometry={GEOMETRY.hairTop}
              position={[0, 0.02, -0.03]}
              material={m('hair')}
              castShadow={castShadow}
            />
            <mesh
              geometry={GEOMETRY.hairBack}
              position={[0, 0.0, -0.02]}
              material={m('hair')}
              castShadow={castShadow}
            />
            <Curls material={m('hair')} castShadow={castShadow} />

            {/* Olhos (piscam juntos), sobrancelhas, nariz, boca e bochechas */}
            <group ref={set('eyes')} position-y={EYE.y}>
              {FACE.eyes.map((eye, index) => (
                <group
                  key={index}
                  position={[eye.position[0], eye.position[1] - EYE.y, eye.position[2]]}
                  rotation={eye.rotation}
                >
                  <mesh scale={[1, 1.1, 0.36]} material={m('sclera')}>
                    <sphereGeometry args={[0.29, 20, 14]} />
                  </mesh>
                  <mesh position={[0, -0.01, 0.07]} scale={[1, 1.06, 0.4]} material={m('iris')}>
                    <sphereGeometry args={[0.215, 20, 14]} />
                  </mesh>
                  <mesh position={[0.07, 0.08, 0.16]} material={m('sclera')}>
                    <sphereGeometry args={[0.06, 10, 8]} />
                  </mesh>
                </group>
              ))}
            </group>
            {FACE.brows.map((brow, index) => (
              <group key={index} position={brow.position} rotation={brow.rotation}>
                <RoundedBox
                  args={[0.44, 0.11, 0.1]}
                  radius={0.05}
                  smoothness={2}
                  rotation-z={brow.tilt}
                  material={m('hair')}
                />
              </group>
            ))}
            <mesh
              position={FACE.nose.position}
              rotation={FACE.nose.rotation}
              scale={[1.1, 0.85, 0.75]}
              material={m('skinShade')}
            >
              <sphereGeometry args={[0.15, 16, 12]} />
            </mesh>
            <group position={FACE.mouth.position} rotation={FACE.mouth.rotation}>
              <mesh material={m('mouth')}>
                <circleGeometry args={[0.31, 24, Math.PI, Math.PI]} />
              </mesh>
              <mesh position={[0, -0.045, 0.004]} material={m('teeth')}>
                <planeGeometry args={[0.44, 0.08]} />
              </mesh>
            </group>
            {FACE.blush.map((cheek, index) => (
              <mesh
                key={index}
                position={cheek.position}
                rotation={cheek.rotation}
                material={m('blush')}
              >
                <circleGeometry args={[0.2, 20]} />
              </mesh>
            ))}

            {/* Óculos: aros finos, ponte e hastes que contornam a cabeça */}
            {FACE.lenses.map((lens, index) => (
              <mesh
                key={index}
                geometry={GEOMETRY.frame}
                position={lens.position}
                rotation={lens.rotation}
                material={m('glasses')}
              />
            ))}
            <mesh position={FACE.bridge.position} material={m('glasses')}>
              <boxGeometry args={[0.24, 0.05, 0.05]} />
            </mesh>
            {GEOMETRY.temples.map((geometry, index) => (
              <mesh key={index} geometry={geometry} material={m('glasses')} />
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
