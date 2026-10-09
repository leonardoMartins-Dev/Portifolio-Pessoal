/**
 * Plugin do Figma que monta o protótipo do Portifólio a partir da captura
 * do site (DATA, gerado por scripts/figma/capture.mjs). Cada tela vira um
 * frame com camadas editáveis, na página aberta (o plano gratuito do Figma
 * limita o número de páginas), com os links do protótipo e um fluxo para o
 * desktop e outro para o celular.
 *
 * Dois estilos, escolhidos no menu do plugin:
 * - "wireframe" (padrão): preto e branco, imagens como caixas com um X;
 * - "full": cores, sombras, imagens e ícones como no site.
 *
 * Escrito em JavaScript "simples" (sem ?. nem ??) para rodar em qualquer
 * versão do ambiente de plugins do Figma.
 */

var STYLE = figma.command === 'full' ? 'full' : 'wireframe';
var COLUMNS = { Desktop: 4, Mobile: 6 };
var GAP = 160;
var SECTION_GAP = 400;
var SANS_FALLBACK = ['Inter', 'Roboto', 'Arial'];
var MONO_FALLBACK = [
  'Geist Mono',
  'JetBrains Mono',
  'Roboto Mono',
  'Source Code Pro',
  'Courier New',
];
var WEIGHT_WORDS = [
  ['extralight', 200],
  ['ultralight', 200],
  ['thin', 100],
  ['light', 300],
  ['semibold', 600],
  ['demibold', 600],
  ['extrabold', 800],
  ['ultrabold', 800],
  ['bold', 700],
  ['medium', 500],
  ['black', 900],
  ['heavy', 900],
  ['regular', 400],
  ['normal', 400],
  ['book', 400],
];
var TRANSITION = { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.25 };
// Tons do wireframe.
var WF = {
  paper: { r: 1, g: 1, b: 1, a: 1 },
  soft: { r: 0.9, g: 0.9, b: 0.9, a: 1 },
  area: { r: 0.94, g: 0.94, b: 0.94, a: 1 },
  line: { r: 0.13, g: 0.13, b: 0.13, a: 1 },
  ink: { r: 0.07, g: 0.07, b: 0.07, a: 1 },
  muted: { r: 0.42, g: 0.42, b: 0.42, a: 1 },
  icon: '#333333',
  cross: '#9E9E9E',
};
// Nome das imagens no wireframe, pelo elemento de origem.
var PLACEHOLDERS = [
  { pattern: /^canvas/, label: 'Cena 3D' },
  { pattern: /^video/, label: 'Vídeo' },
  { pattern: /^object|^embed|^iframe/, label: 'Documento (PDF)' },
  { pattern: /^img/, label: 'Imagem' },
];

function norm(text) {
  return String(text)
    .toLowerCase()
    .replace(/[\s_-]/g, '');
}

/** "Semi Bold Italic" → { weight: 600, italic: true }; estilos estranhos (Condensed…) → null. */
function parseStyle(style) {
  var rest = norm(style);
  var italic = /italic|oblique/.test(rest);
  rest = rest.replace(/italic|oblique/, '');
  if (rest === '') return { weight: 400, italic: italic };
  for (var i = 0; i < WEIGHT_WORDS.length; i += 1) {
    if (rest === WEIGHT_WORDS[i][0]) return { weight: WEIGHT_WORDS[i][1], italic: italic };
  }
  return null;
}

