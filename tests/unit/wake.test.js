import { afterEach, describe, expect, it, vi } from 'vitest';
import { projects } from '../../src/content/projects.js';
import { wakeServer } from '../../src/lib/wake.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('acordar a demo', () => {
  it('chama a URL em segundo plano, sem CORS, no máximo uma vez a cada 10 min', () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null)));
    vi.stubGlobal('fetch', fetchMock);
    const url = 'https://demo.example.com/teste-intervalo';

    expect(wakeServer(url, 0)).toBe(true);
    expect(wakeServer(url, 9 * 60 * 1000)).toBe(false);
    expect(wakeServer(url, 10 * 60 * 1000)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ mode: 'no-cors' }));
  });

  it('ignora projeto sem URL e não deixa erro de rede escapar', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    vi.stubGlobal('fetch', fetchMock);
    expect(wakeServer(undefined)).toBe(false);
    expect(wakeServer('https://demo.example.com/fora-do-ar')).toBe(true);
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('o WaveHub (Render, plano gratuito) tem URL para acordar', () => {
    const wavehub = projects.find((project) => project.id === 'wavehub');
    expect(wavehub.wakeUrl).toMatch(/^https:\/\/.+\.onrender\.com\//);
  });
});
