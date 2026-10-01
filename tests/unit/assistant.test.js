// @vitest-environment node
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { describe, expect, it } from 'vitest';
import { createAssistantResponse, generationSettings } from '../../server/assistant.js';

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
    expect(options.temperature).toBe(0.3);
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
  it('modelos de raciocínio não recebem temperature', () => {
    expect(generationSettings('gpt-6-luna')).toEqual({
      providerOptions: { openai: { reasoningEffort: 'none' } },
    });
    expect(generationSettings('gpt-5.4-mini')).toEqual({
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });
    expect(generationSettings('gpt-4.1-mini')).toEqual({ temperature: 0.3 });
  });
});