/** Fontes disponíveis → função que acha a mais parecida com a do site. */
async function fontResolver() {
  var list = await figma.listAvailableFontsAsync();
  var families = {};
  list.forEach(function (font) {
    var parsed = parseStyle(font.fontName.style);
    if (!parsed) return;
    var key = font.fontName.family;
    if (!families[key]) families[key] = [];
    families[key].push({
      style: font.fontName.style,
      weight: parsed.weight,
      italic: parsed.italic,
    });
  });
  var cache = {};
  return function resolve(font) {
    var key = font.family + '|' + font.weight + '|' + font.italic + '|' + font.mono;
    if (cache[key]) return cache[key];
    var candidates = [font.family].concat(font.mono ? MONO_FALLBACK : SANS_FALLBACK);
    for (var i = 0; i < candidates.length; i += 1) {
      var styles = families[candidates[i]];
      if (!styles) continue;
      var best = null;
      var bestScore = Infinity;
      styles.forEach(function (option) {
        var score =
          Math.abs(option.weight - font.weight) + (option.italic === font.italic ? 0 : 1000);
        if (score < bestScore) {
          best = option;
          bestScore = score;
        }
      });
      if (best) {
        cache[key] = { family: candidates[i], style: best.style };
        return cache[key];
      }
    }
    cache[key] = { family: 'Inter', style: 'Regular' };
    return cache[key];
  };
}

function eachNode(nodes, visit) {
  nodes.forEach(function (node) {
    visit(node);
    if (node.children) eachNode(node.children, visit);
  });
}

/** @returns {SolidPaint} */
function solid(color) {
  return { type: 'SOLID', color: { r: color.r, g: color.g, b: color.b }, opacity: color.a };
}

