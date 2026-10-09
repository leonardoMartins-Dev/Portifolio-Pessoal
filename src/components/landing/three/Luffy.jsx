import { RoundedBox } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import {
  CatmullRomCurve3,
  DoubleSide,
  MeshPhysicalMaterial,
  RepeatWrapping,
  Vector2,
  Vector3,
} from 'three';
import { strawTexture } from './textures.js';

// Medidas em "larguras de cabeça" (cabeça = 1), com o chão em y = 0 e a frente para +z.
const COLORS = {
  skin: '#ecbb95',
  hair: '#121212',
  vest: '#b4252f',
  sash: '#f1c22a',
  shorts: '#2b58bd',
  fur: '#f3f0ea',
  sole: '#c9a372',
  strap: '#6e4f33',
  band: '#b3262f',
  scar: '#4a2a1f',
  button: '#d9b45a',
};

// Perfil da copa do chapéu (raio, altura) e da aba (polígono fechado).
const CROWN = [
  [0.47, 0],
  [0.47, 0.07],
  [0.462, 0.16],
  [0.435, 0.25],
  [0.38, 0.33],
  [0.28, 0.385],
  [0.14, 0.412],
  [0, 0.42],
].map(([x, y]) => new Vector2(x, y));
const BRIM = [
  [0.44, 0.015],
  [0.6, 0.0],
  [0.7, -0.03],
  [0.745, -0.06],
  [0.735, -0.088],
  [0.69, -0.075],
  [0.6, -0.05],
  [0.44, -0.03],
  [0.44, 0.015],
].map(([x, y]) => new Vector2(x, y));

// Mechas: [x, y do topo, z, largura, comprimento, inclinação] — franja, laterais e nuca.
const BANGS = [
  [-0.43, 1.17, 0.31, 0.24, 0.32, -0.42],
  [-0.3, 1.18, 0.41, 0.26, 0.28, -0.26],
  [-0.15, 1.18, 0.46, 0.26, 0.26, -0.1],
  [0.0, 1.18, 0.48, 0.26, 0.29, 0.04],
  [0.15, 1.18, 0.46, 0.26, 0.25, 0.18],
  [0.3, 1.18, 0.41, 0.26, 0.28, 0.3],
  [0.43, 1.17, 0.31, 0.24, 0.31, 0.44],
];
const SIDES = [
  [-0.51, 1.12, 0.16, 0.2, 0.4, -0.16],
  [-0.53, 1.1, -0.1, 0.22, 0.4, -0.22],
  [0.51, 1.12, 0.16, 0.2, 0.4, 0.16],
  [0.53, 1.1, -0.1, 0.22, 0.4, 0.22],
  [-0.32, 1.1, -0.44, 0.24, 0.42, -0.3],
  [0, 1.1, -0.5, 0.26, 0.42, 0],
  [0.32, 1.1, -0.44, 0.24, 0.42, 0.3],
];

function vinyl(color, extra = {}) {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.42,
    clearcoat: 0.3,
    clearcoatRoughness: 0.45,
    ...extra,
  });
}

/** Materiais do boneco (criados uma vez; o chapéu usa a textura de palha trançada). */
function createMaterials() {
  const crownStraw = strawTexture();
  crownStraw.wrapS = RepeatWrapping;
  crownStraw.wrapT = RepeatWrapping;
  crownStraw.repeat.set(9, 2.2);
  const brimStraw = crownStraw.clone();
  brimStraw.repeat.set(14, 0.9);
  const straw = (map) =>
    new MeshPhysicalMaterial({
      map,
      bumpMap: map,
      bumpScale: 1.6,
      roughness: 0.78,
      clearcoat: 0.15,
      side: DoubleSide,
    });
  return {
    skin: vinyl(COLORS.skin),
    hair: vinyl(COLORS.hair, { roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
    eye: vinyl('#030303', {
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 0.15,
    }),
    vest: vinyl(COLORS.vest),
    sash: vinyl(COLORS.sash),
    shorts: vinyl(COLORS.shorts),
    fur: vinyl(COLORS.fur, { roughness: 0.95, clearcoat: 0, sheen: 1, sheenColor: '#ffffff' }),
    sole: vinyl(COLORS.sole, { roughness: 0.7 }),
    strap: vinyl(COLORS.strap),
    band: vinyl(COLORS.band),
    scar: vinyl(COLORS.scar, { roughness: 0.6 }),
    button: vinyl(COLORS.button, { metalness: 0.6, roughness: 0.3 }),
    crown: straw(crownStraw),
    brim: straw(brimStraw),
    textures: [crownStraw, brimStraw],
  };
}

/** Mecha de cabelo: uma pirâmide achatada com a ponta para baixo. */
function Lock({ x, top, z, width, length, tilt, material }) {
  return (
    <mesh
      position={[x, top - length / 2, z]}
      rotation={[Math.PI, 0, tilt]}
      scale={[1, 1, 0.5]}
      material={material}
      castShadow
    >
      <coneGeometry args={[width / 2, length, 4]} />
    </mesh>
  );
}

/** Linha fina sobre a superfície (cicatrizes), por uma curva de pontos. */
function Stroke({ points, radius = 0.007, material }) {
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((point) => new Vector3(...point))),
    [points],
  );
  return (
    <mesh material={material}>
      <tubeGeometry args={[curve, 12, radius, 6, false]} />
    </mesh>
  );
}

