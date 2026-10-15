'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { formatDuration } from '@/lib/utils/formatters';
import { getRandomAsciiArt } from '@/lib/utils/asciiArt';
import ASCIIVisualizer from '@/components/visualizer/ASCIIVisualizer';
import ASCIIVideoPlayer from '@/components/visualizer/ASCIIVideoPlayer';
import { VisualizerMode } from '@/types/settings';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Music,
  Radio,
  Film,
  Maximize2,
  Tv,
} from 'lucide-react';

interface NowPlayingPanelProps {
  visualizerMode: VisualizerMode;
  onVisualizerModeChange: (mode: VisualizerMode) => void;
  onOpenCinema?: () => void;
  className?: string;
}

// Real-Time Graphic Spectrum Analyzer Widget (16 animated responsive frequency bars)
function GraphicSpectrumBars() {
  const { isPlaying, getAnalyserData } = useAudio();
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));
  const timeDataRef = useRef<Uint8Array>(new Uint8Array(64));
  const smoothRef = useRef<number[]>(Array.from({ length: 16 }, () => 10));

  useEffect(() => {
    let animId: number;

    const update = (now: number) => {
      getAnalyserData(freqDataRef.current, timeDataRef.current);
      const freq = freqDataRef.current;
      const smooth = smoothRef.current;

      let sum = 0;
      for (let i = 0; i < freq.length; i++) sum += freq[i];
      const hasReal = sum > 0;

      for (let i = 0; i < 16; i++) {
        const el = barsRef.current[i];
        if (!el) continue;

        let targetPct = 8;
        if (isPlaying) {
          if (hasReal) {
            const binIdx = Math.min(63, Math.floor(Math.pow(i / 16, 1.3) * 44));
            const boost = 1 + (i / 16) * 1.8;
            const val = Math.min(255, freq[binIdx] * boost);
            targetPct = Math.max(8, Math.min(100, Math.round((val / 255) * 100)));
          } else {
            // Procedural rhythmic bounce fallback
            const phase = now * 0.007 + i * 0.35;
            targetPct = Math.round(15 + (Math.sin(phase) * 0.5 + 0.5) * 75);
          }
        }

        // Smooth interpolation
        const prev = smooth[i] || 8;
        const next =
          targetPct > prev ? prev + (targetPct - prev) * 0.6 : prev - (prev - targetPct) * 0.25;
        smooth[i] = next;

        el.style.height = `${Math.max(6, Math.round(next))}%`;
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, getAnalyserData]);

  return (
    <div className="flex items-end justify-between h-9 px-1 gap-[2px] bg-[#000808] border border-[var(--color-term-border)] p-1">
      {Array.from({ length: 16 }).map((_, idx) => {
        const isGreen = idx % 3 === 2 || idx === 7 || idx === 13;
        return (
          <span
            key={idx}
            ref={(el) => {
              barsRef.current[idx] = el;
            }}
            style={{ height: '10%' }}
            className={`w-1.5 ${
              isGreen
                ? 'bg-[var(--color-term-green)] shadow-[0_0_4px_rgba(0,255,136,0.6)]'
                : 'bg-[var(--color-term-cyan)] shadow-[0_0_4px_rgba(0,243,255,0.6)]'
            }`}
          />
        );
      })}
    </div>
  );
}

export default function NowPlayingPanel({
  visualizerMode,
  onVisualizerModeChange,
  onOpenCinema,
  className = '',
}: NowPlayingPanelProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isLoadingTrack,
    isVideo,
  } = useAudio();

  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekPreviewTime, setSeekPreviewTime] = useState<number>(0);
  const [videoDisplayMode, setVideoDisplayMode] = useState<'ascii-video' | 'spectrum'>('ascii-video');

  // Handle Seek Bar Click / Drag
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSeekPreviewTime(val);
    seek(val);
  };

  const currentDisplayTime = isSeeking ? seekPreviewTime : currentTime;
  const progressPercent = duration > 0 ? (currentDisplayTime / duration) * 100 : 0;

  return (
    <aside
      className={`border border-[var(--color-term-border)] bg-[var(--color-term-surface)] flex flex-col gap-2 p-3 font-mono text-xs select-none ${className}`}
    >
      {/* 1. Track Cover & Visualizer Section */}
      <div className="border border-[var(--color-term-border)] bg-[#020909] p-2.5 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          {/* Artwork Thumbnail or ASCII Art */}
          <div className="shrink-0 w-24 h-24 border border-[var(--color-term-border)] bg-[#010505] overflow-hidden flex items-center justify-center relative">
            {currentTrack?.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentTrack.pictureUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover filter contrast-125"
              />
            ) : (
              <pre className="text-[6px] leading-[6.5px] font-mono text-[var(--color-term-green)] select-none tracking-tighter m-0 p-1">
                {getRandomAsciiArt(currentTrack?.id || 'default')}
              </pre>
            )}
            {isPlaying && (
              <span className="absolute bottom-1 right-1 w-2 h-2 bg-[var(--color-term-green)] rounded-full animate-ping" />
            )}
            {currentTrack?.isVideo && (
              <span className="absolute top-1 left-1 px-1 py-0.5 bg-[var(--color-term-green)] text-black text-[8px] font-bold tracking-wider flex items-center gap-0.5">
                <Film className="w-2.5 h-2.5" />
                <span>VIDEO</span>
              </span>
            )}
          </div>

          {/* Track Metadata */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden text-right">
            <div>
              <div className="flex items-center justify-end gap-1.5 text-[10px] text-[var(--color-term-green)] font-bold mb-0.5">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>NOW PLAYING</span>
              </div>
              <h3
                className="text-sm font-bold text-[var(--color-term-cyan)] truncate leading-tight neon-text-glow"
                title={currentTrack?.title || 'No Track Loaded'}
              >
                {currentTrack?.title || 'System Idle'}
              </h3>
              <p
                className="text-xs text-[var(--color-term-text)] truncate mt-0.5"
                title={currentTrack?.artist}
              >
                {currentTrack?.artist || 'Unknown Artist'}
              </p>
              <p
                className="text-[10px] text-[var(--color-term-dim)] truncate mt-0.5"
                title={currentTrack?.album}
              >
                {currentTrack?.album || 'Terminal Audio Library'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <span className="text-[9px] px-1.5 py-0.5 border border-[var(--color-term-border)] text-[var(--color-term-muted)]">
                {currentTrack?.genre || 'CHILL'}
              </span>
              <button
                onClick={() => toggleLike()}
                disabled={!currentTrack}
                title={currentTrack?.isLiked ? 'Unlike' : 'Favorite'}
                className={`p-1 border transition-colors ${
                  currentTrack?.isLiked
                    ? 'border-[var(--color-term-error)] text-[var(--color-term-error)] bg-[var(--color-term-error)]/10'
                    : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-error)]'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${currentTrack?.isLiked ? 'fill-current' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Graphic Spectrum Analyzer Widget */}
        <div className="mt-1 pt-1.5 border-t border-[var(--color-term-border)]">
          <div className="text-[10px] text-[var(--color-term-dim)] mb-1 flex items-center justify-between">
            <span>DSP SPECTRUM ANALYZER</span>
            <span className="text-[9px] text-[var(--color-term-green)]">{isPlaying ? 'ACTIVE 60FPS' : 'IDLE'}</span>
          </div>
          <GraphicSpectrumBars />
        </div>

        {/* Real-time sound-reactive ASCII Visualizer or Live ASCII Video Player */}
        <div className="pt-2 border-t border-[var(--color-term-border)]">
          {currentTrack?.isVideo ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-[var(--color-term-green)] font-bold">
                  <Film className="w-3 h-3 animate-pulse" />
                  <span>ASCII VIDEO PLAYBACK</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setVideoDisplayMode((prev) =>
                        prev === 'ascii-video' ? 'spectrum' : 'ascii-video'
                      )
                    }
                    className="px-1.5 py-0.5 border border-[var(--color-term-border)] hover:border-[var(--color-term-cyan)] text-[var(--color-term-cyan)] text-[9px]"
                  >
                    {videoDisplayMode === 'ascii-video' ? 'EQ VIEW' : 'ASCII VIEW'}
                  </button>
                  {onOpenCinema && (
                    <button
                      onClick={onOpenCinema}
                      className="px-1.5 py-0.5 border border-[var(--color-term-green)] text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/15 font-bold text-[9px] flex items-center gap-1"
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                      <span>CINEMA</span>
                    </button>
                  )}
                </div>
              </div>

              {videoDisplayMode === 'ascii-video' ? (
                <div className="h-44 w-full">
                  <ASCIIVideoPlayer onOpenCinema={onOpenCinema} />
                </div>
              ) : (
                <ASCIIVisualizer
                  mode={visualizerMode}
                  onModeChange={onVisualizerModeChange}
                  height={8}
                  width={34}
                />
              )}
            </div>
          ) : (
            <ASCIIVisualizer
              mode={visualizerMode}
              onModeChange={onVisualizerModeChange}
              height={8}
              width={34}
            />
          )}
        </div>
      </div>

      {/* 2. Interactive Audio Progress & Scrubbing Bar */}
      <div className="border border-[var(--color-term-border)] bg-[#020909] p-2.5 space-y-1.5">
        <div className="relative group flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentDisplayTime}
            onChange={handleSeekChange}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            onTouchStart={() => setIsSeeking(true)}
            onTouchEnd={() => setIsSeeking(false)}
            className="w-full h-2 bg-[#001818] appearance-none cursor-pointer rounded-none border border-[var(--color-term-border)] accent-[var(--color-term-green)]"
            title="Seek playback"
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-[var(--color-term-muted)] font-mono">
          <span className="text-[var(--color-term-cyan)] font-semibold">
            {formatDuration(currentDisplayTime)}
          </span>
          <span className="text-[9px] text-[var(--color-term-dim)]">
            {progressPercent.toFixed(0)}%
          </span>
          <span>{formatDuration(duration || 0)}</span>
        </div>

        {/* 3. Transport Playback Controls */}
        <div className="flex items-center justify-between pt-1 select-none">
          {/* Shuffle Button */}
          <button
            onClick={toggleShuffle}
            title={`Shuffle: ${shuffle ? 'ON' : 'OFF'}`}
            className={`p-1.5 rounded transition-colors ${
              shuffle
                ? 'text-[var(--color-term-green)] bg-[var(--color-term-green)]/15 border border-[var(--color-term-green)]'
                : 'text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={prevTrack}
            title="Previous Track"
            className="p-1.5 text-[var(--color-term-cyan)] hover:text-[var(--color-term-green)] transition-colors active:scale-95"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoadingTrack}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 rounded-full border border-[var(--color-term-green)] flex items-center justify-center text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/15 neon-box-glow active:scale-90 transition-all"
          >
            {isLoadingTrack ? (
              <span className="w-4 h-4 border-2 border-[var(--color-term-green)] border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            title="Next Track"
            className="p-1.5 text-[var(--color-term-cyan)] hover:text-[var(--color-term-green)] transition-colors active:scale-95"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Repeat Mode Button */}
          <button
            onClick={toggleRepeat}
            title={`Repeat: ${repeatMode.toUpperCase()}`}
            className={`p-1.5 rounded transition-colors ${
              repeatMode !== 'off'
                ? 'text-[var(--color-term-green)] bg-[var(--color-term-green)]/15 border border-[var(--color-term-green)]'
                : 'text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
            }`}
          >
            {repeatMode === 'track' ? (
              <Repeat1 className="w-3.5 h-3.5" />
            ) : (
              <Repeat className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Volume Slider & Mute */}
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-term-border)]">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-[var(--color-term-error)]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-[#001818] appearance-none cursor-pointer rounded-none border border-[var(--color-term-border)] accent-[var(--color-term-green)]"
            title="Adjust volume"
          />
          <span className="text-[10px] text-[var(--color-term-dim)] w-7 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>

      {/* 4. Terminal Quick Reference Cheat Sheet */}
      <div className="flex-1 border border-[var(--color-term-border)] bg-[#010808] p-2.5 overflow-hidden flex flex-col justify-between">
        <div className="text-[11px] font-bold text-[var(--color-term-green)] flex items-center gap-1.5 pb-1 border-b border-[var(--color-term-border)] mb-1.5">
          <Music className="w-3.5 h-3.5" />
          <span>TERMINAL SHORTCUTS</span>
        </div>
        <div className="space-y-1 text-[10px] text-[var(--color-term-text)] font-mono">
          <div className="flex justify-between">
            <span className="text-[var(--color-term-green)]">play &lt;num&gt;</span>
            <span className="text-[var(--color-term-dim)]">Play by index</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-term-green)]">search &lt;q&gt;</span>
            <span className="text-[var(--color-term-dim)]">Filter tracks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-term-green)]">volume &lt;n&gt;</span>
            <span className="text-[var(--color-term-dim)]">Set volume %</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-term-green)]">visualizer</span>
            <span className="text-[var(--color-term-dim)]">Change mode</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-term-green)]">Space</span>
            <span className="text-[var(--color-term-dim)]">Play / Pause</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
