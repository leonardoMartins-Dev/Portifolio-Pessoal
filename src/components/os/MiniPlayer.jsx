import { useTranslation } from 'react-i18next';
import { useSpotify } from '../../lib/live-data.js';
import { navigateToApp } from '../../lib/os-bridge.js';

/** Mini player da barra de menu: só aparece quando há música tocando. */
export function MiniPlayer() {
  const { t } = useTranslation();
  const { status, data } = useSpotify();
  const nowPlaying = status === 'ok' ? data?.nowPlaying : null;
  if (!nowPlaying?.isPlaying) return null;
  const { track } = nowPlaying;

  return (
    <button
      type="button"
      onClick={() => navigateToApp('music')}
      title={t('music.miniPlayer', { track: track.title, artist: track.artists })}
      className="hidden h-6 max-w-64 items-center gap-2 rounded-[7px] px-2 hover:bg-border md:flex"
    >
      <EqualizerBars />
      <span className="sr-only">{t('music.nowPlaying')}: </span>
      <span className="truncate">
        {track.title} <span className="text-muted">— {track.artists}</span>
      </span>
    </button>
  );
}

export function EqualizerBars({ className = '' }) {
  return (
    <span aria-hidden className={`flex h-3 items-end gap-[2px] ${className}`}>
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="w-[3px] origin-bottom animate-[eq_0.9s_ease-in-out_infinite] rounded-full bg-accent"
          style={{ animationDelay: `${bar * 0.15}s`, height: '100%' }}
        />
      ))}
    </span>
  );
}
