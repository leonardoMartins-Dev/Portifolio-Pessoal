import { Vector3 } from 'three';

/**
 * Onde cada coisa fica no quarto da página inicial. Unidade ≈ 10 cm na escala
 * do boneco (de pé ele mede ~10). O chão está em y = 0, a parede do fundo em
 * WALL_Z e a câmera olha de frente-esquerda (+z, −x).
 */
export const WALL_Z = -4.6;
export const DESK = { y: 4.2, z: -2.2, width: 13, depth: 4.6, top: 0.42 };

/** Monitor: tela 16:10 (a mesma proporção da textura da tela de bloqueio). */
export const MONITOR = {
  body: [5.7, 3.75, 0.3],
  screen: { w: 5.2, h: 3.25 },
  /** Centro da tela acima do tampo da mesa. */
  centerY: 3.25,
};

export const LAYOUT = {
  monitorCode: { position: [-3.05, DESK.y, -3.45], rotationY: 0.26 },
  monitorOS: { position: [3.05, DESK.y, -3.45], rotationY: -0.2 },
  keyboard: { position: [-1.3, DESK.y, -1.25], rotation: [0, 0.08, 0] },
  mouse: { position: [0.9, DESK.y, -1.15], rotation: [0, -0.2, 0] },
  chair: { position: [-1.25, 0, 1.15] },
  luffy: { position: [-5.25, DESK.y, -2.35], rotation: [0, 0.55, 0] },
  pencils: { position: [-4.15, DESK.y, -3.55] },
  mug: { position: [5.35, DESK.y, -1.35], rotation: [0, -0.9, 0] },
  shelf: { position: [-5.7, 10.0, WALL_Z] },
  corkboard: { position: [1.5, 11.3, WALL_Z] },
  galo: { position: [7.8, 10.1, WALL_Z] },
  rug: { position: [0, 0, 0.9] },
  plant: { position: [9.5, 0, -2.6], rotation: [0, 0.4, 0] },
  racket: { position: [-7.4, 0, 4.4], rotation: [0, 0.75, 0] },
  balls: [
    [-4.9, 5.7],
    [-9.4, 2.4],
  ],
};

/** Cadeira virada para o teclado; ao passar o mouse no PC, gira para o visitante. */
export const CHAIR_YAW = { work: Math.PI + 0.06, greet: Math.PI + 2.05 };

/** Centro e normal (no mundo) da tela do monitor do sistema — o alvo do zoom. */
export function osScreenPose() {
  const { position, rotationY } = LAYOUT.monitorOS;
  const normal = new Vector3(Math.sin(rotationY), 0, Math.cos(rotationY));
  const front = MONITOR.body[2] / 2 + 0.004;
  const center = new Vector3(
    position[0],
    position[1] + MONITOR.centerY,
    position[2],
  ).addScaledVector(normal, front);
  return { center, normal };
}

/** O que a câmera precisa enquadrar na vista geral (área aproximada, de frente). */
export const ROOM_VIEW = {
  target: new Vector3(0.2, 5.4, 0.8),
  direction: new Vector3(-0.5, 0.46, 1).normalize(),
  width: 27,
  height: 18.5,
};

/**
 * Onde o quarto aparece na tela, em frações do viewport: à direita do nome no
 * computador; embaixo do nome no celular (retrato).
 */
export function roomFrame(aspect) {
  if (aspect >= 1.15) return { cx: 0.68, cy: 0.55, w: 0.6, h: 0.86 };
  return { cx: 0.5, cy: 0.69, w: 1.18, h: 0.62 };
}
