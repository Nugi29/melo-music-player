'use client';

import React, { useState } from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { formatDuration } from '@/lib/utils/formatters';

import { DspShaderSettings, AsciiQualityProfile } from '../types';

interface ControllerDeckProps {
  dspSettings?: DspShaderSettings;
  onUpdateDspSettings?: (newSettings: Partial<DspShaderSettings>) => void;
  onOpenCinema?: () => void;
  className?: string;
}

export default function ControllerDeck({
  dspSettings,
  onUpdateDspSettings,
  onOpenCinema,
  className = '',
}: ControllerDeckProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeatMode,
    togglePlay,
    pause,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    nextTrack,
    prevTrack,
    mediaElement,
  } = useAudio();

  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
  const qualities: AsciiQualityProfile[] = [
    'ASCII-Retro',
    'ASCII-Std',
    'ASCII-HQ',
    'ASCII-Ultra',
    'ASCII-Pro',
  ];
  const currentQuality = dspSettings?.resolutionProfile || 'ASCII-Std';

  const handleCycleSpeed = () => {
    const curIdx = speeds.indexOf(playbackRate);
    const nextIdx = (curIdx + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackRate(newSpeed);
    if (mediaElement) {
      mediaElement.playbackRate = newSpeed;
    }
  };

  const handleCycleQuality = () => {
    const curIdx = qualities.indexOf(currentQuality);
    const nextIdx = (curIdx + 1) % qualities.length;
    const nextQuality = qualities[nextIdx];
    onUpdateDspSettings?.({ resolutionProfile: nextQuality });
  };

  // Progress calculations
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const totalFrames = Math.max(1, Math.round((duration || 200) * 24));
  const currentFrame = Math.min(totalFrames, Math.round((currentTime || 0) * 24));

  // Decibel calculation for volume meter
  const dB = Math.round(20 * Math.log10(Math.max(0.01, volume)));

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    seek(pct * (duration || 200));
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    setVolume(pct);
  };

  const handleStop = () => {
    pause();
    seek(0);
  };

  return (
    <div
      className={`flex-none mt-2 pt-2 border-t border-[var(--color-term-border)] flex flex-col gap-1.5 font-mono select-none ${className}`}
      data-purpose="media-controller-deck"
    >
      {/* Progress & Frame Scrub Bar */}
      <div className="w-full">
        <div className="flex justify-between text-[10px] text-[var(--color-term-text)] font-mono mb-0.5">
          <span>
            {formatDuration(currentTime)}{' '}
            <span className="text-[var(--color-term-dim)]">/ {formatDuration(duration || 200)}</span>
          </span>
          <span className="text-[var(--color-term-green)]">STREAM BUFFER [85%]</span>
          <span>
            FRM: {currentFrame}/{totalFrames}
          </span>
        </div>
        <div
          onClick={handleScrub}
          className="w-full bg-[var(--color-term-surface)] h-2 relative overflow-hidden border border-[var(--color-term-border)] cursor-pointer"
        >
          {/* Buffer placeholder */}
          <div className="bg-[var(--color-term-border)]/40 h-full w-[85%] absolute inset-0 pointer-events-none" />
          {/* Active progress */}
          <div
            style={{ width: `${progressPct}%` }}
            className="bg-[var(--color-term-green)] h-full relative neon-box-glow pointer-events-none transition-all duration-75"
          />
        </div>
      </div>

      {/* Primary Centered Playback Controls */}
      <div className="flex items-center justify-between px-2 pt-0.5">
        {/* Left: Volume with dB Meter */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--color-term-text)] font-mono">
          <span className="text-[var(--color-term-green)] font-bold">VOL:</span>
          <div
            onClick={handleVolumeClick}
            className="w-16 bg-[var(--color-term-surface)] h-1.5 border border-[var(--color-term-border)] overflow-hidden cursor-pointer"
            title="Click to adjust volume"
          >
            <div
              style={{ width: `${Math.round(volume * 100)}%` }}
              className="bg-[var(--color-term-cyan)] h-full"
            />
          </div>
          <span className="text-[var(--color-term-cyan)] w-10 text-right">{dB}dB</span>
        </div>

        {/* Center: Tactile Button Cluster */}
        <div className="flex items-center justify-center gap-3 select-none">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`text-xs transition-colors ${
              shuffle ? 'text-[var(--color-term-green)] font-bold' : 'text-[var(--color-term-muted)] hover:text-[var(--color-term-green)]'
            }`}
            title={`Shuffle: ${shuffle ? 'ON' : 'OFF'}`}
          >
            ⤮
          </button>

          {/* Prev Track */}
          <button
            onClick={prevTrack}
            className="text-xs text-[var(--color-term-cyan)] hover:text-[var(--color-term-green)] transition-colors font-bold"
            title="Prev Track"
          >
            |◀
          </button>

          {/* Rewind -5s */}
          <button
            onClick={() => seek(Math.max(0, currentTime - 5))}
            className="text-xs text-[var(--color-term-cyan)] hover:text-[var(--color-term-green)] transition-colors font-bold"
            title="Rewind -5s"
          >
            ◄◄
          </button>

          {/* Glowing Play/Pause EXEC Button */}
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full border border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 flex items-center justify-center text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/30 neon-box-glow transition-all font-bold text-xs cursor-pointer"
            title="Play/Pause EXEC"
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>

          {/* Forward +5s */}
          <button
            onClick={() => seek(Math.min(duration, currentTime + 5))}
            className="text-xs text-[var(--color-term-cyan)] hover:text-[var(--color-term-green)] transition-colors font-bold"
            title="Forward +5s"
          >
            ►►
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            className="text-xs text-[var(--color-term-cyan)] hover:text-[var(--color-term-green)] transition-colors font-bold"
            title="Next Track"
          >
            ▶|
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="text-xs text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] transition-colors"
            title="Stop & Reset"
          >
            ■
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`text-xs transition-colors ${
              repeatMode !== 'off'
                ? 'text-[var(--color-term-green)] font-bold'
                : 'text-[var(--color-term-muted)] hover:text-[var(--color-term-green)]'
            }`}
            title={`Repeat Mode: ${repeatMode}`}
          >
            {repeatMode === 'track' ? '↻1' : '↻'}
          </button>
        </div>

        {/* Right: Secondary Media Params */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            onClick={handleCycleSpeed}
            className="px-1.5 py-0.5 border border-[var(--color-term-border)] text-[var(--color-term-cyan)] hover:border-[var(--color-term-green)] hover:text-[var(--color-term-green)] transition-colors"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
          <button
            onClick={handleCycleQuality}
            className="px-1.5 py-0.5 border border-[var(--color-term-border)] text-[var(--color-term-green)] hover:border-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/15 active:scale-95 transition-all cursor-pointer font-bold"
            title={`ASCII Resolution Profile: ${currentQuality} (Click to switch resolution)`}
          >
            {currentQuality}
          </button>
          {onOpenCinema && (
            <button
              onClick={onOpenCinema}
              className="px-1.5 py-0.5 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] hover:border-[var(--color-term-green)] transition-colors"
              title="Toggle Fullscreen Cinema Theater"
            >
              [ ⛶ ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
