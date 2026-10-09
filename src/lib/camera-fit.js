/**
 * Distância da câmera para que um plano (a tela do monitor) COBRIR o
 * viewport inteiro, sem bordas, em qualquer proporção — como `object-fit: cover`.
 *
 * Com FOV vertical `fov` (graus), a altura visível a uma distância d é
 * 2·d·tan(fov/2) e a largura visível é essa altura × aspect. Para cobrir,
 * a área visível precisa caber dentro do plano nas duas dimensões.
 */
export function coverDistance({ planeWidth, planeHeight, fov, aspect }) {
  const visibleHeight = Math.min(planeHeight, planeWidth / aspect);
  return visibleHeight / (2 * Math.tan((fov * Math.PI) / 360));
}

/** Área visível (largura × altura) de um plano a uma distância d. */
export function visibleSize({ distance, fov, aspect }) {
  const height = 2 * distance * Math.tan((fov * Math.PI) / 360);
  return { width: height * aspect, height };
}

/** Distância da câmera para que uma área `width` × `height` caiba inteira no viewport. */
export function fitDistance({ width, height, fov, aspect }) {
  const tan = Math.tan((fov * Math.PI) / 360);
  return Math.max(height / (2 * tan), width / (2 * tan * aspect));
}
