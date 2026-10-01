import { safeValidateUIMessages } from 'ai';
import { z } from 'zod';
import { LOCALES } from '../src/i18n/locales.js';

export const MAX_USER_CHARS = 500;
export const MAX_MESSAGES = 10;

const bodySchema = z
  .object({
    messages: z.array(z.unknown()).min(1).max(200),
    locale: z.enum(LOCALES).optional(),
  })
  .loose();

function userText(message) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/**
 * Valida o corpo enviado pelo useChat (§11.3):
 * - só as últimas 10 mensagens vão para o modelo;
 * - mensagens do visitante: só texto, no máximo 500 caracteres;
 * - nada de mensagens de sistema vindas do cliente.
 */
export async function parseChatRequest(body, tools) {
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) return { ok: false, error: 'invalid_request' };

  const recent = parsedBody.data.messages.slice(-MAX_MESSAGES);
  const validation = await safeValidateUIMessages({ messages: recent, tools });
  if (!validation.success) return { ok: false, error: 'invalid_request' };

  const messages = [...validation.data];
  for (const message of messages) {
    if (message.role === 'system') return { ok: false, error: 'invalid_request' };
    if (message.role === 'user') {
      if (message.parts.some((part) => part.type !== 'text')) {
        return { ok: false, error: 'invalid_request' };
      }
      if (userText(message).length > MAX_USER_CHARS) return { ok: false, error: 'too_long' };
    }
  }

  // O recorte pode começar numa resposta do assistente: a conversa começa no visitante.
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length) return { ok: false, error: 'invalid_request' };

  return { ok: true, messages, locale: parsedBody.data.locale ?? 'pt' };
}
