/**
 * Spotify Web API (§12.1). Usa o refresh token do autor para obter um
 * access token (em cache na memória até expirar).
 *
 * Regras de 2026: apps em Development Mode exigem Premium do dono; o
 * refresh token expira 6 meses após a autorização (renovar o access token
 * não reinicia o prazo). Expirado, o endpoint de token devolve invalid_grant.
 */
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';

export class SpotifyExpiredError extends Error {}

let cachedToken = null; // { value, expiresAt }
let expired = false;

export function isSpotifyConfigured(env = process.env) {
  return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET && env.SPOTIFY_REFRESH_TOKEN);
}

async function getAccessToken() {
  if (expired) throw new SpotifyExpiredError();
  if (cachedToken && cachedToken.expiresAt > Date.now() + 10_000) return cachedToken.value;

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Token expirado/revogado: não tenta de novo até reiniciar a função.
    if (data.error === 'invalid_grant') {
      expired = true;
      throw new SpotifyExpiredError();
    }
    throw new Error(`Spotify token: HTTP ${response.status}`);
  }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function spotifyGet(path) {
  const token = await getAccessToken();
  const response = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`Spotify ${path}: HTTP ${response.status}`);
  return response.json();
}

/** Faixa (ou episódio de podcast) → formato usado na interface. */
export function normalizeTrack(item) {
  if (!item) return null;
  const isEpisode = item.type === 'episode';
  const images = isEpisode ? (item.images ?? item.show?.images) : item.album?.images;
  return {
    id: item.id,
    title: item.name,
    artists: isEpisode
      ? (item.show?.name ?? '')
      : (item.artists ?? []).map((artist) => artist.name).join(', '),
    album: isEpisode ? (item.show?.name ?? '') : (item.album?.name ?? ''),
    imageUrl:
      images?.find((image) => image.width && image.width <= 320)?.url ?? images?.[0]?.url ?? null,
    url: item.external_urls?.spotify ?? null,
    durationMs: item.duration_ms ?? 0,
  };
}

export async function getNowPlaying() {
  const data = await spotifyGet('/me/player/currently-playing?additional_types=episode');
  if (!data?.item) return null;
  return {
    isPlaying: Boolean(data.is_playing),
    progressMs: data.progress_ms ?? 0,
    track: normalizeTrack(data.item),
  };
}

export async function getRecentlyPlayed(limit = 10) {
  const data = await spotifyGet(`/me/player/recently-played?limit=${limit}`);
  return (data?.items ?? []).map((entry) => ({
    ...normalizeTrack(entry.track),
    playedAt: entry.played_at,
  }));
}

export async function getTopTracks(range = 'short_term', limit = 5) {
  const data = await spotifyGet(`/me/top/tracks?time_range=${range}&limit=${limit}`);
  return (data?.items ?? []).map(normalizeTrack);
}

/** Tudo o que o app Música precisa, numa resposta. */
export async function getSpotifySummary() {
  if (!isSpotifyConfigured()) return { status: 'unconfigured' };
  try {
    const [nowPlaying, recent, top] = await Promise.all([
      getNowPlaying(),
      getRecentlyPlayed(10),
      getTopTracks('short_term', 5),
    ]);
    return { status: 'ok', nowPlaying, recent, top };
  } catch (error) {
    if (error instanceof SpotifyExpiredError) return { status: 'expired' };
    return { status: 'error' };
  }
}
