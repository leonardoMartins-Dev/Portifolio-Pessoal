/**
 * Onde cada coisa fica na cena. Unidade: 1 = 10 cm. O tampo da mesa está em
 * y = 0 e o notebook fica na origem, de frente para +z (a câmera).
 */
export const FLOOR_Y = -8;
export const WALL_Z = -3.62;

/** A mesa do Poly Haven tem 1,13 m; esticada em x para virar uma mesa de trabalho. */
export const DESK_SCALE = [13, 10, 10];

export const LAYOUT = {
  // Presa na lateral esquerda da mesa: o modelo tem o grampo na origem e a cabeça para −z.
  lamp: { position: [-7.28, 0, -1.5], rotation: [0, -Math.PI / 2 - 0.3, 0] },
  lampTarget: [-3.4, 0, 0.6],
  books: { position: [-4.75, 0, -0.35], rotation: [0, 0.2, 0] },
  resume: { position: [-3.15, 0, 1.95], rotation: [0, 0.24, 0] },
  mug: { position: [-5.45, 0, 2.15], rotation: [0, -0.6, 0] },
  phone: { position: [2.35, 0, 2.05], rotation: [0, -0.3, 0] },
  figure: { position: [3.1, 0, -0.75], rotation: [0, -0.3, 0] },
  plant: { position: [5.85, 0, -2.25], rotation: [0, 0.8, 0] },
  racket: { position: [5.0, 0, 1.25], rotation: [0, 0.45, 0] },
  ball: { position: [3.45, 0, 3.0] },
  frame: { position: [2.5, 4.9, WALL_Z + 0.08] },
  window: { position: [-3.6, 5.0, WALL_Z + 0.02], size: [6.4, 4.6] },
};
