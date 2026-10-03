import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from 'ai';
import { buildSystemPrompt } from '../src/lib/ai/system-prompt.js';
import { assistantTools } from '../src/lib/ai/tools.js';

/**
 * Gemini Flash-Lite: tem plano gratuito no Google AI Studio (out/2026), aceita
 * ferramentas e responde rápido. Troque com GEMINI_MODEL.
 */
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

/**
 * Os Gemini "pensam" antes de responder, e esses tokens contam no limite de
 * 500 de saída — então pedimos o mínimo de raciocínio que cada modelo aceita:
 * - Gemini 2.5: orçamento 0 (desliga);
 * - Flash-Lite e Flash 3.5/3.6: nível `minimal`;
 * - os demais (Flash 3.7+, Pro): `low`, o menor que aceitam.
 * Nos Gemini 3+ a temperatura fica no padrão (1.0), como o Google recomenda.
 */
export function generationSettings(modelId) {
  if (/^gemini-2\./.test(modelId)) {
    return {
      temperature: 0.3,
      providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
    };
  }
  const minimal = /-lite\b/.test(modelId) || /^gemini-3\.[56]-flash\b/.test(modelId);
  return {
    providerOptions: { google: { thinkingConfig: { thinkingLevel: minimal ? 'minimal' : 'low' } } },
  };
}

/**
 * Gera a resposta do assistente em streaming (§11.3): prompt gerado do
 * conteúdo, ferramentas sem `execute` (rodam no navegador) e até 500 tokens.
 */
export async function createAssistantResponse({ model, modelId, messages, locale, abortSignal }) {
  const result = streamText({
    model,
    instructions: buildSystemPrompt({ locale }),
    messages: await convertToModelMessages(messages, { tools: assistantTools }),
    tools: assistantTools,
    maxOutputTokens: 500,
    ...generationSettings(modelId ?? ''),
    abortSignal,
  });
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, onError: () => 'error' }),
  });
}
