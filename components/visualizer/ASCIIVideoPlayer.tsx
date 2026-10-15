'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { formatDuration } from '@/lib/utils/formatters';
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Repeat,
  Tv,
  Eye,
  Sliders,
  Palette,
  Sparkles,
  Layers,
  Radio,
} from 'lucide-react';

export type AsciiCharSet = 'retro' | 'matrix' | 'blocks' | 'detailed' | 'cyber';
export type AsciiColorMode = 'truecolor' | 'theme' | 'matrix' | 'invert';
export type AsciiResolution = 'retro' | 'standard' | 'high' | 'ultra' | 'pro';
export type AsciiViewMode = 'ascii' | 'pip' | 'split';

interface ASCIIVideoPlayerProps {
  className?: string;
  isCinemaMode?: boolean;
  onCloseCinema?: () => void;
  onOpenCinema?: () => void;
  forcedWidth?: number;
  forcedHeight?: number;
}

const CHAR_SETS: Record<AsciiCharSet, string> = {
  retro: ' .:-=+*#%@',
  matrix: ' 01ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ',
  blocks: ' ░▒▓█',
  detailed: " .'\\`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  cyber: ' /\\|><{}[]()#*+=-_~',
};

const RESOLUTION_COLS: Record<AsciiResolution, { compact: number; cinema: number }> = {
  retro: { compact: 40, cinema: 64 },
  standard: { compact: 60, cinema: 96 },
  high: { compact: 84, cinema: 130 },
  ultra: { compact: 104, cinema: 170 },
  pro: { compact: 136, cinema: 220 },
};

