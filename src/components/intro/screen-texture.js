import { CanvasTexture, SRGBColorSpace } from 'three';

const WIDTH = 1280;
const HEIGHT = 800; // 16:10, como a tela

/** Desenha `image` cobrindo o retângulo inteiro (como background-size: cover). */
function drawCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Textura da tela do notebook: desligada (escura) → boot (logo + barra de
 * progresso) → papel de parede, o mesmo do sistema HTML.
 */
export function createScreen({ initials }) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  let lastKey = '';

  function draw({ glow, boot, reveal, image }) {
    const key = `${glow.toFixed(3)}|${boot.toFixed(3)}|${reveal.toFixed(3)}|${image ? 1 : 0}`;
    if (key === lastKey) return;
    lastKey = key;

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#040507';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (glow > 0) {
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Logo (monograma) e barra de progresso do boot.
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2 - 30;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 7;
      roundedRect(ctx, cx - 62, cy - 62, 124, 124, 36);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '650 54px "Geist Variable", ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, cx, cy + 4);

      const barW = 300;
      const barY = cy + 130;
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      roundedRect(ctx, cx - barW / 2, barY, barW, 7, 3.5);
      ctx.fill();
      if (boot > 0) {
        ctx.fillStyle = '#ffffff';
        roundedRect(ctx, cx - barW / 2, barY, Math.max(7, barW * boot), 7, 3.5);
        ctx.fill();
      }

      if (image && reveal > 0) {
        ctx.globalAlpha = glow * reveal;
        drawCover(ctx, image, WIDTH, HEIGHT);
      }
      ctx.globalAlpha = 1;
    }
    texture.needsUpdate = true;
  }

  return { texture, draw, dispose: () => texture.dispose() };
}

/** Textura do logo gravado na tampa (traseira). */
export function createLogoTexture({ initials }) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14;
  roundedRect(ctx, 24, 24, size - 48, size - 48, 64);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '650 100px "Geist Variable", ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2 + 6);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
