/**
 * WakaTime (§12.2). Lê os dois embeds JSON públicos do autor: "Coding
 * Activity" no maior período que o WakaTime oferece (último ano) e
 * "Languages" de todo o período. Eles não têm CORS, por isso a busca é feita
 * no servidor. Os números somam o período inteiro, a partir do primeiro dia
 * com código: enquanto a conta tiver menos de um ano, é o total de sempre.
 * Formatos retornados pelo WakaTime:
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

/** Normaliza os dois JSONs para o app Atividade: totais de todo o período. */
export function normalizeWakatime(activityJson, languagesJson) {
  const activeDays = (activityJson?.data ?? [])
    .map((day) => ({
      date: day.range?.date ?? day.range?.start?.slice(0, 10) ?? '',
      seconds: Math.round(Number(day.grand_total?.total_seconds) || 0),
    }))
    .filter((day) => day.date && day.seconds > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalSeconds = activeDays.reduce((sum, day) => sum + day.seconds, 0);
  const bestDay = activeDays.reduce(
    (best, day) => (day.seconds > (best?.seconds ?? 0) ? day : best),
    null,
  );

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

  return {
    totalSeconds,
    // Como no WakaTime: a média conta só os dias em que houve código.
    dailyAverageSeconds: activeDays.length ? Math.round(totalSeconds / activeDays.length) : 0,
    activeDays: activeDays.length,
    since: activeDays[0]?.date ?? null,
    bestDay,
    languages,
  };
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
