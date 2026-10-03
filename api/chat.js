import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAssistantResponse, DEFAULT_MODEL } from '../server/assistant.js';
import { parseChatRequest } from '../server/chat-request.js';
import { clientIp, json } from '../server/http.js';
import { checkRateLimit } from '../server/ratelimit.js';
import { assistantTools } from '../src/lib/ai/tools.js';

export const config = { maxDuration: 30 };

/** GET /api/chat → o assistente está disponível? (sem expor a chave) */
export function GET() {
  return json(
    { available: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) },
    { headers: { 'cache-control': 'no-store' } },
  );
}

/** POST /api/chat → resposta do assistente em streaming. */
export async function POST(request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return json({ error: 'unavailable' }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = await parseChatRequest(body, assistantTools);
  if (!parsed.ok) return json({ error: parsed.error }, { status: 400 });

  const limit = await checkRateLimit(clientIp(request));
  if (!limit.ok) {
    return json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfter) } },
    );
  }

  // Privacidade: o conteúdo das conversas não é armazenado nem logado por este servidor.
  try {
    const modelId = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const google = createGoogleGenerativeAI({ apiKey });
    return await createAssistantResponse({
      model: google(modelId),
      modelId,
      messages: parsed.messages,
      locale: parsed.locale,
      abortSignal: request.signal,
    });
  } catch {
    return json({ error: 'server_error' }, { status: 500 });
  }
}
