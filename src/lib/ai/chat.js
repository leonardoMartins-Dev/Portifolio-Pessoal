import { Chat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { currentLocale } from '../os-bridge.js';
import { runClientTool } from './client-tools.js';

const MAX_TOOL_ROUNDS = 2;

/**
 * Reenvia automaticamente depois que as ferramentas rodam no cliente, para o
 * modelo concluir a resposta — mas só se ele ainda não escreveu texto e no
 * máximo MAX_TOOL_ROUNDS vezes (evita laços).
 */
function shouldContinue({ messages }) {
  if (!lastAssistantMessageIsCompleteWithToolCalls({ messages })) return false;
  const last = messages.at(-1);
  const hasText = last.parts.some((part) => part.type === 'text' && part.text.trim());
  const rounds = last.parts.filter((part) => part.type === 'step-start').length;
  return !hasText && rounds <= MAX_TOOL_ROUNDS;
}

/**
 * Conversa única, compartilhada entre o app Assistente, o lançador (Ctrl/⌘K)
 * e o comando `ask` do Terminal.
 */
export const assistantChat = new Chat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({ locale: currentLocale() }),
  }),
  sendAutomaticallyWhen: shouldContinue,
  onToolCall({ toolCall }) {
    if (toolCall.dynamic) return;
    const output = runClientTool(toolCall.toolName, toolCall.input);
    // Sem await: evita travar o fluxo do useChat.
    assistantChat.addToolOutput({
      tool: toolCall.toolName,
      toolCallId: toolCall.toolCallId,
      output,
    });
  },
});

let availability = null;

/** O servidor tem a chave da OpenAI? (GET /api/chat; resultado em cache) */
export function fetchAssistantAvailability() {
  availability ??= fetch('/api/chat', { headers: { accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : { available: false }))
    .then((data) => Boolean(data.available))
    .catch(() => false);
  return availability;
}

/** Traduz um erro do transporte num código: rate_limited, unavailable, too_long ou error. */
export function chatErrorCode(error) {
  if (!error) return null;
  const status = error.statusCode;
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'unavailable';
  try {
    const body = JSON.parse(error.responseBody ?? error.message);
    if (body?.error === 'too_long') return 'too_long';
  } catch {
    // Corpo não-JSON: erro genérico.
  }
  return 'error';
}
