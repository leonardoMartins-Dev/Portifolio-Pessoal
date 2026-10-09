import { expect, test } from '@playwright/test';
import {
  enterSystem,
  markVisited,
  mockAssistant,
  skipIntro,
  skipToLockScreen,
  unlock,
} from './helpers.js';

const DOCK_APPS = [
  'about',
  'projects',
  'experience',
  'skills',
  'certificates',
  'resume',
  'contact',
  'music',
  'activity',
  'github',
  'assistant',
  'terminal',
  'settings',
];

test('pula a intro e mostra o sistema com o app Sobre na primeira visita', async ({ page }) => {
  // A mesa 3D roda no WebGL por software nos testes: bem mais lenta que numa GPU.
  test.slow();
  await skipIntro(page);
  await expect(page.getByRole('banner', { name: 'Barra de menu' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Dock de apps' })).toBeVisible();
  await expect(page.locator('[data-window="about"]')).toBeVisible();
  await expect(page).toHaveURL(/\/pt\/about$/);
  await expect(page.getByText('Bem-vindo ao Portifólio')).toBeVisible();
});

test('tela de bloqueio: qualquer tecla entra; "Bloquear" no menu mantém as janelas', async ({
  page,
}) => {
  await markVisited(page);
  // Primeira visita sem a mesa 3D (movimento reduzido): abre direto na tela de bloqueio.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const lock = await skipToLockScreen(page);
  await expect(lock.getByText('Leonardo Martins Macedo')).toBeVisible();
  // O foco em "Entrar" indica que a tela já está ouvindo o teclado.
  await expect(lock.getByRole('button', { name: 'Entrar', exact: true })).toBeFocused();
  await page.keyboard.press('a');
  await expect(lock).toBeHidden();

  await page.locator('[data-dock-app="skills"]').click();
  const window = page.locator('[data-window="skills"]');
  await expect(window).toBeVisible();

  await page.getByRole('button', { name: 'Menu do sistema' }).click();
  await page.getByRole('menuitem', { name: 'Bloquear' }).click();
  await expect(lock).toBeVisible();
  await unlock(page);
  await expect(window).toBeVisible();
  await expect(window).toBeFocused();
});

test('abre cada app pelo dock e a URL acompanha', async ({ page }) => {
  await markVisited(page);
  await enterSystem(page);
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
  await enterSystem(page);
  await expect(page.getByRole('navigation', { name: 'Dock de apps' })).toBeVisible();
  await page.keyboard.press('Control+k');
  const launcher = page.getByRole('dialog', { name: 'Assistente' });
  await expect(launcher).toBeVisible();
  await launcher.getByRole('button', { name: 'Quais são seus principais projetos?' }).click();
  await expect(launcher.getByText('Aqui estão os projetos do Leonardo.')).toBeVisible();
  await expect(page.locator('[data-window="projects"]')).toBeVisible();
  await expect(launcher.getByText('Abrindo Projetos')).toBeVisible();
});

test('abrir Projetos acorda o servidor da demo do WaveHub', async ({ page }) => {
  const pings = [];
  await page.route('https://wavehub-fhec.onrender.com/**', (route) => {
    pings.push(route.request().url());
    return route.fulfill({ status: 200, body: '' });
  });
  await markVisited(page);
  await enterSystem(page);
  await expect(page.getByRole('navigation', { name: 'Dock de apps' })).toBeVisible();
  expect(pings).toEqual([]);
  await page.locator('[data-dock-app="projects"]').click();
  await expect(page.locator('[data-window="projects"]')).toBeVisible();
  await expect.poll(() => pings).toEqual(['https://wavehub-fhec.onrender.com/login']);
});

test('GitHub (Stats) (API simulada): números, gráfico, abas, repositórios e commits', async ({
  page,
}) => {
  // Um ano de dias, com contribuições só no último mês.
  const days = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(Date.UTC(2025, 9, 4) + index * 86_400_000).toISOString().slice(0, 10);
    const count = index > 335 && index % 3 === 0 ? 5 : 0;
    return { date, count, level: count ? 3 : 0 };
  });
  await page.route('**/api/github', (route) =>
    route.fulfill({
      json: {
        status: 'ok',
        login: 'leonardoMartins-Dev',
        profileUrl: 'https://github.com/leonardoMartins-Dev',
        repoCount: 12,
        repos: [
          {
            name: 'WaveHub',
            description: 'Rádios ao vivo do mundo inteiro',
            language: { name: 'Java', color: '#b07219' },
            stars: 1,
            url: 'https://github.com/leonardoMartins-Dev/WaveHub',
            pushedAt: '2026-09-29T17:13:10Z',
          },
        ],
        commits: [
          {
            sha: 'abc1234',
            message: 'feat: player único no rodapé',
            repo: 'WaveHub',
            url: 'https://github.com/leonardoMartins-Dev/WaveHub/commit/abc1234',
            date: '2026-09-29T17:13:10Z',
          },
        ],
        calendar: { total: days.reduce((sum, day) => sum + day.count, 0), days },
        stars: 3,
        forks: 0,
        pullRequests: 9,
        issues: 0,
        commitsLastYear: 114,
        languages: {
          unit: 'repos',
          total: 2,
          repos: 2,
          items: [{ name: 'Java', color: '#b07219', value: 2, percent: 100 }],
        },
      },
    }),
  );
  await page.goto('/pt/github');
  const window = page.locator('[data-window="github"]');
  await expect(window.getByRole('heading', { name: 'Programando em público' })).toBeVisible();
  await expect(window.getByRole('img', { name: /^Gráfico de contribuições: 50 no/ })).toBeVisible();
  await expect(window.getByText('Pull requests', { exact: true })).toBeVisible();
  await window.getByRole('radio', { name: 'Linguagens' }).click();
  await expect(window.getByText('Pela linguagem principal de 2 repositórios.')).toBeVisible();
  await window.getByRole('radio', { name: 'Repositórios' }).click();
  await expect(window.getByRole('link', { name: /^WaveHub/ })).toHaveAttribute(
    'href',
    'https://github.com/leonardoMartins-Dev/WaveHub',
  );
  await expect(window.getByText('feat: player único no rodapé')).toBeVisible();
  await expect(window.getByRole('link', { name: /Ver perfil no GitHub/ })).toBeVisible();
});

test('Skills: troca para o globo 3D e volta para a lista', async ({ page }) => {
  await page.goto('/pt/skills');
  const window = page.locator('[data-window="skills"]');
  await expect(window.getByText('Vite', { exact: true })).toBeVisible();
  await window.getByRole('radio', { name: 'Globo' }).click();
  await expect(window.getByText('Arraste para girar o globo')).toBeVisible();
  await expect(window.locator('canvas')).toBeVisible();
  await window.getByRole('radio', { name: 'Lista' }).click();
  await expect(window.getByText('Vite', { exact: true })).toBeVisible();
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
  await enterSystem(page);
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
