'use client';

import React from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { Heart } from 'lucide-react';

export default function NowPlayingCard() {
  const { currentTrack, isPlaying, toggleLike } = useAudio();

  const title = currentTrack?.title || 'Blinding Lights (Official ASCII Video)';
  const artist = currentTrack?.artist || 'The Weeknd';
  const isLiked = Boolean(currentTrack?.isLiked);
  const isVideo = Boolean(currentTrack?.isVideo || currentTrack?.youtubeId);

  return (
    <section
      className="border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-2.5 flex flex-col gap-2 shrink-0 font-mono select-none"
      data-purpose="now-playing-meta"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1.5 text-[var(--color-term-green)] font-bold">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-term-green)] ${
              isPlaying ? 'animate-pulse' : ''
            }`}
          />
          ((o)) NOW PLAYING
        </span>
        <span className="text-[var(--color-term-cyan)] text-[10px]">
          {isVideo ? 'VIDEO_SYS' : 'AUDIO_SYS'}
        </span>
      </div>

      <div className="flex items-start gap-2.5">
        {/* Mini Artwork / Terminal Frame */}
        <div className="w-16 h-16 shrink-0 bg-[var(--color-term-bg)] border border-[var(--color-term-border)] relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 crt-overlay opacity-50 pointer-events-none" />
          <div className="text-[7px] leading-[7px] text-[var(--color-term-green)]/70 font-mono select-none text-center">
            ..:==*#
            <br />
            *@@@@*
            <br />
            %@@@@%
            <br />
            :=+*#=
          </div>
          <span className="absolute bottom-0.5 right-0.5 text-[8px] text-[var(--color-term-green)] font-bold font-mono">
            {isPlaying ? 'LIVE' : 'RDY'}
          </span>
        </div>

        {/* Meta Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="px-1 py-0.2 bg-[var(--color-term-green)]/20 border border-[var(--color-term-green)]/60 text-[var(--color-term-green)] text-[9px] font-bold uppercase tracking-wider shrink-0">
              [ {isVideo ? 'VIDEO' : 'AUDIO'} ]
            </span>
            <h2 className="text-xs font-bold text-[var(--color-term-cyan)] truncate neon-text-glow leading-snug">
              {title}
            </h2>
          </div>
          <p className="text-[11px] font-semibold text-[var(--color-term-green)] truncate">{artist}</p>
          <div className="flex items-center justify-between text-[10px] text-[var(--color-term-muted)] mt-1">
            <span className="text-[var(--color-term-text)]/80 truncate">
              {currentTrack?.album || 'Video Library'}
            </span>
            <div className="flex items-center gap-1.5 flex-none">
              <span className="px-1 py-0.5 bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border border-[var(--color-term-border)] text-[9px]">
                {isVideo ? 'Stream' : 'HiFi'}
              </span>
              <button
                onClick={() => currentTrack && toggleLike(currentTrack.id)}
                className={`transition-colors text-xs p-0.5 ${
                  isLiked ? 'text-[var(--color-term-error)]' : 'text-[var(--color-term-green)] hover:text-white'
                }`}
                title={isLiked ? 'Unlike' : 'Favorite'}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    isLiked ? 'fill-[var(--color-term-error)] text-[var(--color-term-error)]' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
