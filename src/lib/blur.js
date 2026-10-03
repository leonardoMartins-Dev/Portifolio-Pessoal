/** Desenha `image` cobrindo o retângulo inteiro (como background-size: cover). */
export function drawCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}

/**
 * Cópia bem desfocada de uma imagem (16:10): reduzir muito e ampliar de volta.
 * Barato e igual em todo navegador — bem mais leve que `filter: blur()` numa
 * imagem de tela cheia. Usada na tela de bloqueio HTML e na tela do notebook 3D,
 * para as duas ficarem idênticas.
 */
export function blurredCanvas(image) {
  let source = image;
  for (const [w, h] of [
    [48, 30],
    [160, 100],
  ]) {
    const step = document.createElement('canvas');
    step.width = w;
    step.height = h;
    const ctx = step.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    if (source === image) drawCover(ctx, image, w, h);
    else ctx.drawImage(source, 0, 0, w, h);
    source = step;
  }
  return source;
}
