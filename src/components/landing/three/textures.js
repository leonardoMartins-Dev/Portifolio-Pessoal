import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

const SANS = '"Outfit Variable", "Geist Variable", ui-sans-serif, system-ui, sans-serif';
const MONO = '"Geist Mono Variable", ui-monospace, Menlo, monospace';

function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  paint(ctx, width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  // Fontes ainda carregando: redesenha quando chegarem (senão o texto sai na fonte reserva).
  texture.repaint = () => {
    ctx.clearRect(0, 0, width, height);
    paint(ctx, width, height);
    texture.needsUpdate = true;
  };
  return texture;
}

/** Redesenha a textura quando a fonte usada nela terminar de carregar. */
function whenFontLoads(texture, font) {
  document.fonts?.load(font).then(
    () => texture.repaint(),
    () => {},
  );
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

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Trecho de um controller Spring (o que o autor estuda), já separado em [texto, cor].
const C = {
  plain: '#c5cad6',
  keyword: '#c792ea',
  type: '#7fd4e0',
  annotation: '#f2c46d',
  string: '#a5d68a',
  method: '#82aaff',
  muted: '#6b7080',
};
const CODE = [
  [['@RestController', C.annotation]],
  [
    ['@RequestMapping', C.annotation],
    ['(', C.plain],
    ['"/api/projects"', C.string],
    [')', C.plain],
  ],
  [
    ['public class ', C.keyword],
    ['ProjectController', C.type],
    [' {', C.plain],
  ],
  [],
  [
    ['    private final ', C.keyword],
    ['ProjectService', C.type],
    [' service;', C.plain],
  ],
  [],
  [['    @GetMapping', C.annotation]],
  [
    ['    public ', C.keyword],
    ['List', C.type],
    ['<', C.plain],
    ['Project', C.type],
    ['> ', C.plain],
    ['list', C.method],
    ['() {', C.plain],
  ],
  [
    ['        return ', C.keyword],
    ['service.', C.plain],
    ['findAll', C.method],
    ['();', C.plain],
  ],
  [['    }', C.plain]],
  [],
  [['    @PostMapping', C.annotation]],
  [
    ['    @PreAuthorize', C.annotation],
    ['(', C.plain],
    ['"hasRole(\'ADMIN\')"', C.string],
    [')', C.plain],
  ],
  [
    ['    public ', C.keyword],
    ['Project', C.type],
    [' ', C.plain],
    ['create', C.method],
    ['(', C.plain],
    ['@Valid ', C.annotation],
    ['ProjectDto', C.type],
    [' dto) {', C.plain],
  ],
  [
    ['        return ', C.keyword],
    ['service.', C.plain],
    ['save', C.method],
    ['(dto);', C.plain],
  ],
  [['    }', C.plain]],
  [['}', C.plain]],
];

/** Tela do monitor de código: editor escuro com barra lateral, aba e o controller. */
export function codeTexture() {
  const texture = canvasTexture(1280, 800, (ctx, w, h) => {
    ctx.fillStyle = '#1e1f27';
    ctx.fillRect(0, 0, w, h);
    // Barra de atividades e explorador de arquivos
    ctx.fillStyle = '#17181e';
    ctx.fillRect(0, 0, 64, h);
    ctx.fillStyle = '#1a1b22';
    ctx.fillRect(64, 0, 230, h);
    ['#5a67f2', '#3a3d4a', '#3a3d4a', '#3a3d4a'].forEach((color, index) => {
      ctx.fillStyle = color;
      roundedRect(ctx, 18, 28 + index * 64, 28, 28, 7);
      ctx.fill();
    });
    ctx.font = `500 19px ${MONO}`;
    ctx.textBaseline = 'middle';
    const files = [
      'controller',
      '  ProjectController',
      '  AuthController',
      'service',
      'model',
      'pom.xml',
    ];
    files.forEach((file, index) => {
      ctx.fillStyle = index === 1 ? '#e6e8ef' : C.muted;
      if (index === 1) {
        ctx.fillStyle = 'rgba(90,103,242,0.22)';
        ctx.fillRect(64, 76 + index * 40 - 18, 230, 36);
        ctx.fillStyle = '#e6e8ef';
      }
      ctx.fillText(file, 84, 76 + index * 40);
    });
    // Aba aberta
    ctx.fillStyle = '#1e1f27';
    ctx.fillRect(294, 0, w - 294, 56);
    ctx.fillStyle = '#262833';
    ctx.fillRect(294, 0, 300, 56);
    ctx.fillStyle = '#5a67f2';
    ctx.fillRect(294, 52, 300, 4);
    ctx.fillStyle = '#e6e8ef';
    ctx.fillText('ProjectController.java', 316, 28);
    // Código com números de linha
    ctx.font = `500 23px ${MONO}`;
    CODE.forEach((line, index) => {
      const y = 98 + index * 38;
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'right';
      ctx.fillText(String(index + 1), 352, y);
      ctx.textAlign = 'left';
      let x = 384;
      for (const [text, color] of line) {
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        x += ctx.measureText(text).width;
      }
    });
    // Cursor piscando na linha do return
    ctx.fillStyle = '#e6e8ef';
    ctx.fillRect(384 + 520, 98 + 14 * 38 - 15, 3, 30);
  });
  return whenFontLoads(texture, `500 23px ${MONO}`);
}

/** Bilhete preso no mural: papel colorido e texto "à mão" (linhas separadas por \n). */
export function noteTexture({ text, paper, ink = '#2d3140', seed = 1 }) {
  const texture = canvasTexture(320, 320, (ctx, w, h) => {
    const random = seeded(seed);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    // Leve dobra no canto e fibras do papel
    const fold = ctx.createLinearGradient(w * 0.7, h, w, h * 0.7);
    fold.addColorStop(0, 'rgba(0,0,0,0)');
    fold.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = fold;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i += 1) {
      ctx.fillStyle = `rgba(0,0,0,${random() * 0.04})`;
      ctx.fillRect(random() * w, random() * h, 2, 1);
    }
    ctx.fillStyle = ink;
    ctx.textBaseline = 'top';
    ctx.font = `600 38px ${SANS}`;
    text.split('\n').forEach((line, index) => {
      ctx.save();
      ctx.translate(28, 84 + index * 54);
      ctx.rotate((random() - 0.5) * 0.04);
      ctx.fillText(line, 0, 0);
      ctx.restore();
    });
  });
  return whenFontLoads(texture, `600 38px ${SANS}`);
}

