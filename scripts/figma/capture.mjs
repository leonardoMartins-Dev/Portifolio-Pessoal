/**
 * Protótipo no Figma, tirado do próprio site: abre cada tela (intro,
 * bloqueio, área de trabalho, cada app e o celular), registra a página como
 * uma árvore de caixas, textos, ícones e imagens e gera o plugin
 * `scripts/figma/plugin/code.js`, que recria tudo como camadas editáveis no
 * Figma, com o protótipo clicável (dock → apps, notebook → bloqueio → desktop).
 *
 * Uso: com `npm run dev` rodando, `npm run figma`. Depois, no Figma desktop:
 * Plugins → Development → Import plugin from manifest → scripts/figma/plugin/manifest.json.
 * BASE troca o endereço do site; GPU=0 usa WebGL por software (a mesa 3D fica bem mais lenta).
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { APP_META } from '../../src/lib/apps-meta.js';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const LOCALE = 'pt';
const SOURCE = new URL('./plugin-main.js', import.meta.url);
const OUTPUT = new URL('./plugin/code.js', import.meta.url);
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const MOBILE_APPS = ['about', 'projects', 'contact'];
// Imagens grandes (papel de parede, mesa 3D) vão em JPEG: o PNG delas pesaria megabytes.
const JPEG_MIN_AREA = 0.4;
const useGpu = process.env.GPU !== '0';

const appTitle = (id) => APP_META.find((app) => app.id === id).title[LOCALE];

/** Telas na ordem em que aparecem no Figma. */
function screenList() {
  const apps = APP_META.flatMap((app) => {
    const screen = {
      id: `app:${app.id}`,
      name: appTitle(app.id),
      path: `/${app.id}`,
      ready: (page) => page.locator(`[data-window="${app.id}"]`).waitFor(),
      after: app.id === 'terminal' ? typeHelp : undefined,
    };
    if (app.id !== 'skills') return [screen];
    return [
      { ...screen, name: `${appTitle('skills')} (lista)` },
      {
        ...screen,
        id: 'app:skills-globe',
        name: `${appTitle('skills')} (globo)`,
        skillsView: 'globe',
        settle: 4000,
      },
    ];
  });
  return [
    {
      id: 'intro',
      page: 'Desktop',
      name: 'Intro (mesa 3D)',
      path: '',
      introSeen: false,
      ready: (page) =>
        page
          .getByRole('button', { name: 'Clique no notebook para abrir' })
          .waitFor({ timeout: 120_000 }),
      settle: 2500,
    },
    {
      id: 'lock',
      page: 'Desktop',
      name: 'Tela de bloqueio',
      path: '',
      introSeen: false,
      // Com movimento reduzido o sistema abre direto na tela de bloqueio.
      reducedMotion: true,
      ready: (page) => page.getByRole('dialog', { name: /Tela de bloqueio/ }).waitFor(),
    },
    {
      id: 'desktop',
      page: 'Desktop',
      name: 'Área de trabalho',
      path: '',
      ready: (page) => page.locator('[data-desktop-app]').first().waitFor(),
    },
    ...apps.map((screen) => ({ ...screen, page: 'Desktop' })),
    {
      id: 'm:home',
      page: 'Mobile',
      name: 'Início',
      path: '',
      mobile: true,
      ready: (page) => page.locator('[data-mobile-dock-app]').first().waitFor(),
    },
    ...MOBILE_APPS.map((id) => ({
      id: `m:app:${id}`,
      page: 'Mobile',
      name: appTitle(id),
      path: `/${id}`,
      mobile: true,
      ready: (page) => page.getByRole('dialog').waitFor(),
    })),
  ];
}

async function typeHelp(page) {
  const input = page.getByLabel('Comando do terminal');
  await input.fill('help');
  await input.press('Enter');
  await page.waitForTimeout(600);
}

/**
 * Marca os elementos que viram links do protótipo (`data-figma-link` com o
 * id da tela de destino). Destinos que não existem são ignorados pelo plugin.
 */
