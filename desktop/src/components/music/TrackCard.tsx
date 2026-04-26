import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { preloadTrack } from '../../lib/audio';
import { art, dur, fc } from '../../lib/formatters';
import { ListMusic, ListPlus, pauseBlack20, playBlack20, playIcon32 } from '../../lib/icons';
import { useTrackPlay } from '../../lib/useTrackPlay';
import type { Track } from '../../stores/player';
import { usePlayerStore } from '../../stores/player';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { LikeButton } from './LikeButton';

interface TrackCardProps {
  track: Track;
  queue?: Track[];
}

export const TrackCard = React.memo(
  function TrackCard({ track, queue }: TrackCardProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isThisPlaying, togglePlay } = useTrackPlay(track, queue);
    const addToQueueNext = usePlayerStore((s) => s.addToQueueNext);
    const artwork = art(track.artwork_url, 't300x300');

    const handleAddToQueue = (e: React.MouseEvent) => {
      e.stopPropagation();
      addToQueueNext([track]);
    };

    return (
      <div
        className="group relative select-none"
        onMouseEnter={() => preloadTrack(track.urn)}
        style={{
          contentVisibility: 'auto',
          contain: 'layout paint style',
          containIntrinsicSize: '180px 260px',
        }}
      >
        {/* Artwork */}
        <div
          className="swlz-card-art relative aspect-square overflow-hidden bg-white/[0.03] cursor-pointer group-hover:border-white/[0.16] transition-all duration-300 ease-[var(--ease-apple)]"
          onClick={togglePlay}
        >
          {artwork ? (
            <img
              src={artwork}
              alt={track.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-[var(--ease-apple)] group-hover:scale-[1.04]"
              decoding="async"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              {playIcon32}
            </div>
          )}

          {/* Hover overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isThisPlaying
                ? 'bg-black/30 backdrop-blur-[2px] opacity-100'
                : 'bg-black/0 opacity-0 group-hover:bg-black/30 group-hover:backdrop-blur-[2px] group-hover:opacity-100'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ease-[var(--ease-apple)] shadow-xl ${
                isThisPlaying ? 'bg-white scale-100' : 'bg-white/90 scale-75 group-hover:scale-100'
              }`}
            >
              {isThisPlaying ? pauseBlack20 : playBlack20}
            </div>
          </div>

          {/* Duration pill */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="text-[10px] font-black bg-black/70 text-white/85 px-2 py-0.5 rounded-full border border-white/[0.09]">
              {dur(track.duration)}
            </div>
          </div>

          {/* Like button — top left */}
          <LikeButton track={track} variant="overlay" />

          {/* Top right: add to playlist + add to queue */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <AddToPlaylistDialog trackUrns={[track.urn]}>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer w-8 h-8 rounded-[12px] bg-black/70 border border-white/[0.09] flex items-center justify-center text-white/80 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
                title={t('playlist.addToPlaylist')}
              >
                <ListPlus size={14} />
              </button>
            </AddToPlaylistDialog>
            <button
              type="button"
              onClick={handleAddToQueue}
              className="cursor-pointer w-8 h-8 rounded-[12px] bg-black/70 border border-white/[0.09] flex items-center justify-center text-white/80 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
              title={t('player.addToQueue')}
            >
              <ListMusic size={14} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 min-w-0">
          <p
            className="text-[13px] font-black text-white/95 truncate leading-snug cursor-pointer hover:text-white transition-colors duration-150"
            onClick={() => navigate(`/track/${encodeURIComponent(track.urn)}`)}
          >
            {track.title}
          </p>
          <p
            className="text-[11px] text-white/45 truncate mt-0.5 cursor-pointer hover:text-white/65 transition-colors duration-150"
            onClick={() => navigate(`/user/${encodeURIComponent(track.user.urn)}`)}
          >
            {track.user.username}
          </p>
          {track.playback_count != null && (
            <p className="text-[10px] text-white/30 mt-1 tabular-nums font-bold">
              {fc(track.playback_count)} plays
            </p>
          )}
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.track.urn === next.track.urn && prev.track.user_favorite === next.track.user_favorite,
);
