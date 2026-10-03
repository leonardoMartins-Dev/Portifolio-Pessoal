import { expect } from '@playwright/test';

function lockScreen(page, locale) {
  return page.getByRole('dialog', {
    name: locale === 'pt' ? 'Tela de bloqueio do Portifólio' : 'Portifólio lock screen',
  });
}

/** Chega à tela de bloqueio pulando a intro (botão "Pular intro"), como um visitante. */
export async function skipToLockScreen(page, locale = 'pt') {
  await page.goto(`/${locale}`);
  const skip = page.getByRole('button', { name: locale === 'pt' ? 'Pular intro' : 'Skip intro' });
  const lock = lockScreen(page, locale);
  // Com WebGL a intro roda e é pulada; sem WebGL o sistema já abre na tela de bloqueio.
  await expect(skip.or(lock).first()).toBeVisible();
  if (await skip.isVisible()) await skip.click();
  await expect(lock).toBeVisible();
  return lock;
}

/** Sai da tela de bloqueio pelo botão "Entrar". */
export async function unlock(page, locale = 'pt') {
  const lock = lockScreen(page, locale);
  await lock
    .getByRole('button', { name: locale === 'pt' ? 'Entrar' : 'Enter', exact: true })
    .click();
  await expect(lock).toBeHidden();
}

/** Entra no sistema como um visitante novo: pula a intro e passa pela tela de bloqueio. */
export async function skipIntro(page, locale = 'pt') {
  await skipToLockScreen(page, locale);
  await unlock(page, locale);
}

/**
 * Entra como quem já passou pela intro nesta sessão (recarregou a página):
 * boot curto, sem a mesa 3D nem a tela de bloqueio. A mesa 3D é pesada no
 * WebGL por software dos testes, então só os testes da intro passam por ela.
 */
export async function enterSystem(page, locale = 'pt') {
  await page.addInitScript(() => sessionStorage.setItem('portifolio:intro-seen', '1'));
  await page.goto(`/${locale}`);
}

/** Marca a primeira visita como feita (o app Sobre não abre sozinho). */
export async function markVisited(page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'portifolio:prefs',
      JSON.stringify({ state: { firstVisitDone: true }, version: 0 }),
    );
  });
}

/** Resposta simulada do /api/chat no protocolo de stream de mensagens do AI SDK. */
export function mockAssistant(page, { text, tool } = {}) {
  return page.route('**/api/chat', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: { available: true } });
    }
    const chunks = [
      { type: 'start', messageId: 'msg-1' },
      { type: 'start-step' },
      ...(tool
        ? [
            { type: 'tool-input-start', toolCallId: 'call-1', toolName: tool.name },
            {
              type: 'tool-input-available',
              toolCallId: 'call-1',
              toolName: tool.name,
              input: tool.input,
            },
          ]
        : []),
      { type: 'text-start', id: 'text-1' },
      { type: 'text-delta', id: 'text-1', delta: text ?? 'Olá!' },
      { type: 'text-end', id: 'text-1' },
      { type: 'finish-step' },
      { type: 'finish' },
    ];
    const body = `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('')}data: [DONE]\n\n`;
    return route.fulfill({
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        'x-vercel-ai-ui-message-stream': 'v1',
      },
      body,
    });
  });
}

export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}
