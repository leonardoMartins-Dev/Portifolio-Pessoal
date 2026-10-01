import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from 'ai';
import { buildSystemPrompt } from '../src/lib/ai/system-prompt.js';
import { assistantTools } from '../src/lib/ai/tools.js';

/** Modelo barato atual da OpenAI (out/2026). Troque com OPENAI_MODEL. */
export const DEFAULT_MODEL = 'gpt-6-luna';

/**
 * Modelos de raciocínio (o*, gpt-5+) não aceitam temperature e gastam tokens
 * de saída "pensando" — com limite de 500, pedimos o mínimo de raciocínio.
 */
export function generationSettings(modelId) {
  const reasoning = /^(o\d|gpt-([5-9]|\d{2}))/.test(modelId) && !modelId.includes('chat');
  if (!reasoning) return { temperature: 0.3 };
  const effort = /^gpt-6(\.\d+)?-(luna|sol)$/.test(modelId) ? 'none' : 'low';
  return { providerOptions: { openai: { reasoningEffort: effort } } };
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