/** Teclado visto de cima: teclas arredondadas em fileiras. */
export function keyboardTexture() {
  return canvasTexture(512, 176, (ctx, w, h) => {
    ctx.fillStyle = '#ebe7e0';
    ctx.fillRect(0, 0, w, h);
    const rows = [14, 14, 13, 12];
    rows.forEach((count, row) => {
      const keyW = (w - 24) / 14.6;
      const offset = 12 + (14 - count) * keyW * 0.5;
      for (let col = 0; col < count; col += 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        roundedRect(ctx, offset + col * keyW + 2, 14 + row * 36 + 3, keyW - 6, 30, 6);
        ctx.fill();
        ctx.fillStyle = '#fbfaf7';
        roundedRect(ctx, offset + col * keyW + 2, 14 + row * 36, keyW - 6, 29, 6);
        ctx.fill();
      }
    });
    // Barra de espaço
    ctx.fillStyle = '#fbfaf7';
    roundedRect(ctx, w * 0.3, 14 + 4 * 36, w * 0.4, 16, 6);
    ctx.fill();
  });
}

/** Bolinha de tênis (equiretangular): feltro verde-limão com a costura branca. */
export function tennisBallTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const random = seeded(3);
    ctx.fillStyle = '#d6ec43';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i += 1) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(255,255,200,0.25)' : 'rgba(120,140,20,0.16)';
      ctx.fillRect(random() * w, random() * h, 2, 2);
    }
    ctx.strokeStyle = '#f7f8ee';
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let i = 0; i <= 200; i += 1) {
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
    ctx.strokeStyle = 'rgba(246,244,238,0.95)';
    ctx.lineWidth = 2.6;
    for (let i = 1; i < 16; i += 1) {
      const x = (i / 16) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = 1; i < 19; i += 1) {
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

/** Palha trançada do chapéu do Luffy: fileiras de tranças em espinha de peixe. */
export function strawTexture() {
  return canvasTexture(256, 128, (ctx, w, h) => {
    const random = seeded(5);
    const rows = 8;
    const rowH = h / rows;
    ctx.fillStyle = '#9a7737';
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < rows; row += 1) {
      const y = row * rowH;
      for (let x = -rowH; x < w + rowH; x += 7) {
        const tone = 196 + Math.floor(random() * 40);
        ctx.fillStyle = `rgb(${tone}, ${Math.floor(tone * 0.82)}, ${Math.floor(tone * 0.48)})`;
        ctx.beginPath();
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
      ctx.fillStyle = 'rgba(80, 55, 20, 0.4)';
      ctx.fillRect(0, y, w, 1.5);
    }
  });
}
