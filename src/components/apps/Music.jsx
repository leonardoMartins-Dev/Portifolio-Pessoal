import { Disc3, ExternalLink, Music2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FaSpotify } from 'react-icons/fa6';
import { formatTrackTime } from '../../lib/format.js';
import { useNow } from '../../lib/hooks.js';
import { useSpotify } from '../../lib/live-data.js';
import { siteConfig } from '../../site.config.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { EqualizerBars } from '../os/MiniPlayer.jsx';

/** Música: agora tocando, recentes e top do Spotify, com fallback de playlist (§12.1). */
export default function Music() {
  const { t } = useTranslation();
  const { status, data, fetchedAt } = useSpotify();

  if (status === 'loading') {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted"
      >
        <Spinner className="size-5" />
        {t('music.loading')}
      </div>
    );
  }

  if (status !== 'ok') {
    return <MusicFallback status={status} />;
  }

  const { nowPlaying, recent = [], top = [] } = data;
  const current = nowPlaying?.track ?? recent[0] ?? null;

  return (
    <AppScroll>
      {current ? (
        <NowPlayingCard
          track={current}
          playing={Boolean(nowPlaying?.isPlaying)}
          progressMs={nowPlaying?.progressMs ?? 0}
          fetchedAt={fetchedAt}
          label={nowPlaying?.isPlaying ? t('music.nowPlaying') : t('music.lastPlayed')}
        />
      ) : (
        <EmptyState icon={Music2} title={t('music.empty')} />
      )}

      {recent.length > 0 && (
        <TrackList id="music-recent" title={t('music.recent')} tracks={recent.slice(0, 10)} />
      )}
      {top.length > 0 && <TrackList id="music-top" title={t('music.top')} tracks={top} numbered />}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted">
        <FaSpotify aria-hidden className="size-3.5" />
        {t('music.dataVia')}
      </p>
    </AppScroll>
  );
}

function NowPlayingCard({ track, playing, progressMs, fetchedAt, label }) {
  const { t } = useTranslation();
  const now = useNow(1000);
  // Progresso animado localmente entre uma consulta e outra.
  const progress = playing
    ? Math.min(track.durationMs, progressMs + (now.getTime() - fetchedAt))
    : progressMs;
  const percent = track.durationMs ? (progress / track.durationMs) * 100 : 0;

  return (
    <section
      aria-labelledby="music-now"
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface-2 p-4 sm:flex-row"
    >
      <Cover src={track.imageUrl} className="size-36 self-center sm:size-32" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <p
          id="music-now"
          className="flex items-center gap-2 text-xs font-semibold tracking-wide text-accent-ink uppercase"
        >
          {playing && <EqualizerBars />}
          {label}
        </p>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{track.title}</p>
          <p className="truncate text-sm text-muted">{track.artists}</p>
        </div>
        {playing && track.durationMs > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-muted tabular-nums">
            <span>{formatTrackTime(progress)}</span>
            <div
              role="progressbar"
              aria-label={t('music.progress')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percent)}
              className="h-1 flex-1 overflow-hidden rounded-full bg-border-strong"
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
            <span>{formatTrackTime(track.durationMs)}</span>
          </div>
        )}
        {track.url && (
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
          >
            {t('music.openInSpotify')}
            <ExternalLink aria-hidden className="size-3.5" />
            <span className="sr-only">{t('common.newTab')}</span>
          </a>
        )}
      </div>
    </section>
  );
}

function TrackList({ id, title, tracks, numbered }) {
  const { t } = useTranslation();
  const List = numbered ? 'ol' : 'ul';
  return (
    <section aria-labelledby={id} className="mt-6">
      <SectionTitle id={id}>{title}</SectionTitle>
      <List className="mt-2 flex flex-col">
        {tracks.map((track, index) => (
          <li key={`${track.id}-${index}`}>
            <a
              href={track.url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-sm p-2 hover:bg-surface-2"
            >
              {numbered && (
                <span className="w-4 text-right text-xs text-muted tabular-nums">{index + 1}</span>
              )}
              <Cover src={track.imageUrl} className="size-10" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{track.title}</span>
                <span className="block truncate text-xs text-muted">{track.artists}</span>
              </span>
              <span className="sr-only">{t('common.newTab')}</span>
            </a>
          </li>
        ))}
      </List>
    </section>
  );
}

function Cover({ src, className }) {
  if (!src) {
    return (
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-sm bg-border text-muted ${className}`}
      >
        <Disc3 className="size-1/2" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={`shrink-0 rounded-sm object-cover ${className}`}
    />
  );
}

/** Sem Spotify (não configurado, expirado ou fora do ar): mostra a playlist do autor, se houver. */
function MusicFallback({ status }) {
  const { t } = useTranslation();
  const playlistId = siteConfig.spotifyPlaylistId;
  const message =
    status === 'expired'
      ? t('music.expired')
      : status === 'unconfigured'
        ? t('music.unconfigured')
        : t('music.error');

  return (
    <AppScroll>
      <EmptyState icon={FaSpotify} title={message}>
        {playlistId && <p>{t('music.playlistHint')}</p>}
      </EmptyState>
      {playlistId && (
        <iframe
          title={t('music.playlistTitle')}
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="h-[352px] w-full rounded-md border-0"
        />
      )}
    </AppScroll>
  );
}
