'use client';

import React from 'react';
import { MediaMode } from '../types';
import { Plus, X } from 'lucide-react';

interface TerminalSidebarProps {
  mediaMode: MediaMode;
  onSetMediaMode: (mode: MediaMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFeed: string;
  onSelectFeed: (feed: string) => void;
  onSelectStreamPreset: (presetName: string) => void;
  onOpenAddStream: () => void;
  counts: {
    videos: number;
    liked: number;
    history: number;
    subscriptions: number;
  };
  className?: string;
}

export default function TerminalSidebar({
  mediaMode,
  onSetMediaMode,
  searchQuery,
  onSearchChange,
  activeFeed,
  onSelectFeed,
  onSelectStreamPreset,
  onOpenAddStream,
  counts,
  className = '',
}: TerminalSidebarProps) {
  const streamPresets = [
    { name: 'Cyberpunk Lo-Fi 24/7', tag: '● REC', isLive: true },
    { name: 'Synthwave Live Visuals', tag: '1080p', isLive: false },
    { name: 'Tech Talks & Demos', tag: '24 vids', isLive: false },
    { name: 'Coding Music Videos', tag: '45 vids', isLive: false },
  ];

  return (
    <nav
      className={`border border-[var(--color-term-border)] bg-[var(--color-term-surface)] flex flex-col justify-between text-xs overflow-hidden select-none font-mono ${className}`}
      data-purpose="directory-navigation"
    >
      <div className="p-2 space-y-3 overflow-y-auto">
        {/* Media Mode Switcher */}
        <div>
          <div className="text-[9px] text-[var(--color-term-muted)] uppercase font-bold tracking-widest mb-1 px-1">
            // MEDIA MODE
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <button
              onClick={() => onSetMediaMode('video')}
              className={`px-2 py-1 font-bold text-left flex items-center gap-1.5 cursor-pointer transition-all ${
                mediaMode === 'video'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border border-[var(--color-term-green)] neon-box-glow'
                  : 'bg-[var(--color-term-bg)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)] border border-[var(--color-term-border)] hover:bg-[var(--color-term-surface)]'
              }`}
            >
              <span className={mediaMode === 'video' ? 'text-[var(--color-term-green)]' : 'text-[var(--color-term-dim)]'}>
                {mediaMode === 'video' ? '●' : '○'}
              </span>{' '}
              Video/YT
            </button>
            <button
              onClick={() => onSetMediaMode('audio')}
              className={`px-2 py-1 font-bold text-left flex items-center gap-1.5 cursor-pointer transition-all ${
                mediaMode === 'audio'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border border-[var(--color-term-green)] neon-box-glow'
                  : 'bg-[var(--color-term-bg)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)] border border-[var(--color-term-border)] hover:bg-[var(--color-term-surface)]'
              }`}
            >
              <span className={mediaMode === 'audio' ? 'text-[var(--color-term-green)]' : 'text-[var(--color-term-dim)]'}>
                {mediaMode === 'audio' ? '●' : '○'}
              </span>{' '}
              Audio
            </button>
          </div>
        </div>

        {/* Terminal Search Box */}
        <div data-purpose="search-box">
          <div className="relative flex items-center border border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-2 py-1 focus-within:border-[var(--color-term-green)] transition-colors">
            <span className="text-[var(--color-term-green)] mr-1 text-[10px] font-bold flex-none">$</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="grep / yt-dlp search..."
              className="w-full bg-transparent border-none p-0 text-xs text-[var(--color-term-text)] placeholder-[var(--color-term-muted)] focus:ring-0 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Feeds & Sources Section */}
        <div>
          <div className="text-[10px] text-[var(--color-term-green)] font-bold tracking-wider px-2 uppercase mb-1 flex items-center gap-1">
            <span>◆</span> Video Feeds
          </div>
          <ul className="space-y-0.5 text-[var(--color-term-text)]">
            {/* YouTube Stream Feed */}
            <li
              onClick={() => onSelectFeed('youtube')}
              className={`flex items-center justify-between px-2 py-1 cursor-pointer transition-colors ${
                activeFeed === 'youtube'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border-l-2 border-[var(--color-term-green)] font-semibold'
                  : 'hover:bg-[var(--color-term-border)]/30 hover:text-[var(--color-term-green)]'
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-[10px]">▶</span>
                <span>YouTube ASCII Stream</span>
              </span>
              <span className="text-[9px] px-1 bg-[var(--color-term-border)] text-white font-bold">LIVE</span>
            </li>

            {/* Local Videos */}
            <li
              onClick={() => onSelectFeed('local')}
              className={`flex items-center justify-between px-2 py-0.5 cursor-pointer transition-colors ${
                activeFeed === 'local'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border-l-2 border-[var(--color-term-green)] font-semibold'
                  : 'hover:bg-[var(--color-term-border)]/30 hover:text-[var(--color-term-green)]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--color-term-dim)]">▤</span> Local Videos (/vids/)
              </span>
              <span className="text-[10px] text-[var(--color-term-muted)]">{counts.videos}</span>
            </li>

            {/* Liked Clips */}
            <li
              onClick={() => onSelectFeed('liked')}
              className={`flex items-center justify-between px-2 py-0.5 cursor-pointer transition-colors ${
                activeFeed === 'liked'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border-l-2 border-[var(--color-term-green)] font-semibold'
                  : 'hover:bg-[var(--color-term-border)]/30 hover:text-[var(--color-term-green)]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--color-term-dim)]">♡</span> Liked Clips
              </span>
              <span className="text-[10px] text-[var(--color-term-muted)]">{counts.liked}</span>
            </li>

            {/* Subscriptions */}
            <li
              onClick={() => onSelectFeed('subscriptions')}
              className={`flex items-center justify-between px-2 py-0.5 cursor-pointer transition-colors ${
                activeFeed === 'subscriptions'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border-l-2 border-[var(--color-term-green)] font-semibold'
                  : 'hover:bg-[var(--color-term-border)]/30 hover:text-[var(--color-term-green)]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--color-term-dim)]">⚡</span> Subscriptions
              </span>
              <span className="text-[10px] text-[var(--color-term-muted)]">{counts.subscriptions}</span>
            </li>

            {/* Watch History */}
            <li
              onClick={() => onSelectFeed('history')}
              className={`flex items-center justify-between px-2 py-0.5 cursor-pointer transition-colors ${
                activeFeed === 'history'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border-l-2 border-[var(--color-term-green)] font-semibold'
                  : 'hover:bg-[var(--color-term-border)]/30 hover:text-[var(--color-term-green)]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--color-term-dim)]">◷</span> Watch History
              </span>
              <span className="text-[10px] text-[var(--color-term-muted)]">{counts.history}</span>
            </li>
          </ul>
        </div>

        {/* Video Playlists & Streams */}
        <div>
          <div className="text-[10px] text-[var(--color-term-green)] font-bold tracking-wider px-2 uppercase mb-1 flex items-center gap-1">
            <span>▤</span> Live Streams &amp; Lists
          </div>
          <ul className="space-y-0.5 text-[var(--color-term-text)]">
            {streamPresets.map((preset, idx) => (
              <li
                key={preset.name}
                onClick={() => onSelectStreamPreset(preset.name)}
                className={`flex justify-between px-2 py-0.5 cursor-pointer transition-colors ${
                  idx === 0
                    ? 'bg-[var(--color-term-border)]/40 text-[var(--color-term-cyan)] font-medium'
                    : 'hover:bg-[var(--color-term-border)]/20 hover:text-[var(--color-term-green)]'
                }`}
              >
                <span className="truncate">{preset.name}</span>
                <span className={`text-[9px] ${preset.isLive ? 'text-[var(--color-term-green)] font-bold' : 'text-[var(--color-term-dim)]'}`}>
                  {preset.tag}
                </span>
              </li>
            ))}
            <li
              onClick={onOpenAddStream}
              className="pt-2 px-2 text-[var(--color-term-green)] hover:underline cursor-pointer text-[11px] font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Stream / URL</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Decoder Hardware Telemetry Footer */}
      <div className="p-2 border-t border-[var(--color-term-border)] text-[10px] text-[var(--color-term-muted)] flex items-center justify-between font-mono">
        <span>DECODER: FFMPEG+LIBAV</span>
        <span className="text-[var(--color-term-green)] font-bold neon-green-glow">CUDA-ON</span>
      </div>
    </nav>
  );
}
