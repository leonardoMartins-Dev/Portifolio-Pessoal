import { useMemo } from 'react';
import { ExtrudeGeometry, Shape, ShapeGeometry } from 'three';
import { clay } from '../materials.js';
import { LAYOUT } from './layout.js';

function roundedRect(width, depth, radius) {
  const shape = new Shape();
  const x = -width / 2;
  const y = -depth / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0);
  shape.lineTo(x + width, y + depth - radius);
  shape.absarc(x + width - radius, y + depth - radius, radius, 0, Math.PI / 2);
  shape.lineTo(x + radius, y + depth);
  shape.absarc(x + radius, y + depth - radius, radius, Math.PI / 2, Math.PI);
  shape.lineTo(x, y + radius);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
  return shape;
}

const OUTER = [20, 14];
// Faixas de dentro para fora: [largura, profundidade, cor].
const BANDS = [
  [17.4, 11.4, '#f6c04f'],
  [14.6, 8.6, '#f0a03a'],
  [13.4, 7.4, '#f4d468'],
  [10.6, 4.6, '#f7e391'],
];

/** Tapete de faixas laranja e amarelas em degradê, com a borda grossa e macia. */
export function Rug() {
  const geometries = useMemo(() => {
    const base = new ExtrudeGeometry(roundedRect(OUTER[0], OUTER[1], 2.2), {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.08,
      bevelSegments: 3,
      curveSegments: 16,
    });
    const bands = BANDS.map(([w, d]) => new ShapeGeometry(roundedRect(w, d, 1.8), 16));
    return { base, bands };
  }, []);

  return (
    <group position={LAYOUT.rug.position} rotation-x={-Math.PI / 2}>
      <mesh
        geometry={geometries.base}
        position-z={0.05}
        material={clay('#ee9433', { roughness: 0.95 })}
        receiveShadow
      />
      {geometries.bands.map((geometry, index) => (
        <mesh
          key={index}
          geometry={geometry}
          position-z={0.185 + index * 0.004}
          material={clay(BANDS[index][2], { roughness: 0.95 })}
          receiveShadow
        />
      ))}
    </group>
  );
}
