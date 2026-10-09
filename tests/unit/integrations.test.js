import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryLimiter } from '../../server/ratelimit.js';
import { getSpotifySummary, normalizeTrack } from '../../server/spotify.js';
import { getWakatimeStats, normalizeWakatime } from '../../server/wakatime.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('WakaTime', () => {
  const activity = {
    data: [
      { grand_total: { total_seconds: 3600 }, range: { date: '2026-09-25' } },
      { grand_total: { total_seconds: 7200.4 }, range: { date: '2026-09-24' } },
      { grand_total: { total_seconds: 0 }, range: { date: '2026-09-26' } },
    ],
  };
  const languages = {
    data: [
      { name: 'TypeScript', percent: 25, color: '#3178c6' },
      { name: 'JavaScript', percent: 75, color: '#f1e05a' },
      { name: 'Other', percent: 0 },
    ],
  };

  it('normaliza os dois JSONs embutíveis: totais de todo o período', () => {
    const stats = normalizeWakatime(activity, languages);
    expect(stats.totalSeconds).toBe(10800);
    // A média conta só os dias com código (o dia zerado fica de fora).
    expect(stats.dailyAverageSeconds).toBe(5400);
    expect(stats.activeDays).toBe(2);
    expect(stats.since).toBe('2026-09-24');
    expect(stats.bestDay).toEqual({ date: '2026-09-24', seconds: 7200 });
    expect(stats).not.toHaveProperty('days');
    expect(stats.languages.map((l) => l.name)).toEqual(['JavaScript', 'TypeScript']);
    expect(stats.languages[0].seconds).toBe(8100);
  });

  it('aguenta JSON vazio ou inesperado', () => {
    expect(normalizeWakatime({}, null)).toEqual({
      totalSeconds: 0,
      dailyAverageSeconds: 0,
      activeDays: 0,
      since: null,
      bestDay: null,
      languages: [],
    });
  });

  it('sem variáveis configuradas responde "unconfigured"', async () => {
    vi.stubEnv('WAKATIME_LANGUAGES_URL', '');
    vi.stubEnv('WAKATIME_ACTIVITY_URL', '');
    expect(await getWakatimeStats()).toEqual({ status: 'unconfigured' });
  });
});

describe('Spotify', () => {
  it('normaliza faixa e episódio', () => {
    expect(
      normalizeTrack({
        id: '1',
        type: 'track',
        name: 'Faixa',
        artists: [{ name: 'A' }, { name: 'B' }],
        album: {
          name: 'Álbum',
          images: [
            { url: 'big', width: 640 },
            { url: 'small', width: 300 },
          ],
        },
        external_urls: { spotify: 'https://open.spotify.com/track/1' },
        duration_ms: 180000,
      }),
    ).toEqual({
      id: '1',
      title: 'Faixa',
      artists: 'A, B',
      album: 'Álbum',
      imageUrl: 'small',
      url: 'https://open.spotify.com/track/1',
      durationMs: 180000,
    });
    expect(
      normalizeTrack({
        id: '2',
        type: 'episode',
        name: 'Ep',
        show: { name: 'Podcast', images: [] },
      }),
    ).toMatchObject({ title: 'Ep', artists: 'Podcast', imageUrl: null });
    expect(normalizeTrack(null)).toBeNull();
  });

  it('sem variáveis configuradas responde "unconfigured"', async () => {
    vi.stubEnv('SPOTIFY_CLIENT_ID', '');
    expect(await getSpotifySummary()).toEqual({ status: 'unconfigured' });
  });
});

describe('rate limit em memória', () => {
  it('bloqueia depois do limite e libera quando a janela passa', () => {
    let now = 0;
    const limit = createMemoryLimiter({ requests: 2, windowMs: 1000 }, () => now);
    expect(limit('ip').success).toBe(true);
    expect(limit('ip').success).toBe(true);
    expect(limit('ip').success).toBe(false);
    expect(limit('outro-ip').success).toBe(true);
    now = 1001;
    expect(limit('ip').success).toBe(true);
  });
});
