import { useSyncExternalStore } from 'react';

/**
 * Pequeno cache compartilhado para os dados ao vivo (Spotify, WakaTime, GitHub).
 * Vários componentes (mini player, app Música, widget do celular) leem o
 * mesmo dado com uma única requisição. O polling só roda com a aba visível.
 */
function createLiveResource(url, { intervalMs } = {}) {
  let snapshot = { status: 'loading', data: null, fetchedAt: 0 };
  const listeners = new Set();
  let timer = null;
  let inflight = null;

  const emit = () => listeners.forEach((listener) => listener());

  async function refresh() {
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const response = await fetch(url, { headers: { accept: 'application/json' } });
        const data = await response.json();
        snapshot = { status: data.status ?? 'error', data, fetchedAt: Date.now() };
      } catch {
        snapshot = { status: 'error', data: snapshot.data, fetchedAt: Date.now() };
      } finally {
        inflight = null;
        emit();
      }
    })();
    return inflight;
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') {
      if (intervalMs && Date.now() - snapshot.fetchedAt > intervalMs) refresh();
      startTimer();
    } else {
      stopTimer();
    }
  }

  function startTimer() {
    if (!intervalMs || timer || document.visibilityState !== 'visible') return;
    timer = setInterval(refresh, intervalMs);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  function subscribe(listener) {
    listeners.add(listener);
    if (listeners.size === 1) {
      if (!snapshot.fetchedAt || (intervalMs && Date.now() - snapshot.fetchedAt > intervalMs)) {
        refresh();
      }
      startTimer();
      document.addEventListener('visibilitychange', onVisibility);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        stopTimer();
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }

  return {
    use: () =>
      useSyncExternalStore(
        subscribe,
        () => snapshot,
        () => snapshot,
      ),
    refresh,
  };
}

/** Spotify: agora tocando, recentes e top. Atualiza a cada 30s. */
export const spotifyResource = createLiveResource('/api/spotify', { intervalMs: 30_000 });
export const useSpotify = spotifyResource.use;

/** WakaTime: estatísticas da semana (o servidor guarda em cache por 1h). */
export const wakatimeResource = createLiveResource('/api/wakatime');
export const useWakatime = wakatimeResource.use;

/** GitHub: repositórios, commits e contribuições (o servidor guarda em cache por 30 min). */
export const githubResource = createLiveResource('/api/github');
export const useGithub = githubResource.use;
