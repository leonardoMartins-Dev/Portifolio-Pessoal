import { CanvasTexture, SRGBColorSpace } from 'three';
import { blurredCanvas } from '../../../lib/blur.js';

const WIDTH = 1280;
const HEIGHT = 800; // 16:10, como a tela

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const FONT = '"Geist Variable", ui-sans-serif, system-ui, sans-serif';

/**
 * Tela de bloqueio desenhada no canvas, com as mesmas proporções da versão
 * HTML (LockScreen.jsx) numa janela 16:10: assim a troca do 3D para a página
 * não tem corte.
 */
function drawLockScreen(ctx, { blurred, avatar, lock, initials }) {
  const cx = WIDTH / 2;
  ctx.imageSmoothingQuality = 'high';
  if (blurred) ctx.drawImage(blurred, 0, 0, WIDTH, HEIGHT);
  else {
    ctx.fillStyle = '#1b1f3a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.fillStyle = `rgba(0, 0, 0, ${lock.dim})`;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 18px ${FONT}`;
  ctx.globalAlpha *= 0.9;
  ctx.fillText(lock.date, cx, HEIGHT * 0.105);
  ctx.globalAlpha /= 0.9;
  ctx.font = `600 121px ${FONT}`;
  ctx.fillText(lock.time, cx, HEIGHT * 0.198);

  // Foto redonda (ou as iniciais).
  const ay = HEIGHT * 0.712;
  const radius = 36;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, ay, radius, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, cx - radius, ay - radius, radius * 2, radius * 2);
  else {
    ctx.fillStyle = '#5a67f2';
    ctx.fillRect(cx - radius, ay - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 24px ${FONT}`;
    ctx.fillText(initials, cx, ay + 1);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, ay, radius + 1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText(lock.name, cx, HEIGHT * 0.775);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = `400 12.5px ${FONT}`;
  ctx.fillText(lock.role, cx, HEIGHT * 0.808);

  // Botão "Entrar" e a dica.
  ctx.font = `500 12.5px ${FONT}`;
  const label = `${lock.enter}  →`;
  const bw = ctx.measureText(label).width + 40;
  const by = HEIGHT * 0.862;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  roundedRect(ctx, cx - bw / 2, by - 19, bw, 38, 19);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, cx, by + 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `400 11px ${FONT}`;
  ctx.fillText(lock.hint, cx, HEIGHT * 0.912);
}

/**
 * Textura da tela do monitor do sistema: desligada (escura) → boot (logo + barra de
 * progresso) → tela de bloqueio, igual à do sistema HTML.
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
  let blur = { image: null, canvas: null };

  function draw({ glow, boot, reveal, image, avatar, lock }) {
    const key = [
      glow.toFixed(3),
      boot.toFixed(3),
      reveal.toFixed(3),
      image ? image.src : '',
      avatar ? 1 : 0,
      lock.time,
      lock.date,
      lock.enter,
      lock.dim,
    ].join('|');
    if (key === lastKey) return;
    lastKey = key;
    if (image && blur.image !== image) blur = { image, canvas: blurredCanvas(image) };

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
      ctx.font = `650 54px ${FONT}`;
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

      if (reveal > 0) {
        ctx.globalAlpha = glow * reveal;
        drawLockScreen(ctx, { blurred: blur.canvas, avatar, lock, initials });
      }
      ctx.globalAlpha = 1;
    }
    texture.needsUpdate = true;
  }

  return { texture, draw, dispose: () => texture.dispose() };
}
