/**
 * Medidas do notebook (unidades da cena) e a pose final da tela aberta.
 * Proporção de laptop moderno: base ≈ 30 × 21 × 1,2; tela 16:10.
 */
export const BASE = { w: 3.0, h: 0.12, d: 2.1 };
export const LID = { h: 2.02, t: 0.06 };
export const SCREEN = { w: 2.8, h: 1.75, centerY: 1.06, z: 0.0025 };
/** Dobradiça: borda traseira da base. */
export const HINGE = { y: BASE.h + 0.003, z: -BASE.d / 2 + 0.04 };
export const OPEN_ANGLE_DEG = 110;
export const HOVER_ANGLE_DEG = 4;

const DEG = Math.PI / 180;

/** Rotação X da tampa: 0 = fechada (deitada sobre a base), 1 = aberta (110°). */
export function lidRotation(openness, hover = 0) {
  return Math.PI / 2 - (openness * OPEN_ANGLE_DEG + hover * HOVER_ANGLE_DEG) * DEG;
}

/** Centro e normal da tela, no mundo, com a tampa totalmente aberta. */
export function openScreenPose() {
  const theta = lidRotation(1);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  // Rotação em X: y' = y·cos − z·sin; z' = y·sin + z·cos
  return {
    center: [
      0,
      HINGE.y + SCREEN.centerY * c - SCREEN.z * s,
      HINGE.z + SCREEN.centerY * s + SCREEN.z * c,
    ],
    normal: [0, -s, c],
  };
}
