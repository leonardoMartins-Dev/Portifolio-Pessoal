#!/usr/bin/env node
/**
 * Gera os prints do README (docs/screenshots/) e a imagem Open Graph
 * (public/brand/og.png, 1200×630) a partir do site rodando localmente.
 *
 *   npm run dev            # num terminal
 *   npm run screenshots    # em outro (BASE=http://localhost:5173 por padrão)
 *
 * Por padrão o WebGL é por software (roda em qualquer máquina, mas a mesa 3D
 * fica lenta). Com GPU=1 usa a placa de vídeo — no macOS: GPU=1 npm run screenshots.
 *
 * Rode de novo depois de preencher o conteúdo real (foto, projetos…).
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const SHOTS = 'docs/screenshots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  args: process.env.GPU
    ? ['--ignore-gpu-blocklist', ...(process.platform === 'darwin' ? ['--use-angle=metal'] : [])]
    : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
// A mesa 3D demora a carregar no WebGL por software.
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

// Intro 3D: a mesa, o notebook abrindo, a tela de bloqueio e a imagem Open Graph.
{
  const ctx = await context({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/pt`);
  const hint = page.getByRole('button', { name: 'Clique no notebook para abrir' });
  await hint.waitFor({ timeout: SCENE_TIMEOUT });
  await wait(page, 600);
  await page.screenshot({ path: `${SHOTS}/intro.png` });
  await hint.click();
  await wait(page, 1900);
  await page.screenshot({ path: `${SHOTS}/intro-boot.png` });
  await page
    .getByRole('dialog', { name: 'Tela de bloqueio do Portifólio' })
    .waitFor({ timeout: SCENE_TIMEOUT });
  // Espera a notificação do assistente (se a IA estiver configurada) entrar.
  await wait(page, 1500);
  await page.screenshot({ path: `${SHOTS}/lock.png` });
  await ctx.close();

  // A mesma mesa de dia (tema claro).
  const day = await context({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await day.addInitScript(() =>
    localStorage.setItem(
      'portifolio:prefs',
      JSON.stringify({ state: { firstVisitDone: true, theme: 'light' }, version: 0 }),
    ),
  );
  const dayPage = await day.newPage();
  await dayPage.goto(`${BASE}/pt`);
  await dayPage
    .getByRole('button', { name: 'Clique no notebook para abrir' })
    .waitFor({ timeout: SCENE_TIMEOUT });
  await wait(dayPage, 600);
  await dayPage.screenshot({ path: `${SHOTS}/intro-light.png` });
  await day.close();

  // Open Graph: a mesa, sem os botões da intro.
  const og = await context({ viewport: { width: 1200, height: 630 } });
  const ogPage = await og.newPage();
  await ogPage.goto(`${BASE}/pt`);
  await ogPage
    .getByRole('button', { name: 'Clique no notebook para abrir' })
    .waitFor({ timeout: SCENE_TIMEOUT });
  await ogPage.addStyleTag({ content: 'button { visibility: hidden !important; }' });
  await wait(ogPage, 600);
  await ogPage.screenshot({ path: 'public/brand/og.png' });
  await og.close();
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
  await page.getByRole('button', { name: 'Pular intro' }).click({ timeout: SCENE_TIMEOUT });
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await wait(page, 1600);
  await page.screenshot({ path: `${SHOTS}/mobile-home.png` });
  await page.locator('[data-mobile-dock-app="projects"]').click();
  await wait(page, 1000);
  await page.screenshot({ path: `${SHOTS}/mobile-projects.png` });
  await ctx.close();
}

await browser.close();
console.log(`✓ Prints em ${SHOTS}/ e imagem OG em public/brand/og.png`);
