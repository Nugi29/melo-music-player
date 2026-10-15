'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Search, Disc3, Shield, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import { useAudio } from '@/lib/audio/AudioEngine';

interface TopBarProps {
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenShortcuts: () => void;
}

export default function TopBar({
  onOpenSettings,
  onOpenSearch,
  onOpenShortcuts,
}: TopBarProps) {
  const { isPlaying, isAudioEngineReady, loadDemoTracks } = useAudio();
  const [clock, setClock] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setClock(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex-none flex items-center justify-between px-3 py-2 border-b border-[var(--color-term-border)] bg-[#020707] text-xs font-mono select-none tracking-wide">
      {/* Left: Brand & Title */}
      <div className="flex items-center space-x-2">
        <span className="inline-block w-2.5 h-2.5 bg-[var(--color-term-green)] rounded-none neon-green-glow" />
        <span className="font-bold tracking-widest text-[var(--color-term-green)] neon-green-glow text-sm">
          MELO_OS
        </span>
        <span className="text-[var(--color-term-dim)] text-[11px]">v1.0.0</span>
      </div>

      {/* Center: System Status & Real-time Clock */}
      <div className="hidden md:flex items-center space-x-3 text-[11px] text-[var(--color-term-text)]">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying
                ? 'bg-[var(--color-term-green)] animate-pulse'
                : 'bg-[var(--color-term-dim)]'
            }`}
          />
          <span className="text-[var(--color-term-green)]">SYSTEM ONLINE</span>
        </span>
        <span className="text-[var(--color-term-border)]">|</span>
        <span className="text-[var(--color-term-cyan)]">
          {isAudioEngineReady ? 'DSP 64-BIN READY' : 'AUDIO ENGINE READY'}
        </span>
        <span className="text-[var(--color-term-border)]">|</span>
        <span className="text-[var(--color-term-text)]">{clock || '2026-10-13 20:00:00'}</span>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center space-x-2 text-xs">
        {/* Load Demo Tracks Button */}
        <button
          onClick={loadDemoTracks}
          title="Preload cyberpunk demo tracks"
          className="flex items-center gap-1 px-2 py-1 border border-[var(--color-term-border)] text-[var(--color-term-cyan)] hover:border-[var(--color-term-green)] hover:text-[var(--color-term-green)] transition-colors text-[11px]"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">Load Demos</span>
        </button>

        {/* Search Shortcut */}
        <button
          onClick={onOpenSearch}
          title="Search Library (Ctrl+K)"
          className="flex items-center gap-1 px-2 py-1 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)] hover:border-[var(--color-term-cyan)] transition-colors text-[11px]"
        >
          <Search className="w-3 h-3" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden lg:inline text-[9px] px-1 bg-[#011414] text-[var(--color-term-dim)] border border-[var(--color-term-border)]">
            Ctrl+K
          </kbd>
        </button>

        {/* Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          className="p-1 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)] transition-colors"
        >
          <TerminalIcon className="w-3.5 h-3.5" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="System Settings"
          className="p-1 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
