'use client';

import React from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { formatDuration } from '@/lib/utils/formatters';

export default function MixerConsole() {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeatMode,
    togglePlay,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    nextTrack,
    prevTrack,
  } = useAudio();

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const volPct = Math.round(volume * 100);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    seek(pct * (duration || 200));
  };

  const handleVolume = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    setVolume(pct);
  };

  return (
    <section
      className="border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-2.5 flex flex-col shrink-0 font-mono gap-2 select-none"
      data-purpose="audio-playback-console"
    >
      {/* Track Progress Slider */}
      <div>
        <div className="flex justify-between text-[10px] text-[var(--color-term-text)] mb-1">
          <span className="text-[var(--color-term-green)] font-bold">{formatDuration(currentTime)}</span>
          <span className="text-[var(--color-term-muted)]">{Math.round(progressPct)}%</span>
          <span>{formatDuration(duration || 200)}</span>
        </div>
        <div
          onClick={handleSeek}
          className="w-full bg-[var(--color-term-bg)] h-1.5 relative border border-[var(--color-term-border)] rounded-full cursor-pointer flex items-center"
        >
          <div
            style={{ width: `${progressPct}%` }}
            className="bg-[var(--color-term-green)] h-full rounded-full neon-box-glow pointer-events-none transition-all duration-75"
          />
          <div
            style={{ left: `${progressPct}%` }}
            className="w-3 h-3 bg-[var(--color-term-green)] rounded-full border border-black shadow-sm -ml-1.5 neon-green-box absolute pointer-events-none"
          />
        </div>
      </div>

      {/* Tactile Hardware Transport Buttons */}
      <div className="flex items-center justify-center gap-4 py-1">
        <button
          onClick={toggleShuffle}
          className={`text-xs transition-colors ${
            shuffle ? 'text-[var(--color-term-green)] font-bold' : 'text-[var(--color-term-muted)] hover:text-[var(--color-term-green)]'
          }`}
          title="Shuffle"
        >
          ⤮
        </button>
        <button
          onClick={prevTrack}
          className="text-sm text-[var(--color-term-cyan)] hover:text-[var(--color-term-green)] transition-colors font-bold"
          title="Previous"
        >
          |◀
        </button>
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full border-2 border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 flex items-center justify-center text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/30 neon-green-box transition-all text-xs font-bold cursor-pointer"
          title="Play/Pause"
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <button
          onClick={nextTrack}
          className="text-sm text-[var(--color-term-cyan)] hover:text-[var(--color-term-green)] transition-colors font-bold"
          title="Next"
        >
          ▶|
        </button>
        <button
          onClick={toggleRepeat}
          className={`text-xs transition-colors ${
            repeatMode !== 'off'
              ? 'text-[var(--color-term-green)] font-bold'
              : 'text-[var(--color-term-muted)] hover:text-[var(--color-term-green)]'
          }`}
          title="Loop"
        >
          ↻
        </button>
      </div>

      {/* Master Volume Slider */}
      <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-term-border)] text-[10px] text-[var(--color-term-text)]">
        <span className="text-[var(--color-term-green)] text-xs">🔊</span>
        <div
          onClick={handleVolume}
          className="flex-1 bg-[var(--color-term-bg)] h-1.5 border border-[var(--color-term-border)] rounded-full overflow-hidden relative cursor-pointer"
        >
          <div
            style={{ width: `${volPct}%` }}
            className="bg-[var(--color-term-green)] h-full transition-all duration-75"
          />
        </div>
        <span className="text-[var(--color-term-green)] font-bold text-[10px] w-8 text-right">
          {volPct}%
        </span>
      </div>
    </section>
  );
}
