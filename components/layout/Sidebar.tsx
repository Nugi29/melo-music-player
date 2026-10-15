'use client';

import React from 'react';
import { ActiveSection } from '@/types/music';
import { Playlist } from '@/types/playlist';
import {
  Folder,
  Heart,
  Clock,
  TrendingUp,
  ListMusic,
  Plus,
  Upload,
  Layers,
  Music2,
  FolderTree,
  Film,
} from 'lucide-react';

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection, subParam?: string) => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
  playlists: Playlist[];
  genres: string[];
  totalTracksCount: number;
  likedTracksCount: number;
  recentTracksCount: number;
  videoTracksCount?: number;
  onOpenImport: () => void;
  onOpenCreatePlaylist: () => void;
  className?: string;
}

export default function Sidebar({
  activeSection,
  onSelectSection,
  selectedGenre,
  onSelectGenre,
  selectedPlaylistId,
  onSelectPlaylist,
  playlists,
  genres,
  totalTracksCount,
  likedTracksCount,
  recentTracksCount,
  videoTracksCount = 0,
  onOpenImport,
  onOpenCreatePlaylist,
  className = '',
}: SidebarProps) {
  return (
    <nav
      className={`border border-[var(--color-term-border)] bg-[var(--color-term-surface)] flex flex-col justify-between font-mono text-xs select-none ${className}`}
    >
      <div className="p-2 space-y-4 overflow-y-auto">
        {/* Quick Action: Import Music & Videos */}
        <button
          onClick={onOpenImport}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-[var(--color-term-green)] bg-[var(--color-term-green)]/10 text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/20 transition-all font-bold text-xs shadow-[0_0_8px_rgba(0,255,136,0.15)]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>IMPORT SONGS & VIDEOS</span>
        </button>

        {/* Primary Library Navigation */}
        <div>
          <div className="text-[10px] text-[var(--color-term-dim)] font-bold tracking-wider px-2 uppercase mb-1 flex items-center gap-1">
            <span>◆</span> ROOT DIRECTORY
          </div>
          <ul className="space-y-0.5 text-[var(--color-term-text)]">
            {/* All Tracks */}
            <li
              onClick={() => onSelectSection('all')}
              className={`flex items-center justify-between px-2 py-1 cursor-pointer transition-colors ${
                activeSection === 'all'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] font-bold border-l-2 border-[var(--color-term-green)]'
                  : 'hover:bg-[#011a1a] hover:text-[var(--color-term-cyan)]'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Music2 className="w-3.5 h-3.5 text-[var(--color-term-green)]" />
                <span>All Tracks</span>
              </span>
              <span className="text-[10px] px-1 bg-[#011e1e] text-[var(--color-term-cyan)]">
                {totalTracksCount}
              </span>
            </li>

            {/* Videos (ASCII Playback) */}
            <li
              onClick={() => onSelectSection('videos')}
              className={`flex items-center justify-between px-2 py-1 cursor-pointer transition-colors ${
                activeSection === 'videos'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] font-bold border-l-2 border-[var(--color-term-green)]'
                  : 'hover:bg-[#011a1a] hover:text-[var(--color-term-cyan)]'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Film className="w-3.5 h-3.5 text-[var(--color-term-cyan)]" />
                <span>Videos (ASCII)</span>
              </span>
              <span className="text-[10px] px-1 bg-[#011e1e] text-[var(--color-term-green)] font-semibold">
                {videoTracksCount}
              </span>
            </li>

            {/* Liked Songs */}
            <li
              onClick={() => onSelectSection('liked')}
              className={`flex items-center justify-between px-2 py-1 cursor-pointer transition-colors ${
                activeSection === 'liked'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] font-bold border-l-2 border-[var(--color-term-green)]'
                  : 'hover:bg-[#011a1a] hover:text-[var(--color-term-cyan)]'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Heart className="w-3.5 h-3.5 text-[var(--color-term-error)]" />
                <span>Liked Songs</span>
              </span>
              <span className="text-[10px] text-[var(--color-term-dim)]">{likedTracksCount}</span>
            </li>

            {/* Recently Played */}
            <li
              onClick={() => onSelectSection('recent')}
              className={`flex items-center justify-between px-2 py-1 cursor-pointer transition-colors ${
                activeSection === 'recent'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] font-bold border-l-2 border-[var(--color-term-green)]'
                  : 'hover:bg-[#011a1a] hover:text-[var(--color-term-cyan)]'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Clock className="w-3.5 h-3.5 text-[var(--color-term-cyan)]" />
                <span>Recently Played</span>
              </span>
              <span className="text-[10px] text-[var(--color-term-dim)]">{recentTracksCount}</span>
            </li>

            {/* Most Played */}
            <li
              onClick={() => onSelectSection('most-played')}
              className={`flex items-center justify-between px-2 py-1 cursor-pointer transition-colors ${
                activeSection === 'most-played'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] font-bold border-l-2 border-[var(--color-term-green)]'
                  : 'hover:bg-[#011a1a] hover:text-[var(--color-term-cyan)]'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--color-term-green)]" />
                <span>Most Played</span>
              </span>
            </li>

            {/* Folders */}
            <li
              onClick={() => onSelectSection('folders')}
              className={`flex items-center justify-between px-2 py-1 cursor-pointer transition-colors ${
                activeSection === 'folders'
                  ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] font-bold border-l-2 border-[var(--color-term-green)]'
                  : 'hover:bg-[#011a1a] hover:text-[var(--color-term-cyan)]'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <FolderTree className="w-3.5 h-3.5 text-[var(--color-term-dim)]" />
                <span>Local Files</span>
              </span>
            </li>
          </ul>
        </div>

        {/* Genres Filter Section */}
        <div>
          <div className="text-[10px] text-[var(--color-term-green)] font-bold tracking-wider px-2 uppercase mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>GENRES</span>
            </span>
            <span className="text-[9px] text-[var(--color-term-dim)]">{genres.length}</span>
          </div>
          <ul className="space-y-0.5 text-[var(--color-term-text)] max-h-36 overflow-y-auto pr-1">
            <li
              onClick={() => {
                onSelectSection('genre');
                onSelectGenre('ALL');
              }}
              className={`flex justify-between px-2 py-0.5 cursor-pointer text-xs ${
                activeSection === 'genre' && selectedGenre === 'ALL'
                  ? 'bg-[#002b2b] text-[var(--color-term-cyan)] font-bold'
                  : 'hover:bg-[#011414]'
              }`}
            >
              <span>All Genres</span>
              <span className="text-[10px] text-[var(--color-term-dim)]">{totalTracksCount}</span>
            </li>
            {genres.map((g) => (
              <li
                key={g}
                onClick={() => {
                  onSelectSection('genre');
                  onSelectGenre(g);
                }}
                className={`flex justify-between px-2 py-0.5 cursor-pointer text-xs ${
                  activeSection === 'genre' && selectedGenre === g
                    ? 'bg-[#002b2b] text-[var(--color-term-cyan)] font-bold'
                    : 'hover:bg-[#011414]'
                }`}
              >
                <span className="truncate">{g}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Playlists Section */}
        <div>
          <div className="text-[10px] text-[var(--color-term-green)] font-bold tracking-wider px-2 uppercase mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ListMusic className="w-3 h-3" />
              <span>PLAYLISTS</span>
            </span>
            <button
              onClick={onOpenCreatePlaylist}
              title="Create new playlist"
              className="text-[var(--color-term-green)] hover:text-[var(--color-term-cyan)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="space-y-0.5 text-[var(--color-term-text)] max-h-36 overflow-y-auto pr-1">
            {playlists.length === 0 ? (
              <li className="px-2 py-1 text-[10px] text-[var(--color-term-dim)] italic">
                No custom playlists
              </li>
            ) : (
              playlists.map((pl) => (
                <li
                  key={pl.id}
                  onClick={() => {
                    onSelectSection('playlist');
                    onSelectPlaylist(pl.id);
                  }}
                  className={`flex justify-between px-2 py-0.5 cursor-pointer text-xs truncate ${
                    activeSection === 'playlist' && selectedPlaylistId === pl.id
                      ? 'bg-[#002b2b] text-[var(--color-term-cyan)] font-bold'
                      : 'hover:bg-[#011414]'
                  }`}
                >
                  <span className="truncate">{pl.name}</span>
                  <span className="text-[10px] text-[var(--color-term-dim)]">
                    {pl.trackIds.length}
                  </span>
                </li>
              ))
            )}
            <li
              onClick={onOpenCreatePlaylist}
              className="pt-1.5 px-2 text-[var(--color-term-green)] hover:underline cursor-pointer text-[11px] font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>New Playlist</span>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
