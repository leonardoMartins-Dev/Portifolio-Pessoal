#!/usr/bin/env node
/**
 * Gera os prints do README (docs/screenshots/) e a imagem Open Graph
 * (public/brand/og.png, 1200×630) a partir do site rodando localmente.
 *
 *   npm run dev            # num terminal
 *   npm run screenshots    # em outro (BASE=http://localhost:5173 por padrão)
 *
 * Rode de novo depois de preencher o conteúdo real (foto, projetos…).
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const SHOTS = 'docs/screenshots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

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

// Intro 3D: notebook fechado, abrindo e a imagem Open Graph.
{
  const ctx = await context({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/pt`);
  await wait(page, 3500);
  await page.screenshot({ path: `${SHOTS}/intro.png` });
  await page.getByRole('button', { name: 'Clique para abrir o notebook' }).click();
  await wait(page, 2250);
  await page.screenshot({ path: `${SHOTS}/intro-boot.png` });
  await ctx.close();

  const og = await context({ viewport: { width: 1200, height: 630 } });
  const ogPage = await og.newPage();
  await ogPage.goto(`${BASE}/pt`);
  await wait(ogPage, 3500);
  await ogPage.getByRole('button', { name: 'Clique para abrir o notebook' }).click();
  // Sem os botões da intro na imagem de compartilhamento.
  await ogPage.addStyleTag({ content: 'button { visibility: hidden !important; }' });
  await wait(ogPage, 2450);
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
  const skip = page.getByRole('button', { name: 'Pular intro' });
  if (await skip.isVisible({ timeout: 5000 }).catch(() => false)) await skip.click();
  await wait(page, 1600);
  await page.screenshot({ path: `${SHOTS}/mobile-home.png` });
  await page.locator('[data-mobile-dock-app="projects"]').click();
  await wait(page, 1000);
  await page.screenshot({ path: `${SHOTS}/mobile-projects.png` });
  await ctx.close();
}

await browser.close();
console.log(`✓ Prints em ${SHOTS}/ e imagem OG em public/brand/og.png`);