const SCAR = [
  [0.24, 0.73, 0.425],
  [0.29, 0.722, 0.418],
  [0.34, 0.728, 0.402],
];
const SCAR_STITCHES = [
  [
    [0.265, 0.742, 0.423],
    [0.27, 0.71, 0.422],
  ],
  [
    [0.31, 0.74, 0.414],
    [0.315, 0.708, 0.413],
  ],
];
const CHEST_X = [
  [
    [-0.035, 0.56, 0.168],
    [0.035, 0.48, 0.168],
  ],
  [
    [0.035, 0.56, 0.168],
    [-0.035, 0.48, 0.168],
  ],
];

/**
 * Luffy em estilo vinil cabeção (inspirado nos bonecos da Funko, sem a marca):
 * chapéu de palha trançado com fita vermelha, cabelo preto em mechas, olhos
 * pretos brilhantes, cicatriz sob o olho esquerdo, colete vermelho aberto com
 * o X no peito, faixa amarela, bermuda azul com punho de pelo e sandálias.
 * `headRef` é o grupo da cabeça (para balançar).
 */
export function LuffyModel({ headRef }) {
  const m = useMemo(() => createMaterials(), []);
  useEffect(
    () => () => {
      for (const [key, value] of Object.entries(m)) {
        if (key === 'textures') value.forEach((texture) => texture.dispose());
        else value.dispose();
      }
    },
    [m],
  );

  return (
    <group>
      {/* Pés, sandálias e pernas */}
      {[-1, 1].map((side) => (
        <group key={side} position-x={side * 0.125}>
          <RoundedBox
            args={[0.13, 0.024, 0.22]}
            radius={0.01}
            position={[0, 0.012, 0.03]}
            material={m.sole}
            castShadow
          />
          <RoundedBox
            args={[0.1, 0.05, 0.17]}
            radius={0.024}
            position={[0, 0.047, 0.035]}
            material={m.skin}
          />
          <RoundedBox
            args={[0.112, 0.016, 0.032]}
            radius={0.006}
            position={[0, 0.07, 0.07]}
            material={m.strap}
          />
          <mesh position-y={0.11} material={m.skin}>
            <cylinderGeometry args={[0.052, 0.056, 0.1, 20]} />
          </mesh>
          {/* Perna da bermuda e o punho de pelo */}
          <mesh position-y={0.135} rotation-x={Math.PI / 2} material={m.fur}>
            <torusGeometry args={[0.1, 0.032, 10, 24]} />
          </mesh>
          <mesh position-y={0.185} material={m.shorts} castShadow>
            <cylinderGeometry args={[0.115, 0.11, 0.09, 24]} />
          </mesh>
        </group>
      ))}
      <RoundedBox
        args={[0.5, 0.12, 0.33]}
        radius={0.055}
        smoothness={4}
        position-y={0.255}
        material={m.shorts}
        castShadow
      />

      {/* Faixa amarela com o nó e a ponta caída */}
      <mesh position-y={0.32} scale={[1, 1, 0.74]} material={m.sash}>
        <cylinderGeometry args={[0.275, 0.272, 0.075, 32]} />
      </mesh>
      <mesh position={[0.17, 0.3, 0.175]} scale={[1, 0.85, 0.7]} material={m.sash}>
        <sphereGeometry args={[0.042, 16, 12]} />
      </mesh>
      <RoundedBox
        args={[0.08, 0.17, 0.024]}
        radius={0.011}
        position={[0.195, 0.215, 0.19]}
        rotation={[0.12, 0, -0.12]}
        material={m.sash}
        castShadow
      />
      <RoundedBox
        args={[0.075, 0.13, 0.022]}
        radius={0.01}
        position={[0.22, 0.08, 0.205]}
        rotation={[-0.05, 0, -0.28]}
        material={m.sash}
        castShadow
      />

      {/* Tronco: peito à mostra (com o X) entre as duas abas do colete */}
      <RoundedBox
        args={[0.48, 0.34, 0.33]}
        radius={0.1}
        smoothness={4}
        position-y={0.5}
        material={m.skin}
      />
      {CHEST_X.map((points, index) => (
        <Stroke key={index} points={points} radius={0.008} material={m.scar} />
      ))}
      <RoundedBox
        args={[0.58, 0.36, 0.24]}
        radius={0.1}
        smoothness={4}
        position={[0, 0.5, -0.06]}
        material={m.vest}
        castShadow
      />
      {/* Abas da frente abertas em V: largas na gola, quase se tocando na faixa */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.23, 0.36, 0.11]}
          radius={0.045}
          smoothness={3}
          position={[side * 0.16, 0.5, 0.12]}
          rotation={[0, side * -0.18, side * -0.24]}
          material={m.vest}
          castShadow
        />
      ))}
      {[0.6, 0.545, 0.49].map((y) => (
        <mesh key={y} position={[-0.11 + (0.6 - y) * 0.35, y, 0.19]} material={m.button}>
          <sphereGeometry args={[0.013, 10, 8]} />
        </mesh>
      ))}

      {/* Braços: manga curta vermelha, antebraço e punho fechado */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * 0.315, 0.585, 0]}
            rotation-z={side * 0.42}
            material={m.vest}
            castShadow
          >
            <cylinderGeometry args={[0.085, 0.095, 0.15, 20]} />
          </mesh>
          <mesh
            position={[side * 0.36, 0.43, 0.01]}
            rotation-z={side * 0.12}
            material={m.skin}
            castShadow
          >
            <capsuleGeometry args={[0.062, 0.14, 6, 14]} />
          </mesh>
          <mesh position={[side * 0.375, 0.315, 0.02]} material={m.skin} castShadow>
            <sphereGeometry args={[0.074, 18, 14]} />
          </mesh>
        </group>
      ))}

      {/* Cabeça (balança a partir do pescoço) */}
      <group ref={headRef} position-y={0.6}>
        <group position-y={-0.6}>
          <RoundedBox
            args={[1.0, 0.86, 0.88]}
            radius={0.38}
            smoothness={8}
            position-y={0.99}
            material={m.skin}
            castShadow
          />
          {/* Olhos, nariz e a cicatriz */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.215, 0.835, 0.41]}
              scale={[1, 1, 0.36]}
              material={m.eye}
            >
              <sphereGeometry args={[0.09, 32, 20]} />
            </mesh>
          ))}
          <mesh position={[0.012, 0.745, 0.435]} scale={[1.1, 0.8, 0.7]} material={m.skin}>
            <sphereGeometry args={[0.034, 16, 12]} />
          </mesh>
          <Stroke points={SCAR} material={m.scar} />
          {SCAR_STITCHES.map((points, index) => (
            <Stroke key={index} points={points} radius={0.006} material={m.scar} />
          ))}

          {/* Cabelo: calota sob o chapéu e as mechas */}
          <mesh position={[0, 1.08, -0.04]} scale={[1.04, 0.74, 0.86]} material={m.hair} castShadow>
            <sphereGeometry args={[0.55, 32, 24]} />
          </mesh>
          {/* Faixa de cabelo sob a aba: tampa as frestas no alto da franja */}
          <RoundedBox
            args={[0.94, 0.15, 0.22]}
            radius={0.07}
            position={[0, 1.13, 0.385]}
            material={m.hair}
          />
          {BANGS.map(([x, top, z, width, length, tilt]) => (
            <Lock key={`b${x}`} {...{ x, top, z, width, length, tilt }} material={m.hair} />
          ))}
          {SIDES.map(([x, top, z, width, length, tilt]) => (
            <Lock key={`s${x}${z}`} {...{ x, top, z, width, length, tilt }} material={m.hair} />
          ))}

          {/* Chapéu de palha: copa, fita vermelha e aba, levemente inclinado para a frente */}
          <group position={[0, 1.31, -0.02]} rotation-x={0.2}>
            <mesh material={m.crown} castShadow>
              <latheGeometry args={[CROWN, 48]} />
            </mesh>
            <mesh position-y={0.045} material={m.band}>
              <cylinderGeometry args={[0.477, 0.475, 0.085, 48, 1, true]} />
            </mesh>
            <mesh material={m.brim} castShadow>
              <latheGeometry args={[BRIM, 64]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