function luminance(color) {
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

function saturation(color) {
  var max = Math.max(color.r, color.g, color.b);
  var min = Math.min(color.r, color.g, color.b);
  return max === 0 ? 0 : (max - min) / max;
}

/**
 * Ângulo do CSS (0° = para cima, sentido horário) → gradientTransform do
 * Figma, que leva as coordenadas da camada (0..1) para as do gradiente
 * (de x = 0 a x = 1). As linhas de mesma cor ficam perpendiculares em pixels.
 */
function linearTransform(angle, width, height) {
  var w = Math.max(width, 0.01);
  var h = Math.max(height, 0.01);
  var rad = (angle * Math.PI) / 180;
  var dx = Math.sin(rad);
  var dy = -Math.cos(rad);
  var length = Math.abs(w * dx) + Math.abs(h * dy);
  var x0 = 0.5 - (dx * length) / 2 / w;
  var y0 = 0.5 - (dy * length) / 2 / h;
  var vx = (dx * length) / w;
  var vy = (dy * length) / h;
  var ux = -dy / w;
  var uy = dx / h;
  var det = vx * uy - ux * vy;
  var a = uy / det;
  var b = -ux / det;
  var d = (0.5 * -vy) / det;
  var e = (0.5 * vx) / det;
  return [
    [a, b, -(a * x0 + b * y0)],
    [d, e, 0.5 - (d * x0 + e * y0)],
  ];
}

function paintsOf(fills, node, images) {
  var paints = [];
  fills.forEach(function (fill) {
    if (fill.type === 'SOLID') paints.push(solid(fill.color));
    else if (fill.type === 'LINEAR') {
      paints.push({
        type: 'GRADIENT_LINEAR',
        gradientTransform: linearTransform(fill.angle, node.w, node.h),
        gradientStops: fill.stops.map(function (stop) {
          return {
            position: Math.min(1, Math.max(0, stop.pos)),
            color: { r: stop.color.r, g: stop.color.g, b: stop.color.b, a: stop.color.a },
          };
        }),
      });
    } else if (fill.type === 'IMAGE' && images[fill.img]) {
      paints.push({ type: 'IMAGE', scaleMode: 'FILL', imageHash: images[fill.img] });
    }
  });
  return paints;
}

function effectsOf(effects) {
  return effects.map(function (effect) {
    if (effect.type === 'BACKGROUND_BLUR' || effect.type === 'LAYER_BLUR') {
      return { type: effect.type, blurType: 'NORMAL', radius: effect.blur, visible: true };
    }
    var shadow = {
      type: effect.type,
      color: { r: effect.color.r, g: effect.color.g, b: effect.color.b, a: effect.color.a },
      offset: { x: effect.x, y: effect.y },
      radius: Math.max(0, effect.blur),
      spread: effect.spread,
      visible: true,
      blendMode: 'NORMAL',
    };
    if (effect.type === 'DROP_SHADOW') shadow.showShadowBehindNode = false;
    return shadow;
  });
}

function place(node, layer, origin) {
  layer.x = node.x - origin.x;
  layer.y = node.y - origin.y;
}

function setStroke(frame, color, weights) {
  frame.strokes = [solid(color)];
  frame.strokeAlign = 'INSIDE';
  if (weights[0] === weights[1] && weights[1] === weights[2] && weights[2] === weights[3]) {
    frame.strokeWeight = weights[0];
  } else {
    frame.strokeTopWeight = weights[0];
    frame.strokeRightWeight = weights[1];
    frame.strokeBottomWeight = weights[2];
    frame.strokeLeftWeight = weights[3];
  }
}

/**
 * Wireframe: fundos com imagem viram área cinza; caixas com cor ou borda
 * viram brancas com contorno preto (as de destaque, cinza claro); fundos do
 * tamanho da tela ficam brancos e sem contorno.
 */
function wireframeBox(node, frame, env) {
  var image = node.fills.some(function (fill) {
    return fill.type === 'IMAGE';
  });
  var colored = node.fills.filter(function (fill) {
    return fill.type === 'LINEAR' || (fill.type === 'SOLID' && fill.color.a >= 0.08);
  });
  if (image) {
    frame.fills = [solid(WF.area)];
    return;
  }
  if (!colored.length && !node.stroke) {
    frame.fills = [];
    return;
  }
  if (node.w * node.h >= env.screenArea * 0.6) {
    frame.fills = [solid(WF.paper)];
    return;
  }
  var strong = colored.some(function (fill) {
    return fill.type === 'LINEAR' || (fill.color.a > 0.6 && saturation(fill.color) > 0.35);
  });
  frame.fills = colored.length ? [solid(strong ? WF.soft : WF.paper)] : [];
  var weights = node.stroke
    ? node.stroke.weights.map(function (w) {
        return w > 0 ? 1 : 0;
      })
    : [1, 1, 1, 1];
  setStroke(frame, WF.line, weights);
}

function buildFrame(node, parent, origin, env) {
  var frame = figma.createFrame();
  frame.name = node.n;
  parent.appendChild(frame);
  place(node, frame, origin);
  frame.resize(Math.max(node.w, 0.01), Math.max(node.h, 0.01));
  frame.clipsContent = Boolean(node.clip);
  if (node.radius) {
    frame.topLeftRadius = node.radius[0];
    frame.topRightRadius = node.radius[1];
    frame.bottomRightRadius = node.radius[2];
    frame.bottomLeftRadius = node.radius[3];
  }
  if (STYLE === 'wireframe') {
    wireframeBox(node, frame, env);
  } else {
    frame.fills = paintsOf(node.fills, node, env.images);
    if (node.opacity < 1) frame.opacity = node.opacity;
    if (node.stroke) {
      setStroke(frame, node.stroke.color, node.stroke.weights);
      if (node.stroke.dashed) frame.dashPattern = [4, 4];
    }
    if (node.effects.length) frame.effects = effectsOf(node.effects);
  }
  if (node.link) env.links.push({ layer: frame, target: node.link });
  node.children.forEach(function (child) {
    build(child, frame, node, env);
  });
  return frame;
}

function textColor(color) {
  if (STYLE === 'full') return color;
  // Texto principal (claro no tema escuro) em preto; o secundário em cinza.
  return luminance(color) >= 0.8 && color.a >= 0.75 ? WF.ink : WF.muted;
}

// Símbolos de teclado (⌘K) que a Geist do Figma não tem: esses textos vão em Inter.
var KEY_SYMBOLS = /[⌘⌥⇧⌃]/;

function fontOf(node) {
  if (!KEY_SYMBOLS.test(node.chars)) return node.font;
  return { family: 'Inter', weight: node.font.weight, italic: node.font.italic, mono: false };
}

/** Deslocamento para manter o alinhamento do site quando a largura muda. */
function alignShift(node, width) {
  if (node.align === 'CENTER') return (node.w - width) / 2;
  if (node.align === 'RIGHT') return node.w - width;
  return 0;
}

function buildText(node, parent, origin, env) {
  var text = figma.createText();
  text.fontName = env.font(fontOf(node));
  text.characters = node.chars;
  text.name = node.n;
  text.fontSize = Math.max(1, node.size);
  if (node.lh) text.lineHeight = { unit: 'PIXELS', value: node.lh };
  if (node.ls) text.letterSpacing = { unit: 'PIXELS', value: node.ls };
  text.fills = [solid(textColor(node.color))];
  text.textAlignHorizontal = node.align;
  if (node.deco) text.textDecoration = node.deco;
  parent.appendChild(text);
  if (node.lines > 1) {
    // Várias linhas: largura fixa com folga (a fonte no Figma sai um pouco mais
    // larga que no navegador), para a quebra cair no mesmo lugar.
    var width = Math.max(node.w + Math.ceil(node.w * 0.04) + 2, 1);
    text.resize(width, Math.max(node.h, 1));
    text.textAutoResize = 'HEIGHT';
    if (node.maxLines) {
      text.textTruncation = 'ENDING';
      text.maxLines = node.maxLines;
    }
    text.x = node.x - origin.x + alignShift(node, width);
    text.y = node.y - origin.y;
    return text;
  }
  // Uma linha: largura automática, alinhada como no site e centrada na altura da linha.
  text.textAutoResize = 'WIDTH_AND_HEIGHT';
  if (node.truncate && text.width > node.w * 1.1 + 2) {
    // Cortado de verdade no site (reticências): mesma largura visível.
    var height = text.height;
    text.textAutoResize = 'NONE';
    text.resize(Math.max(node.w, 1), height);
    text.textTruncation = 'ENDING';
  }
  text.x = node.x - origin.x + alignShift(node, text.width);
  text.y = node.y - origin.y + (node.h - text.height) / 2;
  return text;
}

/** No wireframe, todo traço e preenchimento do ícone fica cinza-escuro. */
function monochrome(markup) {
  return markup
    .replace(/(fill|stroke)="(?!none)[^"]*"/g, '$1="' + WF.icon + '"')
    .replace(/stop-color="[^"]*"/g, 'stop-color="' + WF.icon + '"');
}

function buildSvg(markup, node, parent, origin) {
  var layer;
  try {
    layer = figma.createNodeFromSvg(STYLE === 'wireframe' ? monochrome(markup) : markup);
  } catch (error) {
    // SVG que o Figma não entende: fica um espaço vazio do mesmo tamanho.
    layer = figma.createRectangle();
    layer.fills = [];
    layer.resize(Math.max(node.w, 0.01), Math.max(node.h, 0.01));
  }
  layer.name = node.n;
  parent.appendChild(layer);
  place(node, layer, origin);
  if (layer.width > 0 && Math.abs(layer.width - node.w) > 0.5) {
    layer.rescale(node.w / layer.width);
  }
  if (STYLE === 'full' && node.opacity !== undefined && node.opacity < 1) {
    layer.opacity = node.opacity;
  }
  return layer;
}

/** Caixa cinza com um X (e o nome, se couber): a imagem no wireframe. */
function buildPlaceholder(node, parent, origin, env, label) {
  var frame = figma.createFrame();
  frame.name = label + ' · ' + node.n;
  parent.appendChild(frame);
  place(node, frame, origin);
  var w = Math.max(node.w, 1);
  var h = Math.max(node.h, 1);
  frame.resize(w, h);
  frame.fills = [solid(WF.area)];
  setStroke(frame, WF.line, [1, 1, 1, 1]);
  frame.clipsContent = true;
  var cross = figma.createNodeFromSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      w +
      '" height="' +
      h +
      '"><path d="M0 0L' +
      w +
      ' ' +
      h +
      'M' +
      w +
      ' 0L0 ' +
      h +
      '" stroke="' +
      WF.cross +
      '" stroke-width="1" fill="none"/></svg>',
  );
  cross.name = 'X';
  frame.appendChild(cross);
  cross.x = 0;
  cross.y = 0;
  if (w >= 90 && h >= 36) {
    var text = figma.createText();
    text.fontName = env.labelFont;
    text.characters = label;
    text.fontSize = Math.min(14, Math.max(10, Math.round(h / 8)));
    text.fills = [solid(WF.ink)];
    frame.appendChild(text);
    text.x = (w - text.width) / 2;
    text.y = (h - text.height) / 2;
  }
  return frame;
}

