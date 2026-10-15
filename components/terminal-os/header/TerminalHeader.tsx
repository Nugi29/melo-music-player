'use client';

import React, { useState, useEffect } from 'react';
import { Settings, HelpCircle, Sparkles, Maximize2 } from 'lucide-react';
import { useAudio } from '@/lib/audio/AudioEngine';

interface TerminalHeaderProps {
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
  onOpenCinema?: () => void;
}

export default function TerminalHeader({
  onOpenSettings,
  onOpenShortcuts,
  onOpenCinema,
}: TerminalHeaderProps) {
  const { isPlaying, loadDemoTracks, currentTrack } = useAudio();
  const [clock, setClock] = useState<string>('2026-10-15 11:45');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setClock(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="flex-none flex items-center justify-between pb-2 border-b border-[var(--color-term-border)] text-xs tracking-wider select-none bg-[var(--color-term-bg)]"
      data-purpose="system-header"
    >
      {/* Brand & Terminal Subtitle */}
      <div className="flex items-center space-x-2 truncate">
        <span className="inline-block w-2.5 h-2.5 bg-[var(--color-term-green)] rounded-none neon-green-glow flex-none" />
        <span className="font-bold tracking-widest text-[var(--color-term-green)] neon-green-glow text-sm">
          MELO_OS
        </span>
        <span className="text-[var(--color-term-dim)] text-[11px]">v1.2.0</span>
        <span className="text-[var(--color-term-muted)] mx-1 font-bold">//</span>
        <span className="text-[var(--color-term-cyan)] font-semibold tracking-wider truncate text-[11px] sm:text-xs">
          MEDIA TERMINAL (AUDIO + ASCII VIDEO / YT-STREAM)
        </span>
      </div>

      {/* System Telemetry & Quick Action Cluster */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] text-[var(--color-term-text)] flex-none">
        <span className="hidden md:flex items-center gap-1 font-mono">
          <span
            className={`text-[9px] text-[var(--color-term-green)] ${
              isPlaying ? 'animate-pulse' : ''
            }`}
          >
            ●
          </span>{' '}
          SYSTEM ONLINE
        </span>
        <span className="hidden md:inline text-[var(--color-term-dim)]">|</span>
        <span className="hidden lg:inline text-[var(--color-term-cyan)] font-mono">NET: 1Gbps</span>
        <span className="hidden lg:inline text-[var(--color-term-dim)]">|</span>
        <span className="hidden sm:inline text-[var(--color-term-green)] font-mono">
          {currentTrack?.youtubeId ? 'YT_BUFFER: OK' : 'BUFFER: OK'}
        </span>
        <span className="hidden sm:inline text-[var(--color-term-dim)]">|</span>
        <span className="text-[var(--color-term-text)] font-mono">{clock}</span>
        <span className="text-[var(--color-term-dim)]">|</span>
        <span className="hidden sm:inline text-[var(--color-term-green)] font-mono">melo@terminal</span>

        {/* Action icons */}
        <div className="flex items-center gap-1 pl-1 border-l border-[var(--color-term-border)]">
          <button
            onClick={loadDemoTracks}
            title="Load featured cyberpunk demo streams"
            className="p-1 text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          {onOpenCinema && (
            <button
              onClick={onOpenCinema}
              title="Fullscreen ASCII Cinema Theater"
              className="p-1 text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)] transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              title="Terminal Hotkeys & Shortcuts (?)"
              className="p-1 text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)] transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="System Config & Themes"
              className="p-1 text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
