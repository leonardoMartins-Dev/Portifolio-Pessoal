import { json } from '../server/http.js';
import { getWakatimeStats } from '../server/wakatime.js';

/** GET /api/wakatime → tempo total programando e linguagens (cache de 1h). */
export async function GET() {
  const stats = await getWakatimeStats();
  const cache =
    stats.status === 'ok'
      ? 'public, s-maxage=3600, stale-while-revalidate=86400'
      : 'public, s-maxage=300';
  return json(stats, { headers: { 'cache-control': cache } });
}
