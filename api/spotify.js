import { json } from '../server/http.js';
import { getSpotifySummary } from '../server/spotify.js';

/** GET /api/spotify → { status: 'ok'|'expired'|'unconfigured'|'error', nowPlaying, recent, top } */
export async function GET() {
  const summary = await getSpotifySummary();
  const cache =
    summary.status === 'ok'
      ? 'public, s-maxage=30, stale-while-revalidate=60'
      : 'public, s-maxage=300, stale-while-revalidate=600';
  return json(summary, { headers: { 'cache-control': cache } });
}
