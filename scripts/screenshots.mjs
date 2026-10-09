#!/usr/bin/env node
/**
 * Gera os prints do README (docs/screenshots/), a imagem Open Graph
 * (public/brand/og.png, 1200×630) e o quarto estático que substitui o 3D em
 * aparelhos sem WebGL (public/images/room.webp), a partir do site rodando localmente.
 *
 *   npm run dev            # num terminal
 *   npm run screenshots    # em outro (BASE=http://localhost:5173 por padrão)
 *
 * Por padrão o WebGL é por software (roda em qualquer máquina, mas o quarto 3D
 * fica lento). Com GPU=1 usa a placa de vídeo — no macOS: GPU=1 npm run screenshots.
 *
 * Rode de novo depois de preencher o conteúdo real (foto, projetos…).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const SHOTS = 'docs/screenshots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  args: process.env.GPU
    ? ['--ignore-gpu-blocklist', ...(process.platform === 'darwin' ? ['--use-angle=metal'] : [])]
    : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
// O quarto 3D demora a carregar no WebGL por software.
const SCENE_TIMEOUT = 90_000;

async function context(options = {}) {
  const ctx = await browser.newContext({ colorScheme: 'dark', deviceScaleFactor: 1, ...options });
  await ctx.addInitScript(() =>
    localStorage.setItem(
      'portifolio:prefs',
      JSON.stringify({ state: { firstVisitDone: true, theme: 'dark' }, version: 0 }),
    ),
  );
  return ctx;
}

const wait = (page, ms) => page.waitForTimeout(ms);

/** Espera o quarto 3D aparecer e a câmera terminar de chegar. */
async function waitForRoom(page) {
  await page.locator('.landing canvas').first().waitFor({ timeout: SCENE_TIMEOUT });
  await page.waitForFunction(() => !document.querySelector('.landing [role="status"]'), null, {
    timeout: SCENE_TIMEOUT,
  });
  await wait(page, 2600);
}

/** Grava o tema antes de a página carregar (o tema vai como argumento: o script roda na página). */
function presetTheme(ctx, theme) {
  return ctx.addInitScript((value) => {
    localStorage.setItem(
      'portifolio:prefs',
      JSON.stringify({ state: { firstVisitDone: true, theme: value }, version: 0 }),
    );
  }, theme);
}

