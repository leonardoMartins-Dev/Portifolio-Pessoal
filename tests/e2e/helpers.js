import { expect } from '@playwright/test';

/** Entra no sistema pulando a intro (botão "Pular intro"), como um visitante. */
export async function skipIntro(page, locale = 'pt') {
  await page.goto(`/${locale}`);
  const skip = page.getByRole('button', { name: locale === 'pt' ? 'Pular intro' : 'Skip intro' });
  // Sem WebGL o sistema já vai direto para o boot; com WebGL, pulamos a intro.
  if (await skip.isVisible({ timeout: 5000 }).catch(() => false)) await skip.click();
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
