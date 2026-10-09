import { expect } from '@playwright/test';

function lockScreen(page, locale) {
  return page.getByRole('dialog', {
    name: locale === 'pt' ? 'Tela de bloqueio do Portifólio' : 'Portifólio lock screen',
  });
}

/** O botão flutuante da página inicial ("Clique no PC"; no celular, "Toque no PC"). */
export function enterButton(page, locale = 'pt') {
  return page.getByRole('button', {
    name: locale === 'pt' ? /(Clique|Toque) no PC/ : /(Click|Tap) the PC/,
  });
}

/**
 * Chega à tela de bloqueio pela página inicial, como um visitante: o botão
 * "Clique no PC" leva a câmera até a tela (ou entra direto, se o 3D ainda não
 * carregou, se não houver WebGL ou com movimento reduzido).
 */
export async function skipToLockScreen(page, locale = 'pt') {
  await page.goto(`/${locale}`);
  await enterButton(page, locale).click();
  const lock = lockScreen(page, locale);
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

/** Entra no sistema como um visitante novo: passa pela página inicial e pela tela de bloqueio. */
export async function skipIntro(page, locale = 'pt') {
  await skipToLockScreen(page, locale);
  await unlock(page, locale);
}

/**
 * Entra como quem já passou pela página inicial nesta sessão (recarregou):
 * boot curto, sem o quarto 3D nem a tela de bloqueio. O 3D é pesado no
 * WebGL por software dos testes, então só os testes da página inicial passam por ela.
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