// Página inicial: o quarto (dia e noite), o holograma do Sobre, o zoom até a tela e a tela de bloqueio.
{
  const ctx = await context({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await presetTheme(ctx, 'light');
  const page = await ctx.newPage();
  await page.goto(`${BASE}/pt`);
  await waitForRoom(page);
  await page.screenshot({ path: `${SHOTS}/landing.png` });

  // O Sobre: espera o scanner terminar de "materializar" o boneco.
  await page.locator('#sobre').evaluate((element) => element.scrollIntoView());
  await wait(page, 4000);
  await page.screenshot({ path: `${SHOTS}/landing-about.png` });

  await page.locator('#skills').evaluate((element) => element.scrollIntoView());
  await wait(page, 2500);
  await page.screenshot({ path: `${SHOTS}/landing-skills.png` });

  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await wait(page, 1500);
  await page.screenshot({ path: `${SHOTS}/landing-zoom.png` });
  await page
    .getByRole('dialog', { name: 'Tela de bloqueio do Portifólio' })
    .waitFor({ timeout: SCENE_TIMEOUT });
  // Espera a notificação do assistente (se a IA estiver configurada) entrar.
  await wait(page, 1500);
  await page.screenshot({ path: `${SHOTS}/lock.png` });
  await ctx.close();

  // O mesmo quarto à noite (tema escuro).
  const night = await context({ viewport: { width: 1440, height: 900 } });
  const nightPage = await night.newPage();
  await nightPage.goto(`${BASE}/pt`);
  await waitForRoom(nightPage);
  await nightPage.screenshot({ path: `${SHOTS}/landing-dark.png` });
  await night.close();

  // Open Graph: o topo da página, sem os botões.
  const og = await context({ viewport: { width: 1200, height: 630 }, colorScheme: 'light' });
  await presetTheme(og, 'light');
  const ogPage = await og.newPage();
  await ogPage.goto(`${BASE}/pt`);
  await waitForRoom(ogPage);
  await ogPage.addStyleTag({
    content: 'header, button, .animate-bounce { visibility: hidden !important; }',
  });
  await wait(ogPage, 300);
  await ogPage.screenshot({ path: 'public/brand/og.png' });
  await og.close();

  // Quarto estático (fundo transparente) para aparelhos sem WebGL, em WebP.
  const still = await context({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await presetTheme(still, 'light');
  const stillPage = await still.newPage();
  await stillPage.goto(`${BASE}/pt`);
  await waitForRoom(stillPage);
  await stillPage.addStyleTag({
    content: `html, body, .landing { background: transparent !important; }
      header, button, h1, .animate-bounce, #hero-title + p, .landing section > div + div { visibility: hidden !important; }`,
  });
  await wait(stillPage, 300);
  const png = await stillPage.screenshot({
    omitBackground: true,
    clip: { x: 560, y: 150, width: 860, height: 720 },
  });
  const webp = await stillPage.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', 0.82).split(',')[1];
  }, png.toString('base64'));
  writeFileSync('public/images/room.webp', Buffer.from(webp, 'base64'));
  await still.close();
}

// Desktop: janelas, Terminal e assistente (resposta simulada).
{
  const ctx = await context({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/pt/projects`);
  await wait(page, 1200);
  await page.locator('[data-dock-app="about"]').click();
  await wait(page, 900);
  await page.screenshot({ path: `${SHOTS}/desktop.png` });

  await page.goto(`${BASE}/pt/terminal`);
  await wait(page, 1200);
  for (const command of ['neofetch', 'projetos']) {
    await page.keyboard.type(command);
    await page.keyboard.press('Enter');
  }
  await wait(page, 400);
  await page.screenshot({ path: `${SHOTS}/terminal.png` });

  await page.goto(`${BASE}/en/contact`);
  await wait(page, 1200);
  await page.screenshot({ path: `${SHOTS}/contact-en.png` });

  // GitHub ao vivo (dados reais do perfil) e a seção "Fora do código" do Sobre.
  await page.goto(`${BASE}/pt/github`);
  await page.getByRole('heading', { name: 'Programando em público' }).waitFor({ timeout: 20_000 });
  await wait(page, 600);
  await page.screenshot({ path: `${SHOTS}/github.png` });

  await page.goto(`${BASE}/pt/about`);
  await wait(page, 1200);
  await page
    .locator('[data-window="about"] .scroll-area')
    .evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await wait(page, 400);
  await page.screenshot({ path: `${SHOTS}/about-hobbies.png` });
  await ctx.close();
}

// Tema claro.
{
  const ctx = await context({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await ctx.addInitScript(() =>
    localStorage.setItem(
      'portifolio:prefs',
      JSON.stringify({ state: { firstVisitDone: true, theme: 'light' }, version: 0 }),
    ),
  );
  const page = await ctx.newPage();
  await page.goto(`${BASE}/pt/settings`);
  await wait(page, 1200);
  await page.screenshot({ path: `${SHOTS}/desktop-light.png` });
  await ctx.close();
}

// Celular.
{
  const ctx = await context({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/pt`);
  await waitForRoom(page);
  await page.screenshot({ path: `${SHOTS}/mobile-landing.png` });
  await page.getByRole('button', { name: /Toque no PC/ }).click();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click({ timeout: SCENE_TIMEOUT });
  await wait(page, 1600);
  await page.screenshot({ path: `${SHOTS}/mobile-home.png` });
  await page.locator('[data-mobile-dock-app="projects"]').click();
  await wait(page, 1000);
  await page.screenshot({ path: `${SHOTS}/mobile-projects.png` });
  await ctx.close();
}

await browser.close();
console.log(
  `✓ Prints em ${SHOTS}/, imagem OG em public/brand/og.png e quarto estático em public/images/room.webp`,
);
