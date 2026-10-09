import { clay } from './materials.js';

/*
 * Aparência e medidas do boneco do autor (ver Character.jsx). Ficam aqui para
 * as cenas poderem posicioná-lo e trocar os materiais (o holograma do Sobre).
 */

export const LOOK = {
  skin: '#d9a07a',
  skinShade: '#c48862',
  hair: '#1f1713',
  sclera: '#fbf8f4',
  iris: '#2b1912',
  shirt: '#2a2a30',
  collar: '#202026',
  pants: '#3e5479',
  cuff: '#36496a',
  shoe: '#3b3e47',
  sole: '#f4f2ed',
  glasses: '#1b1b20',
  mouth: '#6a2d2d',
  teeth: '#ffffff',
  blush: '#e98a78',
};

export const HIP = { x: 0.52, y: -0.2 };
export const THIGH = 1.6;
export const SHIN = 1.6;
export const ANKLE = 0.59;
export const NECK_Y = 2.7;
export const HEAD_Y = 1.75;

/** Altura da cintura com o boneco de pé (da sola até a origem). */
export const STAND_WAIST = ANKLE + SHIN + THIGH - HIP.y;
/** Altura do centro da cabeça acima da cintura (sem inclinação). */
export const HEAD_HEIGHT = NECK_Y + HEAD_Y;

const blushMaterial = clay(LOOK.blush, { transparent: true, opacity: 0.35, depthWrite: false });

/** Material padrão de cada parte do boneco (as chaves de LOOK). */
export function characterMaterial(key) {
  return key === 'blush' ? blushMaterial : clay(LOOK[key]);
}
