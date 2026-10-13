'use client';

import React from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { formatDuration } from '@/lib/utils/formatters';
import { Play, Pause, SkipForward, Terminal as TerminalIcon, Radio } from 'lucide-react';

interface MobileMiniPlayerProps {
  onOpenFullPlayer: () => void;
  onOpenTerminal: () => void;
}

export default function MobileMiniPlayer({
  onOpenFullPlayer,
  onOpenTerminal,
}: MobileMiniPlayerProps) {
  const { currentTrack, isPlaying, currentTime, duration, togglePlay, nextTrack } = useAudio();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={onOpenFullPlayer}
      className="lg:hidden flex-none border-t border-[var(--color-term-border)] bg-[#020d0d] font-mono text-xs select-none cursor-pointer"
    >
      {/* Mini Progress Bar Line */}
      <div className="w-full bg-[#001e1e] h-1 overflow-hidden">
        <div
          className="bg-[var(--color-term-green)] h-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-2 flex items-center justify-between gap-2">
        {/* Track Info */}
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div className="w-8 h-8 shrink-0 border border-[var(--color-term-border)] bg-[#010909] flex items-center justify-center overflow-hidden">
            {currentTrack.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentTrack.pictureUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Radio className="w-4 h-4 text-[var(--color-term-green)] animate-pulse" />
            )}
          </div>

          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-[var(--color-term-cyan)] truncate leading-tight">
              {currentTrack.title}
            </h4>
            <p className="text-[10px] text-[var(--color-term-muted)] truncate">
              {currentTrack.artist} • {formatDuration(currentTime)} / {formatDuration(duration)}
            </p>
          </div>
        </div>

        {/* Quick Controls */}
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onOpenTerminal}
            title="Open Terminal"
            className="p-1.5 text-[var(--color-term-cyan)] border border-[var(--color-term-border)]"
          >
            <TerminalIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-7 h-7 rounded-full border border-[var(--color-term-green)] flex items-center justify-center text-[var(--color-term-green)] shadow-[0_0_6px_rgba(0,255,136,0.3)]"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            title="Next Track"
            className="p-1 text-[var(--color-term-cyan)] hover:text-[var(--color-term-green)]"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
