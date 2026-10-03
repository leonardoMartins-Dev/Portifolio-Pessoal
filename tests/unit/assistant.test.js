// @vitest-environment node
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { describe, expect, it } from 'vitest';
import {
  createAssistantResponse,
  DEFAULT_MODEL,
  generationSettings,
} from '../../server/assistant.js';
import { parseChatRequest } from '../../server/chat-request.js';
import { assistantTools } from '../../src/lib/ai/tools.js';

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

/** Modelo simulado que chama openApp e responde com texto. */
function mockModel(calls) {
  return new MockLanguageModelV4({
    doStream: async (options) => {
      calls.push(options);
      return {
        stream: simulateReadableStream({
          chunks: [
            {
              type: 'tool-call',
              toolCallId: 'call-1',
              toolName: 'openApp',
              input: JSON.stringify({ appId: 'projects' }),
            },
            { type: 'text-start', id: 'text-1' },
            { type: 'text-delta', id: 'text-1', delta: 'Abri o app Projetos.' },
            { type: 'text-end', id: 'text-1' },
            { type: 'finish', finishReason: { unified: 'tool-calls', raw: undefined }, usage },
          ],
        }),
      };
    },
  });
}

describe('resposta do assistente (modelo simulado)', () => {
  it('envia prompt e ferramentas ao modelo e devolve o stream de UI com a chamada da ferramenta', async () => {
    const calls = [];
    const response = await createAssistantResponse({
      model: mockModel(calls),
      modelId: 'mock',
      locale: 'pt',
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Quais projetos?' }] }],
    });

    expect(response.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1');
    const body = await response.text();
    expect(body).toContain('"type":"tool-input-available"');
    expect(body).toContain('"toolName":"openApp"');
    expect(body).toContain('Abri o app Projetos.');
    // Ferramenta sem execute: o servidor não produz resultado; quem executa é o navegador.
    expect(body).not.toContain('"type":"tool-output-available"');

    const [options] = calls;
    expect(options.maxOutputTokens).toBe(500);
    expect(options.tools.map((tool) => tool.name).sort()).toEqual(
      ['openApp', 'setLanguage', 'setTheme', 'showProject'].sort(),
    );
    const system = options.prompt.find((message) => message.role === 'system');
    expect(system.content).toContain('Você é o assistente do Portifólio');
  });

  it('aceita a continuação depois que a ferramenta rodou no cliente', async () => {
    const calls = [];
    const response = await createAssistantResponse({
      model: mockModel(calls),
      modelId: 'mock',
      locale: 'pt',
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Abra os projetos' }] },
        {
          id: '2',
          role: 'assistant',
          parts: [
            { type: 'step-start' },
            {
              type: 'tool-openApp',
              toolCallId: 'call-0',
              state: 'output-available',
              input: { appId: 'projects' },
              output: { ok: true },
            },
          ],
        },
      ],
    });
    expect(response.status).toBe(200);
    await response.text(); // o modelo só é chamado quando o stream é lido
    expect(calls[0].prompt.some((message) => message.role === 'tool')).toBe(true);
  });
});

describe('configuração de geração por modelo', () => {
  it('pede o mínimo de raciocínio que cada Gemini aceita', () => {
    const level = (id) => generationSettings(id).providerOptions.google.thinkingConfig;
    expect(level('gemini-3.5-flash-lite')).toEqual({ thinkingLevel: 'minimal' });
    expect(level('gemini-3.5-flash')).toEqual({ thinkingLevel: 'minimal' });
    // Flash 3.7+ não aceita `minimal`.
    expect(level('gemini-3.8-flash')).toEqual({ thinkingLevel: 'low' });
    expect(level('gemini-2.5-flash')).toEqual({ thinkingBudget: 0 });
  });

  it('nos Gemini 3+ deixa a temperatura no padrão', () => {
    expect(generationSettings('gemini-3.5-flash-lite').temperature).toBeUndefined();
    expect(generationSettings('gemini-2.5-flash').temperature).toBe(0.3);
  });
});

describe('integração com o Gemini (fetch simulado)', () => {
  const sse = (chunk) => `data: ${JSON.stringify(chunk)}\r\n\r\n`;

  function geminiWith(requests) {
    return createGoogleGenerativeAI({
      apiKey: 'test',
      fetch: async (url, init) => {
        requests.push({ url: String(url), body: JSON.parse(init.body) });
        const reply = {
          candidates: [
            { content: { role: 'model', parts: [{ text: 'Pronto.' }] }, finishReason: 'STOP' },
          ],
        };
        return new Response(sse(reply), { headers: { 'content-type': 'text/event-stream' } });
      },
    });
  }

  it('manda o prompt, as ferramentas e o raciocínio mínimo para o modelo padrão', async () => {
    const requests = [];
    const response = await createAssistantResponse({
      model: geminiWith(requests)(DEFAULT_MODEL),
      modelId: DEFAULT_MODEL,
      locale: 'pt',
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Oi' }] }],
    });
    await response.text();
    const [{ url, body }] = requests;
    expect(url).toContain(`/models/${DEFAULT_MODEL}:streamGenerateContent`);
    expect(body.systemInstruction).toBeDefined();
    expect(body.generationConfig).toMatchObject({
      maxOutputTokens: 500,
      thinkingConfig: { thinkingLevel: 'minimal' },
    });
    expect(body.tools[0].functionDeclarations.map((tool) => tool.name)).toEqual(
      Object.keys(assistantTools),
    );
  });

  it('devolve ao Gemini a assinatura da chamada de ferramenta feita no navegador', async () => {
    // O Gemini 3 recusa (HTTP 400) a chamada repetida sem a thoughtSignature.
    const requests = [];
    const parsed = await parseChatRequest(
      {
        messages: [
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'Mostre os projetos' }] },
          {
            id: '2',
            role: 'assistant',
            parts: [
              {
                type: 'tool-openApp',
                toolCallId: 'call-1',
                state: 'output-available',
                input: { appId: 'projects' },
                output: { ok: true },
                callProviderMetadata: { google: { thoughtSignature: 'assinatura' } },
              },
            ],
          },
        ],
      },
      assistantTools,
    );
    const response = await createAssistantResponse({
      model: geminiWith(requests)(DEFAULT_MODEL),
      modelId: DEFAULT_MODEL,
      locale: 'pt',
      messages: parsed.messages,
    });
    await response.text();
    const modelTurn = requests[0].body.contents.find((content) => content.role === 'model');
    expect(modelTurn.parts[0]).toMatchObject({
      functionCall: { name: 'openApp' },
      thoughtSignature: 'assinatura',
    });
  });
});