export default function ASCIIVideoPlayer({
  className = '',
  isCinemaMode = false,
  onCloseCinema,
  onOpenCinema,
}: ASCIIVideoPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    mediaElement,
    isVideo,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    repeatMode,
    toggleRepeat,
    getAnalyserData,
  } = useAudio();

  // Settings - default to cyber, truecolor, ultra, and pulse off
  const [charSet, setCharSet] = useState<AsciiCharSet>('cyber');
  const [colorMode, setColorMode] = useState<AsciiColorMode>('truecolor');
  const [resolution, setResolution] = useState<AsciiResolution>('ultra');
  const [viewMode, setViewMode] = useState<AsciiViewMode>('ascii');
  const [isAudioReactive, setIsAudioReactive] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(30);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [ytViewMode, setYtViewMode] = useState<'video' | 'matrix'>('video');

  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Sync play/pause with YouTube iframe
  useEffect(() => {
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      const cmd = isPlaying ? 'playVideo' : 'pauseVideo';
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: cmd, args: [] }),
        '*'
      );
    }
  }, [isPlaying]);

  // Sync volume & mute with YouTube iframe
  useEffect(() => {
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }),
        '*'
      );
      if (isMuted) {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'mute', args: [] }),
          '*'
        );
      } else {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
          '*'
        );
      }
    }
  }, [volume, isMuted]);

  // Audio frequency data
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));
  const timeDataRef = useRef<Uint8Array>(new Uint8Array(64));

  // FPS calculation
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  // Current characters string
  const chars = useMemo(() => CHAR_SETS[charSet] || CHAR_SETS.retro, [charSet]);

  // Main ASCII Render Loop
  useEffect(() => {
    let animId: number;
    let isCancelled = false;

    // Initialize offscreen canvas
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

    const renderFrame = (now: number) => {
      if (isCancelled) return;

      const video = mediaElement;
      const canvas = canvasRef.current;
      const container = containerRef.current;

      if (!canvas || !container || !offCtx) {
        animId = requestAnimationFrame(renderFrame);
        return;
      }

      // Check if video is ready to supply frames
      const hasVideo = Boolean(
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        (!video.paused || video.currentTime > 0)
      );

      // Compute FPS
      frameCountRef.current++;
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      // Read audio energy for pulse reaction
      let audioPulse = 0;
      if (isAudioReactive && isPlaying) {
        getAnalyserData(freqDataRef.current, timeDataRef.current);
        const freq = freqDataRef.current;
        let bassSum = 0;
        for (let i = 0; i < 8; i++) bassSum += freq[i];
        audioPulse = bassSum / (8 * 255); // 0 to 1
      }

      // Determine dimensions
      const containerWidth = container.clientWidth || (isCinemaMode ? 900 : 380);
      const containerHeight = container.clientHeight || (isCinemaMode ? 500 : 200);

      const targetCols = isCinemaMode
        ? RESOLUTION_COLS[resolution].cinema
        : RESOLUTION_COLS[resolution].compact;

      // Aspect ratio of font (monospace character width / height ≈ 0.55)
      const fontAspect = 0.55;
      const videoAspect =
        hasVideo && video && video.videoWidth > 0 ? video.videoWidth / video.videoHeight : 16 / 9;

      // Calculate rows to preserve exact video aspect ratio
      const targetRows = Math.max(12, Math.round((targetCols / videoAspect) * fontAspect));

      // Offscreen canvas downsamples the video frame to targetCols x targetRows
      offscreen.width = targetCols;
      offscreen.height = targetRows;

      // Compute font size to fit container cleanly
      const charWidth = containerWidth / targetCols;
      const charHeight = containerHeight / targetRows;
      const fontSize = Math.max(7, Math.floor(charHeight));

      // Canvas pixel dimensions matching container
      if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
        canvas.width = containerWidth;
        canvas.height = containerHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(renderFrame);
        return;
      }

      // Clear Canvas
      ctx.fillStyle = colorMode === 'invert' ? '#D5FFE8' : '#010808';
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      if (!hasVideo || !video) {
        // Render rich cyberpunk ASCII Holographic Matrix
        ctx.fillStyle = '#00FF88';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isPlaying) {
          getAnalyserData(freqDataRef.current, timeDataRef.current);
          const freq = freqDataRef.current;
          const rows = Math.min(26, Math.floor(containerHeight / 16));
          const cols = Math.min(52, Math.floor(containerWidth / 12));
          const cellW = containerWidth / cols;
          const cellH = containerHeight / rows;

          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const freqIdx = Math.floor((c / cols) * 32);
              const energy = freq[freqIdx] / 255;
              const seed = Math.sin(now * 0.003 + r * 0.7 + c * 0.3) * 0.5 + 0.5;
              if (seed > 0.45) {
                const charPick = chars[Math.floor(seed * chars.length) % chars.length];
                const alpha = Math.min(1, seed * 0.7 + energy * 0.5);
                ctx.fillStyle =
                  colorMode === 'truecolor'
                    ? `rgba(0, 255, 170, ${alpha})`
                    : colorMode === 'matrix'
                    ? `rgba(0, 240, 255, ${alpha})`
                    : `rgba(0, 255, 136, ${alpha})`;
                ctx.fillText(charPick, c * cellW + cellW / 2, r * cellH + cellH / 2);
              }
            }
          }

          // Center HUD telemetry banner
          const hudW = Math.min(360, containerWidth - 20);
          ctx.fillStyle = 'rgba(0, 8, 8, 0.9)';
          ctx.fillRect(containerWidth / 2 - hudW / 2, containerHeight / 2 - 28, hudW, 56);
          ctx.strokeStyle = '#00FF88';
          ctx.lineWidth = 1;
          ctx.strokeRect(containerWidth / 2 - hudW / 2, containerHeight / 2 - 28, hudW, 56);

          ctx.fillStyle = '#00F3FF';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(
            currentTrack?.youtubeId ? '[ YOUTUBE ASCII MATRIX ACTIVE ]' : '[ ASCII VIDEO ENGINE STREAMING ]',
            containerWidth / 2,
            containerHeight / 2 - 10
          );
          ctx.fillStyle = '#E0FFF0';
          ctx.font = '10px monospace';
          const titleStr = currentTrack?.title || 'PLAYBACK IN PROGRESS';
          ctx.fillText(
            titleStr.length > 34 ? titleStr.slice(0, 34) + '...' : titleStr,
            containerWidth / 2,
            containerHeight / 2 + 10
          );
        } else {
          ctx.fillText('[ STANDBY // READY FOR PLAYBACK ]', containerWidth / 2, containerHeight / 2);
        }

        animId = requestAnimationFrame(renderFrame);
        return;
      }

      // Draw current video frame to offscreen downsampled canvas
      offCtx.drawImage(video, 0, 0, targetCols, targetRows);
      const imgData = offCtx.getImageData(0, 0, targetCols, targetRows);
      const data = imgData.data;

      // Prepare text rendering
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const numChars = chars.length;
      const pulseMultiplier = 1 + audioPulse * 0.25;

      // Render ASCII Grid
      for (let r = 0; r < targetRows; r++) {
        const y = r * charHeight;
        for (let c = 0; c < targetCols; c++) {
          const x = c * charWidth;
          const idx = (r * targetCols + c) * 4;

          const red = data[idx];
          const green = data[idx + 1];
          const blue = data[idx + 2];

          // Perceptual luminance formula
          let brightness = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
          brightness = Math.min(1, brightness * pulseMultiplier);

          if (brightness < 0.04) continue; // Skip near black for performance

          // Pick character
          const charIdx = Math.min(numChars - 1, Math.floor(brightness * numChars));
          const ch = chars[charIdx];

          // Determine color
          switch (colorMode) {
            case 'truecolor': {
              const boost = 1 + audioPulse * 0.2;
              const rBoost = Math.min(255, Math.round(red * boost));
              const gBoost = Math.min(255, Math.round(green * boost));
              const bBoost = Math.min(255, Math.round(blue * boost));
              ctx.fillStyle = `rgb(${rBoost},${gBoost},${bBoost})`;
              break;
            }
            case 'theme': {
              // Phosphor glow matching app theme
              const alpha = Math.min(1, brightness * (0.8 + audioPulse * 0.3));
              ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
              break;
            }
            case 'matrix': {
              // Neon green matrix look
              const alpha = Math.min(1, brightness * 1.1);
              ctx.fillStyle = `rgba(0, 243, 255, ${alpha})`;
              break;
            }
            case 'invert': {
              ctx.fillStyle = `rgba(1, 10, 10, ${brightness})`;
              break;
            }
          }

          ctx.fillText(ch, x, y);
        }
      }

      // Sync PIP Video if viewMode === 'pip'
      if (viewMode === 'pip' && pipVideoRef.current && video.src) {
        if (pipVideoRef.current.src !== video.src) {
          pipVideoRef.current.src = video.src;
        }
        if (Math.abs(pipVideoRef.current.currentTime - video.currentTime) > 0.3) {
          pipVideoRef.current.currentTime = video.currentTime;
        }
        if (video.paused && !pipVideoRef.current.paused) {
          pipVideoRef.current.pause();
        } else if (!video.paused && pipVideoRef.current.paused) {
          pipVideoRef.current.play().catch(() => {});
        }
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animId);
    };
  }, [
    mediaElement,
    chars,
    colorMode,
    resolution,
    viewMode,
    isAudioReactive,
    isCinemaMode,
    isPlaying,
    getAnalyserData,
  ]);

  // Handle Seek scrubbing
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden font-mono select-none flex flex-col bg-[#010808] border border-[var(--color-term-border)] ${
        isCinemaMode ? 'w-full h-full' : 'w-full h-full min-h-[160px]'
      } ${className}`}
    >
      {/* Top ASCII Telemetry & Stream Status Bar */}
      <div className="flex-none flex items-center justify-between px-2.5 py-1 bg-[#021010] border-b border-[var(--color-term-border)] text-[10px] text-[var(--color-term-green)]">
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-[var(--color-term-green)] animate-pulse" />
          <span className="font-bold tracking-wider">ASCII VIDEO ENGINE</span>
          <span className="text-[var(--color-term-cyan)] px-1 bg-[#011e1e] border border-[var(--color-term-border)]">
            {fps} FPS
          </span>
          {currentTrack?.videoWidth && (
            <span className="hidden sm:inline text-[var(--color-term-dim)]">
              {currentTrack.videoWidth}x{currentTrack.videoHeight}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* YouTube View Switcher (CRT Video vs Cyber Matrix) */}
          {currentTrack?.youtubeId && (
            <button
              onClick={() => setYtViewMode((prev) => (prev === 'video' ? 'matrix' : 'video'))}
              title="Switch between CRT Video display and Cyber ASCII Matrix"
              className={`px-1.5 py-0.5 border text-[9px] font-bold transition-all flex items-center gap-1 ${
                ytViewMode === 'video'
                  ? 'border-[var(--color-term-cyan)] text-[var(--color-term-cyan)] bg-[var(--color-term-cyan)]/15'
                  : 'border-[var(--color-term-green)] text-[var(--color-term-green)] bg-[var(--color-term-green)]/15'
              }`}
            >
              <Tv className="w-2.5 h-2.5" />
              <span>{ytViewMode === 'video' ? 'CRT VIDEO' : 'ASCII MATRIX'}</span>
            </button>
          )}

          {/* Quick Cinema Toggle */}
          {!isCinemaMode && onOpenCinema && (
            <button
              onClick={onOpenCinema}
              title="Expand to Full ASCII Cinema Theater"
              className="px-1.5 py-0.5 border border-[var(--color-term-green)] text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/15 flex items-center gap-1 text-[9px] font-bold transition-all"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>CINEMA</span>
            </button>
          )}

          {isCinemaMode && onCloseCinema && (
            <button
              onClick={onCloseCinema}
              title="Close Cinema Theater"
              className="px-1.5 py-0.5 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-error)] hover:border-[var(--color-term-error)] flex items-center gap-1 text-[9px] transition-colors"
            >
              <Minimize2 className="w-2.5 h-2.5" />
              <span>EXIT</span>
            </button>
          )}
        </div>
      </div>

      {/* Main ASCII / Video Viewport */}
      <div className="flex-1 relative w-full h-full min-h-0 bg-black flex items-center justify-center overflow-hidden">
        {/* If YouTube video is active and in CRT Video mode, render embedded YouTube player inside CRT bezel */}
        {currentTrack?.youtubeId && ytViewMode === 'video' && viewMode !== 'pip' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <iframe
              ref={ytIframeRef}
              src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
              title={currentTrack.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-none"
            />
            {/* CRT overlay over iframe */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.25)_100%)]" />
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain filter contrast-125"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-70" />

        {/* Floating Picture-In-Picture */}
        {viewMode === 'pip' && (
          <div className="absolute bottom-3 right-3 w-44 h-28 border-2 border-[var(--color-term-cyan)] bg-black shadow-[0_0_12px_rgba(0,217,255,0.4)] z-30 overflow-hidden">
            <div className="absolute top-0 inset-x-0 bg-black/80 px-1 py-0.5 text-[8px] text-[var(--color-term-cyan)] font-bold flex justify-between z-10">
              <span>{currentTrack?.youtubeId ? 'YOUTUBE PIP' : 'RAW VIDEO PIP'}</span>
              <button
                onClick={() => setViewMode('ascii')}
                className="text-[var(--color-term-muted)] hover:text-white"
              >
                ✕
              </button>
            </div>
            {currentTrack?.youtubeId ? (
              <iframe
                ref={ytIframeRef}
                src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1`}
                title={currentTrack.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full pt-3 border-none"
              />
            ) : (
              <video
                ref={pipVideoRef}
                muted
                playsInline
                className="w-full h-full object-cover pt-3"
              />
            )}
          </div>
        )}
      </div>

      {/* Settings & Transport Controls Toolbar */}
      <div className="flex-none p-2 bg-[#020b0b] border-t border-[var(--color-term-border)] flex flex-col gap-1.5 text-xs">
        {/* Cinema Advanced Toolbar */}
        {isCinemaMode && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#002828] text-[10px]">
            {/* Character Set Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--color-term-dim)] font-semibold">CHARSET:</span>
              {(['retro', 'matrix', 'blocks', 'detailed', 'cyber'] as AsciiCharSet[]).map((cs) => (
                <button
                  key={cs}
                  onClick={() => setCharSet(cs)}
                  className={`px-1.5 py-0.5 border text-[9px] uppercase transition-colors ${
                    charSet === cs
                      ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold'
                      : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
                  }`}
                >
                  {cs}
                </button>
              ))}
            </div>

            {/* Color Mode Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--color-term-dim)] font-semibold">PALETTE:</span>
              {(['truecolor', 'theme', 'matrix', 'invert'] as AsciiColorMode[]).map((cm) => (
                <button
                  key={cm}
                  onClick={() => setColorMode(cm)}
                  className={`px-1.5 py-0.5 border text-[9px] uppercase transition-colors ${
                    colorMode === cm
                      ? 'border-[var(--color-term-cyan)] bg-[var(--color-term-cyan)]/15 text-[var(--color-term-cyan)] font-bold'
                      : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
                  }`}
                >
                  {cm}
                </button>
              ))}
            </div>

            {/* Resolution Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--color-term-dim)] font-semibold">DENSITY:</span>
              {(['retro', 'standard', 'high', 'ultra', 'pro'] as AsciiResolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`px-1.5 py-0.5 border text-[9px] uppercase transition-colors cursor-pointer ${
                    resolution === res
                      ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold'
                      : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
                  }`}
                  title={
                    res === 'pro'
                      ? 'PRO DENSITY: Ultra-fine 220-column Holo Cinema Matrix'
                      : `${res} density profile`
                  }
                >
                  {res === 'pro' ? 'PRO DENSITY' : res}
                </button>
              ))}
            </div>

            {/* Audio Reactive & PIP Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAudioReactive((prev) => !prev)}
                className={`px-1.5 py-0.5 border text-[9px] flex items-center gap-1 transition-colors ${
                  isAudioReactive
                    ? 'border-[var(--color-term-green)] text-[var(--color-term-green)] bg-[var(--color-term-green)]/10 font-bold'
                    : 'border-[var(--color-term-border)] text-[var(--color-term-dim)]'
                }`}
                title="ASCII pulses and flares to video bass audio"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>PULSE {isAudioReactive ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setViewMode((prev) => (prev === 'pip' ? 'ascii' : 'pip'))}
                className={`px-1.5 py-0.5 border text-[9px] flex items-center gap-1 transition-colors ${
                  viewMode === 'pip'
                    ? 'border-[var(--color-term-cyan)] text-[var(--color-term-cyan)] bg-[var(--color-term-cyan)]/15 font-bold'
                    : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-white'
                }`}
                title="Toggle Picture-in-Picture Raw Video Preview"
              >
                <Tv className="w-2.5 h-2.5" />
                <span>PIP PREVIEW</span>
              </button>
            </div>
          </div>
        )}

        {/* Video Scrubber Progress */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-[#001818] appearance-none cursor-pointer border border-[var(--color-term-border)] accent-[var(--color-term-green)]"
          />
          <div className="text-[10px] text-[var(--color-term-muted)] font-mono whitespace-nowrap">
            <span className="text-[var(--color-term-cyan)] font-bold">{formatDuration(currentTime)}</span>
            <span className="text-[var(--color-term-dim)]"> / </span>
            <span>{formatDuration(duration || 0)}</span>
          </div>
        </div>

        {/* Compact Quick Options (when not in full cinema) */}
        {!isCinemaMode && (
          <div className="flex items-center justify-between text-[10px] text-[var(--color-term-dim)] pt-0.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setColorMode((prev) =>
                    prev === 'truecolor' ? 'theme' : prev === 'theme' ? 'matrix' : 'truecolor'
                  )
                }
                className="px-1.5 py-0.5 border border-[var(--color-term-border)] hover:border-[var(--color-term-cyan)] text-[var(--color-term-cyan)] text-[9px] uppercase"
              >
                PALETTE: {colorMode}
              </button>
              <button
                onClick={() =>
                  setCharSet((prev) =>
                    prev === 'retro' ? 'matrix' : prev === 'matrix' ? 'blocks' : 'retro'
                  )
                }
                className="px-1.5 py-0.5 border border-[var(--color-term-border)] hover:border-[var(--color-term-green)] text-[var(--color-term-green)] text-[9px] uppercase"
              >
                CHARS: {charSet}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={togglePlay}
                className="p-1 border border-[var(--color-term-green)] text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/15 transition-colors"
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              </button>
              <button
                onClick={toggleMute}
                className="p-1 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)] transition-colors"
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
