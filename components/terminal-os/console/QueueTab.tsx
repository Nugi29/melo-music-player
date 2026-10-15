'use client';

import React from 'react';
import { Track } from '@/types/music';
import { formatDuration } from '@/lib/utils/formatters';

interface QueueTabProps {
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
}

export default function QueueTab({
  queue,
  currentTrack,
  isPlaying,
  onPlayTrack,
}: QueueTabProps) {
  if (queue.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--color-term-dim)] text-xs italic font-mono">
        Queue is empty. Select a video or audio track to buffer.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 py-1 pr-1 font-mono text-xs select-none">
      {queue.map((track, idx) => {
        const isCurrent = currentTrack?.id === track.id;
        const indexStr = String(idx + 1).padStart(2, '0');
        const sourceTag = track.youtubeId
          ? `[yt:${track.youtubeId.slice(0, 6)}]`
          : track.source === 'local'
          ? `[loc:${track.album || 'vids'}]`
          : `[demo:${track.id.slice(0, 6)}]`;

        return (
          <div
            key={`${track.id}-${idx}`}
            onClick={() => onPlayTrack(track)}
            className={`flex items-center justify-between px-1.5 py-0.5 cursor-pointer text-[11px] transition-colors ${
              isCurrent
                ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border-l-2 border-[var(--color-term-green)]'
                : 'hover:bg-[var(--color-term-border)]/20 text-[var(--color-term-cyan)]'
            }`}
          >
            {/* Left: Index & Title */}
            <div className="flex items-center gap-2 truncate pr-2">
              <span className={isCurrent ? 'text-[var(--color-term-green)] font-bold' : 'text-[var(--color-term-dim)]'}>
                {isCurrent ? `▶ ${indexStr}` : `:: ${indexStr}`}
              </span>
              <span
                className={`truncate ${
                  isCurrent ? 'text-[var(--color-term-green)] font-semibold' : 'text-[var(--color-term-text)]'
                }`}
              >
                {track.title}
              </span>
              <span className="text-[var(--color-term-dim)] text-[10px] hidden sm:inline flex-none">
                {sourceTag}
              </span>
            </div>

            {/* Right: Artist, Duration, Status */}
            <div className="flex items-center gap-3 text-[10px] flex-none">
              <span className="text-[var(--color-term-muted)] hidden md:inline truncate max-w-[120px]">
                {track.artist}
              </span>
              <span className="text-[var(--color-term-text)]">{formatDuration(track.duration || 180)}</span>
              {isCurrent ? (
                <span className="text-[var(--color-term-green)] font-bold neon-green-glow">
                  {isPlaying ? 'PLAYING' : 'PAUSED'}
                </span>
              ) : (
                <span className="text-[var(--color-term-dim)]">{track.isVideo ? '1080p' : 'AUDIO'}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
