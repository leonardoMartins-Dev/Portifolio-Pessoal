import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

const FONT = '"Geist Variable", ui-sans-serif, system-ui, sans-serif';

function canvasTexture(width, height, paint, { srgb = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const texture = new CanvasTexture(canvas);
  if (srgb) texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Gerador pseudoaleatório com semente: a cena sai igual em toda visita. */
export function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Lombada de livro em tecido: filetes e título em dourado. */
export function spineTexture({ title, color }) {
  return canvasTexture(512, 80, (ctx, w, h) => {
    const random = seeded(title.length * 31);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    // Trama do tecido.
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(random() * w, random() * h, 2, 1);
    }
    ctx.fillStyle = '#c9a55a';
    for (const x of [22, 30, w - 33, w - 25]) ctx.fillRect(x, 10, 2, h - 20);
    ctx.font = `600 30px Georgia, "Times New Roman", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.toUpperCase(), w / 2, h / 2 + 2);
  });
}

/** Relevo de tecido (capas dos livros) ou de reboco (parede), em tons de cinza. */
export function noiseTexture({ seed = 1, size = 256, grain = 0.5 } = {}) {
  const texture = canvasTexture(
    size,
    size,
    (ctx, w, h) => {
      const random = seeded(seed);
      const image = ctx.createImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        const v = 128 + (random() - 0.5) * 255 * grain;
        image.data.set([v, v, v, 255], i * 4);
      }
      ctx.putImageData(image, 0, 0);
    },
    { srgb: false },
  );
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/**
 * Rua vista pelas frestas da persiana: noite (céu escuro e luzes amarelas
 * desfocadas) ou dia (claridade estourada).
 */
export function streetTexture({ night }) {
  return canvasTexture(512, 384, (ctx, w, h) => {
    const random = seeded(night ? 9 : 4);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    if (night) {
      sky.addColorStop(0, '#0a0f22');
      sky.addColorStop(1, '#1d2238');
    } else {
      sky.addColorStop(0, '#f4f8ff');
      sky.addColorStop(1, '#dfe9f5');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    if (!night) return;
    // Luzes da rua e janelas vizinhas, fora de foco.
    for (let i = 0; i < 26; i++) {
      const x = random() * w;
      const y = h * (0.35 + random() * 0.6);
      const r = 10 + random() * 26;
      const warm = random() < 0.75;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, warm ? 'rgba(255,196,120,0.85)' : 'rgba(170,200,255,0.7)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

/** Folhas vistas de lado (borda das páginas). */
export function pagesTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#efe7d6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120, 100, 70, 0.18)';
    for (let y = 2; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  });
}

/** Tela do celular acesa: papel de parede escuro, hora e um card de notificação genérico. */
export function phoneScreenTexture() {
  return canvasTexture(256, 528, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#141a2e');
    bg.addColorStop(1, '#2a2f4f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `300 62px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('21:47', w / 2, 132);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.roundRect(16, 188, w - 32, 78, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.roundRect(28, 202, 34, 34, 9);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(74, 206, 96, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(74, 226, 140, 7);
    ctx.fillRect(74, 242, 104, 7);
  });
}

/** Fumaça do café: um borrão radial branco. */
export function puffTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Bolinha de tênis (equiretangular): feltro verde-limão com a costura branca. */
export function tennisBallTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const random = seeded(3);
    ctx.fillStyle = '#d3ea3c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(255,255,200,0.25)' : 'rgba(120,140,20,0.18)';
      ctx.fillRect(random() * w, random() * h, 2, 2);
    }
    ctx.strokeStyle = '#f7f8ee';
    ctx.lineWidth = 9;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const u = i / 200;
      const lat = 0.42 * Math.sin(u * Math.PI * 4);
      const x = u * w;
      const y = h / 2 - lat * (h / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

/** Encordoamento da raquete: grade transparente. */
export function stringsTexture() {
  const texture = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(240,240,236,0.95)';
    ctx.lineWidth = 2.2;
    for (let i = 1; i < 16; i++) {
      const x = (i / 16) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = 1; i < 19; i++) {
      const y = (i / 19) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/** Palha trançada do chapéu: fileiras de tranças em espinha de peixe (cor e relevo). */
export function strawTexture() {
  return canvasTexture(256, 128, (ctx, w, h) => {
    const random = seeded(5);
    const rows = 8;
    const rowH = h / rows;
    ctx.fillStyle = '#7d5d2a';
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < rows; row++) {
      const y = row * rowH;
      for (let x = -rowH; x < w + rowH; x += 7) {
        const tone = 178 + Math.floor(random() * 42);
        ctx.fillStyle = `rgb(${tone}, ${Math.floor(tone * 0.8)}, ${Math.floor(tone * 0.45)})`;
        ctx.beginPath();
        // Metade de cima inclinada para um lado, a de baixo para o outro.
        ctx.moveTo(x, y + 1);
        ctx.lineTo(x + 6, y + 1);
        ctx.lineTo(x + 6 + rowH / 2, y + rowH / 2);
        ctx.lineTo(x + rowH / 2, y + rowH / 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + rowH / 2, y + rowH / 2);
        ctx.lineTo(x + 6 + rowH / 2, y + rowH / 2);
        ctx.lineTo(x + 6, y + rowH - 1);
        ctx.lineTo(x, y + rowH - 1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(80, 55, 20, 0.55)';
      ctx.fillRect(0, y, w, 1.5);
    }
  });
}
