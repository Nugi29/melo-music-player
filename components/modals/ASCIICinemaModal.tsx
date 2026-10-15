'use client';

import React, { useEffect } from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import ASCIIVideoPlayer from '../visualizer/ASCIIVideoPlayer';
import { X, Tv, Film, Maximize2, Radio } from 'lucide-react';

interface ASCIICinemaModalProps {
  onClose: () => void;
}

export default function ASCIICinemaModal({ onClose }: ASCIICinemaModalProps) {
  const { currentTrack, isPlaying } = useAudio();

  // Fullscreen toggle helper
  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard shortcut: Esc to close, Space to toggle play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key.toLowerCase() === 'f') {
        toggleBrowserFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 select-none font-mono">
      {/* Outer CRT Chassis Container */}
      <div className="w-full h-full max-w-6xl max-h-[92vh] flex flex-col border-2 border-[var(--color-term-border)] bg-[#010909] shadow-[0_0_40px_rgba(0,255,136,0.18)] relative overflow-hidden">
        {/* Top Monitor Bezel Header */}
        <div className="flex-none flex items-center justify-between px-3 py-2 bg-[#021414] border-b border-[var(--color-term-border)]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-[var(--color-term-green)]">
              <Tv className="w-4 h-4" />
              <span className="font-bold text-xs tracking-wider">
                MELO-OS ASCII HOLO CINEMA
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 border border-[var(--color-term-border)] bg-[#010a0a] text-[var(--color-term-cyan)]">
              CRT MATRIX 60HZ
            </span>
          </div>

          {/* Currently playing video title */}
          <div className="hidden md:flex items-center gap-2 text-xs truncate max-w-md">
            <Film className="w-3.5 h-3.5 text-[var(--color-term-green)] animate-pulse" />
            <span className="text-[var(--color-term-text)] font-semibold truncate">
              {currentTrack?.title || 'Video Stream'}
            </span>
            <span className="text-[var(--color-term-dim)]">―</span>
            <span className="text-[var(--color-term-cyan)] text-[11px] truncate">
              {currentTrack?.artist || 'Unknown'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleBrowserFullscreen}
              title="Fullscreen (F)"
              className="p-1 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)] hover:border-[var(--color-term-cyan)] transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="Exit Cinema (Esc)"
              className="p-1 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-error)] hover:border-[var(--color-term-error)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center CRT Screen */}
        <div className="flex-1 min-h-0 relative bg-black p-1.5 flex flex-col">
          <ASCIIVideoPlayer
            isCinemaMode={true}
            onCloseCinema={onClose}
            className="w-full h-full border-none"
          />
        </div>

        {/* Bottom Hardware Bezel Status Bar */}
        <div className="flex-none px-3 py-1.5 bg-[#010e0e] border-t border-[var(--color-term-border)] flex items-center justify-between text-[10px] text-[var(--color-term-dim)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[var(--color-term-green)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-term-green)] animate-ping" />
              <span>OPTICAL DECODER ONLINE</span>
            </span>
            <span className="hidden sm:inline">SHORTCUTS: [SPACE] PLAY/PAUSE • [F] FULLSCREEN • [ESC] EXIT</span>
          </div>
          <div className="text-[9px] text-[var(--color-term-muted)]">
            FRAME RATE: HARDWARE LOCKED
          </div>
        </div>
      </div>
    </div>
  );
}