function placeholderLabel(node, env) {
  if (env.screenId === 'intro' && /^canvas/.test(node.n)) {
    return 'Cena 3D: mesa de trabalho (o notebook e os objetos abrem os apps)';
  }
  for (var i = 0; i < PLACEHOLDERS.length; i += 1) {
    if (PLACEHOLDERS[i].pattern.test(node.n)) return PLACEHOLDERS[i].label;
  }
  return 'Imagem';
}

function buildImage(node, parent, origin, env) {
  if (STYLE === 'wireframe') {
    return buildPlaceholder(node, parent, origin, env, placeholderLabel(node, env));
  }
  var rect = figma.createRectangle();
  rect.name = node.n;
  parent.appendChild(rect);
  place(node, rect, origin);
  rect.resize(Math.max(node.w, 0.01), Math.max(node.h, 0.01));
  rect.fills = env.images[node.img]
    ? [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: env.images[node.img] }]
    : [];
  return rect;
}

function buildSvgImage(node, parent, origin, env) {
  // Ícones das skills e logos coloridos: no wireframe, uma caixa simples.
  if (STYLE === 'wireframe') {
    var box = figma.createFrame();
    box.name = node.n;
    parent.appendChild(box);
    place(node, box, origin);
    box.resize(Math.max(node.w, 1), Math.max(node.h, 1));
    box.fills = [solid(WF.soft)];
    box.cornerRadius = Math.min(node.w, node.h) * 0.22;
    setStroke(box, WF.line, [1, 1, 1, 1]);
    return box;
  }
  return buildSvg(env.svgs[node.img], node, parent, origin);
}

