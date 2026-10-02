import { expect, test } from '@playwright/test';
import { markVisited, mockAssistant, skipIntro } from './helpers.js';

const DOCK_APPS = [
  'about',
  'projects',
  'experience',
  'skills',
  'resume',
  'contact',
  'music',
  'activity',
  'assistant',
  'terminal',
  'settings',
];

test('pula a intro e mostra o sistema com o app Sobre na primeira visita', async ({ page }) => {
  await skipIntro(page);
  await expect(page.getByRole('banner', { name: 'Barra de menu' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Dock de apps' })).toBeVisible();
  await expect(page.locator('[data-window="about"]')).toBeVisible();
  await expect(page).toHaveURL(/\/pt\/about$/);
  await expect(page.getByText('Bem-vindo ao Portifólio')).toBeVisible();
});

test('abre cada app pelo dock e a URL acompanha', async ({ page }) => {
  await markVisited(page);
  await skipIntro(page);
  for (const appId of DOCK_APPS) {
    await page.locator(`[data-dock-app="${appId}"]`).click();
    const window = page.locator(`[data-window="${appId}"]`);
    await expect(window).toBeVisible();
    await expect(window).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`/pt/${appId}$`));
  }
});

test('troca o idioma mantendo o app aberto', async ({ page }) => {
  await page.goto('/pt/projects');
  await expect(page.getByRole('heading', { name: 'Linha do tempo' })).toBeVisible();
  await page.getByRole('button', { name: 'Mudar o idioma para inglês' }).click();
  await expect(page).toHaveURL(/\/en\/projects$/);
  await expect(page.getByRole('heading', { name: 'Timeline' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
});

test('deep link pula a intro e abre o app em foco; 404 no estilo do sistema', async ({ page }) => {
  await page.goto('/en/experience');
  await expect(page.locator('[data-window="experience"]')).toBeVisible();
  await expect(page).toHaveTitle(/Experience/);

  await page.goto('/pt/nao-existe');
  await expect(page.getByRole('alertdialog', { name: 'App não encontrado' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar à área de trabalho' }).click();
  await expect(page).toHaveURL(/\/pt$/);
});

test('janelas: minimizar, restaurar pelo dock, maximizar e fechar com Esc', async ({ page }) => {
  await page.goto('/pt/skills');
  const window = page.locator('[data-window="skills"]');
  await expect(window).toBeVisible();

  await window.getByRole('button', { name: 'Minimizar' }).click();
  await expect(window).toBeHidden();
  await page.locator('[data-dock-app="skills"]').click();
  await expect(window).toBeVisible();

  await window.getByRole('button', { name: 'Maximizar' }).click();
  await expect(window.getByRole('button', { name: 'Restaurar' })).toBeVisible();

  await window.focus();
  await page.keyboard.press('Escape');
  await expect(window).toBeHidden();
  await expect(page).toHaveURL(/\/pt$/);
});

test('formulário de contato mostra os erros de validação', async ({ page }) => {
  await page.goto('/pt/contact');
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(page.getByText('Informe seu nome (mínimo de 2 caracteres).')).toBeVisible();
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
  await expect(page.getByText('A mensagem precisa de pelo menos 10 caracteres.')).toBeVisible();
});

test('assistente (API simulada) responde e abre o app pedido', async ({ page }) => {
  await mockAssistant(page, {
    text: 'Aqui estão os projetos do Leonardo.',
    tool: { name: 'openApp', input: { appId: 'projects' } },
  });
  await markVisited(page);
  await skipIntro(page);
  await page.keyboard.press('Control+k');
  const launcher = page.getByRole('dialog', { name: 'Assistente' });
  await expect(launcher).toBeVisible();
  await launcher.getByRole('button', { name: 'Quais são seus principais projetos?' }).click();
  await expect(launcher.getByText('Aqui estão os projetos do Leonardo.')).toBeVisible();
  await expect(page.locator('[data-window="projects"]')).toBeVisible();
  await expect(launcher.getByText('Abrindo Projetos')).toBeVisible();
});

test('Terminal executa comandos e abre apps', async ({ page }) => {
  await page.goto('/pt/terminal');
  const input = page.getByLabel('Comando do terminal');
  await input.fill('whoami');
  await input.press('Enter');
  await expect(page.getByText(/Leonardo Martins Macedo — Estudante/)).toBeVisible();
  await input.fill('open contato');
  await input.press('Enter');
  await expect(page.locator('[data-window="contact"]')).toBeVisible();
});

test('ícones da área de trabalho: apps à esquerda abrem com clique duplo ou Enter', async ({
  page,
}) => {
  await markVisited(page);
  await skipIntro(page);
  const apps = page.getByRole('navigation', { name: 'Apps da área de trabalho' });
  await expect(apps.getByRole('button')).toHaveCount(DOCK_APPS.length);
  await page.locator('[data-desktop-app="experience"]').dblclick();
  await expect(page.locator('[data-window="experience"]')).toBeVisible();
  await page.locator('[data-desktop-app="resume"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-window="resume"]')).toBeVisible();
  const links = page.getByRole('navigation', { name: 'Links' });
  await expect(links.getByRole('button', { name: 'GitHub' })).toBeVisible();
  await expect(links.getByRole('button', { name: 'LinkedIn' })).toBeVisible();
});
