/**
 * Acorda servidores de demo em plano gratuito (o Render desliga depois de
 * 15 minutos sem uso e leva cerca de um minuto para voltar). O app Projetos
 * chama isto ao abrir: quando o visitante clicar em Demo, o servidor já
 * está ligando ou ligado.
 *
 * `no-cors` basta: a resposta não interessa, só que a requisição chegue.
 */
const MIN_INTERVAL_MS = 10 * 60 * 1000;
const lastPing = new Map();

/** Dispara uma requisição em segundo plano (no máximo uma a cada 10 min por URL). */
export function wakeServer(url, now = Date.now()) {
  if (!url) return false;
  const last = lastPing.get(url);
  if (last !== undefined && now - last < MIN_INTERVAL_MS) return false;
  lastPing.set(url, now);
  fetch(url, { mode: 'no-cors', cache: 'no-store', credentials: 'omit' }).catch(() => {});
  return true;
}