function markLinks(titles) {
  const set = (element, target) => element.setAttribute('data-figma-link', target);
  document
    .querySelectorAll('[data-dock-app]')
    .forEach((el) => set(el, `app:${el.dataset.dockApp}`));
  document
    .querySelectorAll('[data-desktop-app]')
    .forEach((el) => set(el, `app:${el.dataset.desktopApp}`));
  document
    .querySelectorAll('[data-mobile-dock-app]')
    .forEach((el) => set(el, `m:app:${el.dataset.mobileDockApp}`));
  document
    .querySelectorAll('[data-window] button[aria-label="Fechar"]')
    .forEach((el) => set(el, 'desktop'));
  document.querySelectorAll('section[aria-labelledby="mobile-apps"] button').forEach((el) => {
    const id = titles[el.textContent.trim()];
    if (id) set(el, `m:app:${id}`);
  });
  document.querySelectorAll('button').forEach((el) => {
    const text = el.textContent.trim();
    const radio = el.getAttribute('role') === 'radio';
    if (text === 'Clique no notebook para abrir' || text === 'Pular intro') set(el, 'lock');
    else if (text === 'Entrar') set(el, 'desktop');
    else if (text === 'Voltar' && el.closest('[role="dialog"]')) set(el, 'm:home');
    else if (radio && text === 'Globo') set(el, 'app:skills-globe');
    else if (radio && text === 'Lista') set(el, 'app:skills');
  });
}

/**
 * Roda no navegador: transforma a página visível numa árvore para o plugin.
 * Elementos que não dão para recriar em camadas (canvas 3D, vídeo, PDF,
 * fotos, fundos com imagem) ficam marcados com `data-figma-raster` e viram
 * imagem, recortada depois só com o próprio elemento visível.
 */
