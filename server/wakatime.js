/**
 * WakaTime (§12.2). Lê os dois embeds JSON públicos do autor ("Coding
 * Activity" e "Languages", últimos 7 dias). Eles não têm CORS, por isso a
 * busca é feita no servidor. Formatos retornados pelo WakaTime:
 *
 *   Coding Activity: { data: [{ grand_total: { total_seconds }, range: { date } }] }
 *   Languages:       { data: [{ name, percent, color }] }
 */
const CACHE_MS = 60 * 60 * 1000;
let cache = null; // { value, expiresAt }

export function isWakatimeConfigured(env = process.env) {
  return Boolean(env.WAKATIME_LANGUAGES_URL && env.WAKATIME_ACTIVITY_URL);
}

function assertWakatimeUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('wakatime.com')) {
    throw new Error('WAKATIME_*_URL precisa ser uma URL https do wakatime.com');
  }
  return parsed;
}

/** Normaliza os dois JSONs para o formato do app Atividade. */
export function normalizeWakatime(activityJson, languagesJson) {
  const days = (activityJson?.data ?? [])
    .map((day) => ({
      date: day.range?.date ?? day.range?.start?.slice(0, 10) ?? '',
      seconds: Math.round(Number(day.grand_total?.total_seconds) || 0),
    }))
    .filter((day) => day.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalSeconds = days.reduce((sum, day) => sum + day.seconds, 0);
  const dailyAverageSeconds = days.length ? Math.round(totalSeconds / days.length) : 0;

  const languages = (languagesJson?.data ?? [])
    .map((language) => {
      const percent = Number(language.percent) || 0;
      return {
        name: language.name,
        color: language.color ?? null,
        percent,
        seconds: Math.round((percent / 100) * totalSeconds),
      };
    })
    .filter((language) => language.name && language.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  return { totalSeconds, dailyAverageSeconds, days, languages };
}

export async function getWakatimeStats() {
  if (!isWakatimeConfigured()) return { status: 'unconfigured' };
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  try {
    const [activity, languages] = await Promise.all(
      [process.env.WAKATIME_ACTIVITY_URL, process.env.WAKATIME_LANGUAGES_URL].map(async (url) => {
        const response = await fetch(assertWakatimeUrl(url));
        if (!response.ok) throw new Error(`WakaTime: HTTP ${response.status}`);
        return response.json();
      }),
    );
    const value = { status: 'ok', ...normalizeWakatime(activity, languages) };
    cache = { value, expiresAt: Date.now() + CACHE_MS };
    return value;
  } catch {
    return { status: 'error' };
  }
}
