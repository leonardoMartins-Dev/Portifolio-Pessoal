import { getGithubSummary } from '../server/github.js';
import { json } from '../server/http.js';

/** GET /api/github → repositórios, commits e gráfico de contribuições (cache de 30 min). */
export async function GET() {
  const summary = await getGithubSummary();
  const cache =
    summary.status === 'ok'
      ? 'public, s-maxage=1800, stale-while-revalidate=86400'
      : 'public, s-maxage=300';
  return json(summary, { headers: { 'cache-control': cache } });
}