function build(node, parent, origin, env) {
  try {
    if (node.t === 'frame') return buildFrame(node, parent, origin, env);
    if (node.t === 'text') return buildText(node, parent, origin, env);
    if (node.t === 'svg') return buildSvg(node.svg, node, parent, origin);
    if (node.t === 'svgref') return buildSvgImage(node, parent, origin, env);
    if (node.t === 'image') return buildImage(node, parent, origin, env);
  } catch (error) {
    // Uma camada com problema não derruba a tela inteira.
    env.skipped += 1;
  }
  return null;
}

function pause() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });
}

function heading(text, x, y, env) {
  var title = figma.createText();
  title.fontName = env.titleFont;
  title.characters = text;
  title.fontSize = 72;
  title.fills = [solid(WF.ink)];
  figma.currentPage.appendChild(title);
  title.x = x;
  title.y = y;
  return title;
}

async function main() {
  figma.notify(
    STYLE === 'wireframe'
      ? 'Montando o wireframe do Portifólio…'
      : 'Montando o protótipo do Portifólio…',
    { timeout: 3000 },
  );

  // Fontes: resolve e carrega cada combinação usada antes de criar os textos.
  var resolve = await fontResolver();
  var titleFont = resolve({ family: 'Inter', weight: 700, italic: false, mono: false });
  var labelFont = resolve({ family: 'Inter', weight: 500, italic: false, mono: false });
  var needed = {};
  needed[titleFont.family + '|' + titleFont.style] = titleFont;
  needed[labelFont.family + '|' + labelFont.style] = labelFont;
  DATA.pages.forEach(function (group) {
    group.screens.forEach(function (screen) {
      eachNode(screen.children, function (node) {
        if (node.t === 'text') {
          var font = resolve(fontOf(node));
          needed[font.family + '|' + font.style] = font;
        }
      });
    });
  });
  await Promise.all(
    Object.keys(needed).map(function (key) {
      return figma.loadFontAsync(needed[key]);
    }),
  );

  // Imagens (PNG/JPEG) só na alta fidelidade; os SVGs ficam como texto para virar vetor.
  var images = {};
  var svgs = {};
  Object.keys(DATA.images).forEach(function (key) {
    var image = DATA.images[key];
    if (image.type === 'svg') svgs[key] = image.data;
    else if (STYLE === 'full') images[key] = figma.createImage(figma.base64Decode(image.data)).hash;
  });

  var env = {
    font: resolve,
    titleFont: titleFont,
    labelFont: labelFont,
    images: images,
    svgs: svgs,
    links: [],
    skipped: 0,
    screenArea: 1,
    screenId: '',
  };
  var page = figma.currentPage;
  var screens = {};
  var created = [];
  var flows = [];
  var total = 0;

  // Começa abaixo do que já existe na página, para não sobrepor nada.
  var y = 0;
  page.children.forEach(function (child) {
    if ('height' in child) y = Math.max(y, child.y + child.height + SECTION_GAP);
  });

  for (var g = 0; g < DATA.pages.length; g += 1) {
    var group = DATA.pages[g];
    created.push(heading(group.name === 'Mobile' ? 'Celular' : group.name, 0, y, env));
    y += 160;
    var columns = COLUMNS[group.name] || 4;
    var rowHeight = 0;
    for (var s = 0; s < group.screens.length; s += 1) {
      var screen = group.screens[s];
      var frame = figma.createFrame();
      frame.name = screen.name;
      page.appendChild(frame);
      frame.resize(screen.width, screen.height);
      frame.x = (s % columns) * (screen.width + GAP);
      frame.y = y + Math.floor(s / columns) * (screen.height + GAP);
      frame.fills =
        STYLE === 'wireframe'
          ? [solid(WF.paper)]
          : screen.background
            ? [solid(screen.background)]
            : [];
      if (STYLE === 'wireframe') setStroke(frame, WF.line, [1, 1, 1, 1]);
      frame.clipsContent = true;
      env.screenArea = screen.width * screen.height;
      env.screenId = screen.id;
      var origin = { x: 0, y: 0 };
      screen.children.forEach(function (child) {
        build(child, frame, origin, env);
      });
      screens[screen.id] = frame;
      if (s === 0) {
        flows.push({
          nodeId: frame.id,
          name: 'Portifólio · ' + (group.name === 'Mobile' ? 'celular' : 'desktop'),
        });
      }
      created.push(frame);
      total += 1;
      rowHeight = Math.max(rowHeight, frame.y + screen.height);
      figma.notify(screen.name, { timeout: 700 });
      await pause();
    }
    y = rowHeight + SECTION_GAP;
  }

  // Links do protótipo.
  var linked = 0;
  for (var i = 0; i < env.links.length; i += 1) {
    var link = env.links[i];
    var destination = screens[link.target];
    if (!destination) continue;
    try {
      await link.layer.setReactionsAsync([
        {
          trigger: { type: 'ON_CLICK' },
          actions: [
            {
              type: 'NODE',
              destinationId: destination.id,
              navigation: 'NAVIGATE',
              transition: TRANSITION,
              resetScrollPosition: true,
            },
          ],
        },
      ]);
      linked += 1;
    } catch (error) {
      env.skipped += 1;
    }
  }
  try {
    page.flowStartingPoints = page.flowStartingPoints.concat(flows);
  } catch (error) {
    // Sem fluxo inicial, o protótipo ainda abre pela tela selecionada.
  }

  figma.viewport.scrollAndZoomIntoView(created);
  figma.closePlugin(
    'Pronto: ' +
      total +
      ' telas e ' +
      linked +
      ' links no protótipo' +
      (env.skipped ? ' (' + env.skipped + ' camadas puladas).' : '.'),
  );
}

main().catch(function (error) {
  figma.closePlugin(
    'Erro ao montar o protótipo: ' + (error && error.message ? error.message : error),
  );
});
