import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/** Limites do assistente (§11.3). */
export const LIMITS = {
  perIp: { requests: 15, window: '10 m', windowMs: 10 * 60 * 1000 },
  daily: { requests: 500, window: '1 d', windowMs: 24 * 60 * 60 * 1000 },
};

let upstash;

function getUpstash() {
  if (upstash !== undefined) return upstash;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    upstash = null;
    return upstash;
  }
  const redis = new Redis({ url, token });
  upstash = {
    perIp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(LIMITS.perIp.requests, LIMITS.perIp.window),
      prefix: 'portifolio:chat:ip',
    }),
    daily: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(LIMITS.daily.requests, LIMITS.daily.window),
      prefix: 'portifolio:chat:daily',
    }),
  };
  return upstash;
}

/**
 * Limite em memória (por instância), usado em produção quando o Upstash
 * não está configurado. Não é global, mas evita abuso óbvio.
 */
export function createMemoryLimiter({ requests, windowMs }, now = () => Date.now()) {
  const hits = new Map();
  return function limit(key) {
    const time = now();
    const recent = (hits.get(key) ?? []).filter((t) => time - t < windowMs);
    if (recent.length >= requests) {
      hits.set(key, recent);
      return { success: false, reset: recent[0] + windowMs };
    }
    recent.push(time);
    hits.set(key, recent);
    return { success: true, reset: time + windowMs };
  };
}

const memory = {
  perIp: createMemoryLimiter(LIMITS.perIp),
  daily: createMemoryLimiter(LIMITS.daily),
};

let warned = false;

/** Verifica os dois limites: por IP e o teto global diário. */
export async function checkRateLimit(ip) {
  const limiters = getUpstash();

  if (!limiters) {
    if (!warned) {
      console.warn(
        '[ratelimit] Upstash não configurado: em dev o limite é pulado; em produção usa memória local.',
      );
      warned = true;
    }
    if (process.env.NODE_ENV !== 'production') return { ok: true };
    const results = [memory.perIp(ip), memory.daily('global')];
    return toResult(results);
  }

  const results = await Promise.all([limiters.perIp.limit(ip), limiters.daily.limit('global')]);
  return toResult(results);
}

function toResult(results) {
  const blocked = results.filter((result) => !result.success);
  if (!blocked.length) return { ok: true };
  const reset = Math.max(...blocked.map((result) => result.reset));
  return { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
}