async function serializePage() {
  const VW = innerWidth;
  const VH = innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const colors = new Map();
  const rasters = [];
  const svgImages = new Map();

  const round = (n) => Math.round(n * 100) / 100;
  const px = (value) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  // Qualquer cor CSS (inclusive color-mix e oklab) → { r, g, b, a } de 0 a 1.
  function rgba(css) {
    if (!css || css === 'transparent' || css === 'none') return null;
    if (colors.has(css)) return colors.get(css);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const value = a === 0 ? null : { r: r / 255, g: g / 255, b: b / 255, a: round(a / 255) };
    colors.set(css, value);
    return value;
  }

  /** Divide por vírgulas que não estão dentro de parênteses. */
  function splitTop(text, separator = ',') {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const char of text) {
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;
      if (char === separator && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else current += char;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  const SIDES = { top: 0, right: 90, bottom: 180, left: 270 };
  function directionAngle(text) {
    const words = text.replace(/^to\s+/, '').split(/\s+/);
    if (words.length === 1) return SIDES[words[0]] ?? 180;
    const [a, b] = words.map((word) => SIDES[word]);
    if (a === undefined || b === undefined) return 180;
    // Cantos: média dos dois lados (top + left = 315°).
    return (a === 0 && b === 270) || (a === 270 && b === 0) ? 315 : (a + b) / 2;
  }

  /** linear-gradient(...) → { type: 'LINEAR', angle, stops }; outros fundos → null. */
  function parseLinear(layer) {
    const match = layer.match(/^linear-gradient\((.*)\)$/s);
    if (!match) return null;
    const parts = splitTop(match[1]);
    let angle = 180;
    const head = parts[0].replace(/\s*in\s+[\w-]+(\s+\w+\s+hue)?\s*$/, '').trim();
    if (/^-?[\d.]+(deg|turn|rad|grad)$/.test(head)) {
      const value = parseFloat(head);
      angle = head.endsWith('turn')
        ? value * 360
        : head.endsWith('grad')
          ? value * 0.9
          : head.endsWith('rad')
            ? (value * 180) / Math.PI
            : value;
      parts.shift();
    } else if (/^to\s/.test(head)) {
      angle = directionAngle(head);
      parts.shift();
    } else if (head === '' || /^in\s/.test(parts[0])) {
      parts.shift();
    }
    const stops = parts.map((part) => {
      const tokens = splitTop(part, ' ');
      return {
        color: rgba(tokens[0]),
        pos: tokens[1]?.endsWith('%') ? parseFloat(tokens[1]) / 100 : null,
      };
    });
    if (stops.length < 2 || stops.some((stop) => !stop.color)) return null;
    stops.forEach((stop, index) => {
      stop.pos ??= index / (stops.length - 1);
    });
    return { type: 'LINEAR', angle, stops };
  }

  function shadows(value) {
    if (!value || value === 'none') return [];
    return splitTop(value).flatMap((shadow) => {
      const inset = /\binset\b/.test(shadow);
      const colorMatch = shadow.match(/(rgba?|color|oklab|oklch|hsla?)\([^)]*\)|#[0-9a-f]{3,8}/i);
      const color = rgba(colorMatch?.[0] ?? 'black');
      const lengths = shadow
        .replace(colorMatch?.[0] ?? '', '')
        .replace('inset', '')
        .trim()
        .split(/\s+/)
        .map(px);
      if (!color) return [];
      const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
      return [{ type: inset ? 'INNER_SHADOW' : 'DROP_SHADOW', color, x, y, blur, spread }];
    });
  }

  function blurOf(value) {
    const match = value?.match(/blur\(([\d.]+)px\)/);
    return match ? parseFloat(match[1]) : 0;
  }

  function intersect(a, b) {
    const x0 = Math.max(a.x0, b.x0);
    const y0 = Math.max(a.y0, b.y0);
    const x1 = Math.min(a.x1, b.x1);
    const y1 = Math.min(a.y1, b.y1);
    return x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : null;
  }
  const boxOf = (rect) => ({ x0: rect.left, y0: rect.top, x1: rect.right, y1: rect.bottom });

  function familyOf(cs) {
    const first = cs.fontFamily
      .split(',')[0]
      .trim()
      .replace(/^["']|["']$/g, '');
    return first.replace(/\s+Variable$/, '');
  }

  function nameOf(el) {
    const label =
      el.dataset.window ||
      el.getAttribute('aria-label') ||
      el.getAttribute('title') ||
      (/^(BUTTON|A)$/.test(el.tagName) ? el.textContent.trim() : '') ||
      el.getAttribute('role') ||
      '';
    const tag = el.tagName.toLowerCase();
    return (label ? `${tag} · ${label}` : tag).slice(0, 60);
  }

  const isSvgUrl = (src) => /\.svg(\?|#|$)/i.test(src) || src.startsWith('data:image/svg');

  function svgMarkup(svg, cs, rect) {
    const clone = svg.cloneNode(true);
    const color = rgba(cs.color) ?? { r: 0, g: 0, b: 0, a: 1 };
    const hex = `#${[color.r, color.g, color.b]
      .map((c) =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', round(rect.width));
    clone.setAttribute('height', round(rect.height));
    if (color.a < 1) clone.setAttribute('opacity', color.a);
    clone.removeAttribute('class');
    clone.querySelectorAll('[class]').forEach((child) => child.removeAttribute('class'));
    return new XMLSerializer().serializeToString(clone).replaceAll('currentColor', hex);
  }

  function rasterNode(el, rect, kind, children) {
    const id = String(rasters.length);
    el.setAttribute('data-figma-raster', id);
    rasters.push({ id, kind });
    const box = {
      x: round(rect.left),
      y: round(rect.top),
      w: round(rect.width),
      h: round(rect.height),
    };
    return { t: 'raster', raster: id, n: nameOf(el), ...box, children };
  }

  function textNode(node, parent, cs, clip, opacity, z) {
    const pre = /^(pre|pre-wrap|break-spaces)$/.test(cs.whiteSpace);
    let chars = pre ? node.data.replace(/\n$/, '') : node.data.replace(/\s+/g, ' ').trim();
    if (!chars) return null;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) return null;
    let box = {
      x0: Math.min(...rects.map((r) => r.left)),
      y0: Math.min(...rects.map((r) => r.top)),
      x1: Math.max(...rects.map((r) => r.right)),
      y1: Math.max(...rects.map((r) => r.bottom)),
    };
    const lines = new Set(rects.map((r) => Math.round(r.top / 3))).size;
    const parentRect = parent.getBoundingClientRect();
    // Elemento com transform (globo das skills): a fonte acompanha a escala.
    const scale =
      parent.offsetWidth && cs.transform !== 'none' ? parentRect.width / parent.offsetWidth : 1;
    const lineHeight = cs.lineHeight === 'normal' ? null : px(cs.lineHeight) * scale;
    const clamp =
      cs.webkitLineClamp && cs.webkitLineClamp !== 'none' ? parseInt(cs.webkitLineClamp, 10) : 0;
    const ellipsis = cs.textOverflow === 'ellipsis' && cs.overflowX !== 'visible';
    // O retângulo do texto é o do desenho da fonte; o Figma posiciona pela caixa
    // da linha. Com line-height diferente da fonte, a diferença vai para o topo.
    if (lineHeight) {
      box.y0 += (rects[0].height - lineHeight) / 2;
      box.y1 = box.y0 + (clamp ? Math.min(lines, clamp) : ellipsis ? 1 : lines) * lineHeight;
    }
    if (ellipsis || clamp) {
      box = { ...box, x1: Math.min(box.x1, parentRect.right - px(cs.paddingRight)) };
    }
    if (!intersect(box, clip)) return null;
    const color = rgba(cs.color);
    if (!color) return null;
    if (cs.textTransform === 'uppercase') chars = chars.toUpperCase();
    const align =
      { center: 'CENTER', right: 'RIGHT', end: 'RIGHT', justify: 'JUSTIFIED' }[cs.textAlign] ??
      'LEFT';
    return {
      t: 'text',
      z,
      n: chars.slice(0, 40),
      x: round(box.x0),
      y: round(box.y0),
      w: round(box.x1 - box.x0),
      h: round(box.y1 - box.y0),
      chars,
      font: {
        family: familyOf(cs),
        weight: parseInt(cs.fontWeight, 10) || 400,
        italic: cs.fontStyle === 'italic',
        mono: /mono|courier|consol|menlo/i.test(cs.fontFamily),
      },
      size: round(px(cs.fontSize) * scale),
      lh: lineHeight ? round(lineHeight) : null,
      ls: cs.letterSpacing === 'normal' ? 0 : round(px(cs.letterSpacing) * scale),
      color: { ...color, a: round(color.a * opacity) },
      align,
      deco: cs.textDecorationLine.includes('underline')
        ? 'UNDERLINE'
        : cs.textDecorationLine.includes('line-through')
          ? 'STRIKETHROUGH'
          : null,
      lines,
      truncate: ellipsis || clamp > 0,
      maxLines: clamp || null,
    };
  }

  const FRAME_TAGS = /^(NAV|HEADER|MAIN|FOOTER|ASIDE|DIALOG)$/;

  /**
   * Percorre um elemento. Elementos sem nada visível (só layout) não viram
   * camada: os filhos sobem para o frame mais próximo.
   */
  function walk(el, clip, opacity, z, out) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const elOpacity = px(cs.opacity === '' ? '1' : cs.opacity);
    if (elOpacity <= 0.01) return;
    const rect = el.getBoundingClientRect();
    const clips = cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
    // Só para leitores de tela (sr-only): fica de fora.
    if (clips && rect.width <= 1 && rect.height <= 1) return;
    if (cs.clipPath === 'inset(50%)' || cs.clip === 'rect(0px, 0px, 0px, 0px)') return;
    const visibleBox = intersect(boxOf(rect), clip);
    if (clips && !visibleBox) return;

    const position = cs.position !== 'static';
    const ownZ = position && cs.zIndex !== 'auto' ? parseInt(cs.zIndex, 10) : z;
    const tag = el.tagName;

    if (el instanceof SVGSVGElement) {
      if (!visibleBox || rect.width < 0.5) return;
      out.push({
        t: 'svg',
        z: ownZ,
        n: nameOf(el),
        x: round(rect.left),
        y: round(rect.top),
        w: round(rect.width),
        h: round(rect.height),
        svg: svgMarkup(el, cs, rect),
        opacity: round(elOpacity * opacity),
      });
      return;
    }
    if (tag === 'IMG') {
      if (!visibleBox) return;
      const src = el.currentSrc || el.src;
      if (isSvgUrl(src)) {
        svgImages.set(src, null);
        out.push({
          t: 'svgimg',
          z: ownZ,
          n: nameOf(el),
          src,
          x: round(rect.left),
          y: round(rect.top),
          w: round(rect.width),
          h: round(rect.height),
          opacity: round(elOpacity * opacity),
        });
      } else {
        out.push({ ...rasterNode(el, rect, 'element'), z: ownZ });
      }
      return;
    }
    if (/^(CANVAS|VIDEO|OBJECT|IFRAME|EMBED)$/.test(tag)) {
      if (visibleBox) out.push({ ...rasterNode(el, rect, 'element'), z: ownZ });
      return;
    }

    // Visual do próprio elemento.
    const fills = [];
    const background = rgba(cs.backgroundColor);
    let rasterBackground = false;
    if (background) fills.push({ type: 'SOLID', color: background });
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      const layers = splitTop(cs.backgroundImage).map(parseLinear);
      if (layers.every(Boolean)) fills.push(...layers.reverse());
      else rasterBackground = true;
    }
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
      w: px(cs[`border${side}Width`]),
      style: cs[`border${side}Style`],
      color: rgba(cs[`border${side}Color`]),
    }));
    const drawn = sides.map((s) => (s.w > 0 && s.color && !/none|hidden/.test(s.style) ? s.w : 0));
    const firstSide = sides[drawn.findIndex((w) => w > 0)];
    const stroke = firstSide
      ? { color: firstSide.color, weights: drawn, dashed: /dashed|dotted/.test(firstSide.style) }
      : null;
    const maxRadius = Math.min(rect.width, rect.height) / 2;
    const radius = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((corner) => {
      const value = cs[`border${corner}Radius`].split(' ')[0];
      const n = value.endsWith('%') ? (parseFloat(value) / 100) * rect.width : px(value);
      return round(Math.min(n, maxRadius));
    });
    const effects = shadows(cs.boxShadow);
    const backdrop = blurOf(cs.backdropFilter);
    if (backdrop) effects.push({ type: 'BACKGROUND_BLUR', blur: backdrop });
    const layerBlur = blurOf(cs.filter);
    if (layerBlur && !rasterBackground) effects.push({ type: 'LAYER_BLUR', blur: layerBlur });

    const link = el.getAttribute('data-figma-link');
    const hasVisual = fills.length > 0 || stroke || effects.length > 0 || rasterBackground;
    const isFrame =
      hasVisual ||
      clips ||
      link ||
      FRAME_TAGS.test(tag) ||
      el.dataset.window ||
      el.getAttribute('role') === 'dialog';

    const children = [];
    const childClip = clips ? (visibleBox ?? clip) : clip;
    const childOpacity = isFrame ? 1 : opacity * elOpacity;
    const childZ = isFrame ? 0 : ownZ;
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = textNode(child, el, cs, childClip, childOpacity, childZ);
        if (text) children.push(text);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child, childClip, childOpacity, childZ, children);
      }
    }
    // Dentro de cada frame, quem tem z-index maior fica por cima (ordem estável).
    const sorted = children
      .map((child, index) => ({ child, index }))
      .sort((a, b) => (a.child.z ?? 0) - (b.child.z ?? 0) || a.index - b.index)
      .map(({ child }) => child);

    if (!isFrame) {
      out.push(...sorted);
      return;
    }
    if (!visibleBox && !sorted.length) return;
    const node = {
      t: 'frame',
      z: ownZ,
      n: nameOf(el),
      x: round(rect.left),
      y: round(rect.top),
      w: round(rect.width),
      h: round(rect.height),
      fills,
      stroke,
      radius: radius.some(Boolean) ? radius : null,
      effects,
      opacity: round(elOpacity * opacity),
      clip: clips,
      link,
      children: sorted,
    };
    if (rasterBackground) {
      const id = String(rasters.length);
      el.setAttribute('data-figma-raster', id);
      rasters.push({ id, kind: 'background' });
      node.fills = [{ type: 'RASTER', raster: id }];
    }
    out.push(node);
  }

  const root = [];
  const viewport = { x0: 0, y0: 0, x1: VW, y1: VH };
  walk(document.body, viewport, 1, 0, root);
  const page = getComputedStyle(document.body).backgroundColor;

  // SVGs usados em <img> (ícones das skills, logos): o texto do arquivo vira vetor.
  await Promise.all(
    [...svgImages.keys()].map(async (src) => {
      try {
        svgImages.set(src, await (await fetch(src)).text());
      } catch {
        svgImages.delete(src);
      }
    }),
  );
  return {
    background: rgba(page) ?? rgba(getComputedStyle(document.documentElement).backgroundColor),
    children: root,
    rasters,
    svgImages: Object.fromEntries(svgImages),
  };
}

/** Recorta só um elemento (o resto da página fica invisível) e devolve a imagem. */
async function shootRaster(page, raster, rect, viewport) {
  const clip = {
    x: Math.max(0, rect.x),
    y: Math.max(0, rect.y),
    width: Math.min(viewport.width, rect.x + rect.w) - Math.max(0, rect.x),
    height: Math.min(viewport.height, rect.y + rect.h) - Math.max(0, rect.y),
  };
  if (clip.width < 1 || clip.height < 1) return null;
  await page.evaluate(({ id, kind }) => {
    const target = `[data-figma-raster="${id}"]`;
    const style = document.createElement('style');
    style.id = 'figma-solo';
    style.textContent = `
      html, body { background: transparent !important; }
      html { visibility: hidden !important; }
      ${target} { visibility: visible !important; }
      ${kind === 'background' ? `${target} { border-color: transparent !important; box-shadow: none !important; } ${target} * { visibility: hidden !important; }` : ''}`;
    document.head.append(style);
  }, raster);
  const big = (clip.width * clip.height) / (viewport.width * viewport.height) >= JPEG_MIN_AREA;
  const buffer = await page.screenshot({
    clip,
    type: big ? 'jpeg' : 'png',
    quality: big ? 85 : undefined,
    omitBackground: !big,
  });
  await page.evaluate(() => document.getElementById('figma-solo')?.remove());
  return { type: big ? 'jpeg' : 'png', data: buffer.toString('base64'), clip };
}

function hashOf(text) {
  return createHash('sha1').update(text).digest('hex').slice(0, 16);
}

async function captureScreen(browser, screen, images) {
  const viewport = screen.mobile ? MOBILE : DESKTOP;
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    reducedMotion: screen.reducedMotion ? 'reduce' : 'no-preference',
    ...(screen.mobile ? { isMobile: true, hasTouch: true } : {}),
  });
  await context.addInitScript(
    ({ introSeen, skillsView }) => {
      if (introSeen) sessionStorage.setItem('portifolio:intro-seen', '1');
      localStorage.setItem(
        'portifolio:prefs',
        JSON.stringify({
          state: { firstVisitDone: true, theme: 'dark', skillsView },
          version: 0,
        }),
      );
    },
    { introSeen: screen.introSeen !== false, skillsView: screen.skillsView ?? 'list' },
  );
  const page = await context.newPage();
  page.on('pageerror', (error) =>
    console.warn(`  [${screen.id}] erro na página: ${error.message}`),
  );
  await page.goto(`${BASE}/${LOCALE}${screen.path}`);
  await screen.ready(page);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(screen.settle ?? 1500);
  if (screen.after) await screen.after(page);
  // Sem animações de CSS no meio da captura (o "pulsar" da dica da intro, por exemplo).
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  });
  await page.waitForTimeout(150);

  const titles = Object.fromEntries(APP_META.map((app) => [app.title[LOCALE], app.id]));
  await page.evaluate(markLinks, titles);
  const tree = await page.evaluate(serializePage);

  // Imagens: recorte de cada elemento e SVGs dos <img>.
  const rasterImages = {};
  const findRaster = (nodes, id) => {
    for (const node of nodes) {
      if (node.raster === id || node.fills?.some((fill) => fill.raster === id)) return node;
      const found = node.children && findRaster(node.children, id);
      if (found) return found;
    }
    return null;
  };
  for (const raster of tree.rasters) {
    const node = findRaster(tree.children, raster.id);
    const shot = node && (await shootRaster(page, raster, node, viewport));
    if (!shot) continue;
    const key = hashOf(shot.data);
    images[key] ??= { type: shot.type, data: shot.data };
    rasterImages[raster.id] = { key, clip: shot.clip };
  }
  const svgKeys = {};
  for (const [src, svg] of Object.entries(tree.svgImages)) {
    if (!svg?.includes('<svg')) continue;
    const key = hashOf(svg);
    images[key] ??= { type: 'svg', data: svg };
    svgKeys[src] = key;
  }

  // Troca as referências provisórias pelas chaves das imagens.
  const resolve = (nodes) =>
    nodes.flatMap((node) => {
      if (node.t === 'raster') {
        const image = rasterImages[node.raster];
        if (!image) return [];
        const { x, y, width, height } = image.clip;
        return [{ t: 'image', n: node.n, img: image.key, x, y, w: width, h: height }];
      }
      if (node.t === 'svgimg') {
        return svgKeys[node.src]
          ? [{ ...node, t: 'svgref', img: svgKeys[node.src], src: undefined }]
          : [];
      }
      if (node.t === 'frame') {
        node.fills = node.fills.flatMap((fill) =>
          fill.type === 'RASTER'
            ? rasterImages[fill.raster]
              ? [{ type: 'IMAGE', img: rasterImages[fill.raster].key }]
              : []
            : [fill],
        );
        node.children = resolve(node.children);
      }
      return [node];
    });

  await context.close();
  return {
    id: screen.id,
    name: screen.name,
    width: viewport.width,
    height: viewport.height,
    background: tree.background,
    children: resolve(tree.children),
  };
}

function countNodes(nodes) {
  return nodes.reduce((sum, node) => sum + 1 + (node.children ? countNodes(node.children) : 0), 0);
}

const browser = await chromium.launch({
  args: useGpu
    ? ['--ignore-gpu-blocklist', ...(process.platform === 'darwin' ? ['--use-angle=metal'] : [])]
    : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const images = {};
const pages = [];
const screens = screenList();
for (const [index, screen] of screens.entries()) {
  const started = Date.now();
  const captured = await captureScreen(browser, screen, images).catch((error) => {
    console.warn(`✗ ${screen.name}: ${error.message.split('\n')[0]}`);
    return null;
  });
  if (!captured) continue;
  let page = pages.find((p) => p.name === screen.page);
  if (!page) pages.push((page = { name: screen.page, screens: [] }));
  const number = String(page.screens.length + 1).padStart(2, '0');
  page.screens.push({ ...captured, name: `${number} · ${captured.name}` });
  console.log(
    `✓ ${String(index + 1).padStart(2)}/${screens.length} ${screen.page} · ${captured.name} (${countNodes(captured.children)} camadas, ${((Date.now() - started) / 1000).toFixed(1)}s)`,
  );
}
await browser.close();

const data = { version: 1, generatedAt: new Date().toISOString(), base: BASE, images, pages };
const source = await readFile(SOURCE, 'utf8');
await writeFile(
  OUTPUT,
  `// Gerado por scripts/figma/capture.mjs (npm run figma). Não edite: rode de novo.\nvar DATA = ${JSON.stringify(data)};\n\n${source}`,
);
const size = (Buffer.byteLength(JSON.stringify(data)) / 1024 / 1024).toFixed(1);
console.log(
  `\nPlugin gerado: scripts/figma/plugin/code.js (${size} MB, ${Object.keys(images).length} imagens).`,
);
console.log(
  'No Figma desktop: Plugins → Development → Import plugin from manifest → scripts/figma/plugin/manifest.json',
);
