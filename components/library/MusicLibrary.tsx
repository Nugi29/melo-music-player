'use client';

import React, { useState, useMemo } from 'react';
import { Track, SortField, SortOrder, LibraryViewMode } from '@/types/music';
import { useAudio } from '@/lib/audio/AudioEngine';
import TrackTable from './TrackTable';
import TrackGridView from './TrackGridView';
import {
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  Upload,
  Sparkles,
  FolderOpen,
  FilterX,
  Volume2,
  Film,
} from 'lucide-react';

interface MusicLibraryProps {
  tracks: Track[];
  title: string;
  subtitle?: string;
  onOpenImport: () => void;
  className?: string;
}

export default function MusicLibrary({
  tracks,
  title,
  subtitle,
  onOpenImport,
  className = '',
}: MusicLibraryProps) {
  const { playTrack, loadDemoTracks, deleteTrack } = useAudio();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('trackNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<LibraryViewMode>('table');
  const [activeGenreFilter, setActiveGenreFilter] = useState<string>('ALL');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'audio' | 'video'>('all');

  // Compute unique genres in currently filtered set
  const genres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      if (t.genre) set.add(t.genre);
    });
    return Array.from(set);
  }, [tracks]);

  // Filter & Sort tracks
  const processedTracks = useMemo(() => {
    let result = [...tracks];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q) ||
          t.genre.toLowerCase().includes(q)
      );
    }

    // Genre filter
    if (activeGenreFilter !== 'ALL') {
      result = result.filter((t) => t.genre.toLowerCase() === activeGenreFilter.toLowerCase());
    }

    // Media type filter
    if (mediaTypeFilter === 'video') {
      result = result.filter((t) => t.isVideo);
    } else if (mediaTypeFilter === 'audio') {
      result = result.filter((t) => !t.isVideo);
    }

    // Sorting
    result.sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'title':
          comp = a.title.localeCompare(b.title);
          break;
        case 'artist':
          comp = a.artist.localeCompare(b.artist);
          break;
        case 'album':
          comp = a.album.localeCompare(b.album);
          break;
        case 'duration':
          comp = a.duration - b.duration;
          break;
        case 'dateAdded':
          comp = a.dateAdded - b.dateAdded;
          break;
        case 'playCount':
          comp = (a.playCount || 0) - (b.playCount || 0);
          break;
        case 'trackNumber':
        default:
          comp = (a.trackNumber || 0) - (b.trackNumber || 0);
          break;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return result;
  }, [tracks, searchQuery, activeGenreFilter, mediaTypeFilter, sortField, sortOrder]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <section
      className={`border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-3 flex flex-col font-mono text-xs select-none ${className}`}
    >
      {/* 1. Header Banner */}
      <div className="flex-none flex items-center justify-between border-b border-[var(--color-term-border)] pb-2 mb-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-[var(--color-term-green)]" />
          <h2 className="text-sm font-bold text-[var(--color-term-green)] tracking-wider">
            {title}
          </h2>
          {subtitle && (
            <span className="text-[11px] text-[var(--color-term-dim)] hidden sm:inline">
              {subtitle}
            </span>
          )}
        </div>
        <div className="text-[11px] text-[var(--color-term-muted)]">
          <span className="text-[var(--color-term-cyan)] font-bold">{processedTracks.length}</span>{' '}
          tracks
        </div>
      </div>

      {/* 2. Controls Toolbar */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-2 mb-2">
        {/* Search Input Box */}
        <div className="flex-1 min-w-[180px] max-w-sm flex items-center border border-[var(--color-term-border)] bg-[#011414] px-2 py-1 focus-within:border-[var(--color-term-green)]">
          <Search className="w-3.5 h-3.5 text-[var(--color-term-green)] mr-1.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, artist, album..."
            className="w-full bg-transparent border-none p-0 text-xs text-[var(--color-term-cyan)] placeholder-[var(--color-term-dim)] focus:ring-0 focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[var(--color-term-dim)] hover:text-[var(--color-term-error)] text-[11px]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons: Sort, View Toggle, Import */}
        <div className="flex items-center gap-1.5">
          {/* Sort Selector */}
          <div className="flex items-center border border-[var(--color-term-border)] bg-[#011414] px-1.5 py-1 text-[11px]">
            <ArrowUpDown className="w-3 h-3 text-[var(--color-term-muted)] mr-1" />
            <select
              value={sortField}
              onChange={(e) => handleSortChange(e.target.value as SortField)}
              className="bg-transparent border-none p-0 text-[11px] text-[var(--color-term-cyan)] focus:ring-0 cursor-pointer font-mono"
            >
              <option value="trackNumber" className="bg-[#020b0b]">Track #</option>
              <option value="title" className="bg-[#020b0b]">Title</option>
              <option value="artist" className="bg-[#020b0b]">Artist</option>
              <option value="album" className="bg-[#020b0b]">Album</option>
              <option value="duration" className="bg-[#020b0b]">Duration</option>
              <option value="playCount" className="bg-[#020b0b]">Most Played</option>
              <option value="dateAdded" className="bg-[#020b0b]">Date Added</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              title={`Toggle sort order: ${sortOrder.toUpperCase()}`}
              className="ml-1 text-[var(--color-term-green)] font-bold text-[10px]"
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>

          {/* View Mode Toggle: Table / Grid */}
          <div className="flex border border-[var(--color-term-border)] bg-[#011414]">
            <button
              onClick={() => setViewMode('table')}
              title="Table view"
              className={`p-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-[var(--color-term-green)]/20 text-[var(--color-term-green)]'
                  : 'text-[var(--color-term-dim)] hover:text-[var(--color-term-cyan)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--color-term-green)]/20 text-[var(--color-term-green)]'
                  : 'text-[var(--color-term-dim)] hover:text-[var(--color-term-cyan)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 px-2 py-1 border border-[var(--color-term-green)] bg-[var(--color-term-green)]/10 text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/20 transition-colors text-[11px] font-bold"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>

      {/* 3. Media Type & Genre Quick Pills */}
      <div className="flex-none flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2 scrollbar-none text-[10px]">
        {/* Media type toggle pills */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-term-border)]">
          <button
            onClick={() => setMediaTypeFilter('all')}
            className={`px-1.5 py-0.5 border transition-colors ${
              mediaTypeFilter === 'all'
                ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/20 text-[var(--color-term-green)] font-bold'
                : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setMediaTypeFilter('audio')}
            className={`px-1.5 py-0.5 border transition-colors ${
              mediaTypeFilter === 'audio'
                ? 'border-[var(--color-term-cyan)] bg-[var(--color-term-cyan)]/20 text-[var(--color-term-cyan)] font-bold'
                : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
            }`}
          >
            SONGS
          </button>
          <button
            onClick={() => setMediaTypeFilter('video')}
            className={`px-1.5 py-0.5 border flex items-center gap-1 transition-colors ${
              mediaTypeFilter === 'video'
                ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/25 text-[var(--color-term-green)] font-bold shadow-[0_0_6px_rgba(0,255,136,0.3)]'
                : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-green)]'
            }`}
          >
            <Film className="w-2.5 h-2.5" />
            <span>VIDEOS (ASCII)</span>
          </button>
        </div>

        {genres.length > 0 && (
          <>
            <span className="text-[var(--color-term-dim)] mr-0.5">Genre:</span>
            <button
              onClick={() => setActiveGenreFilter('ALL')}
              className={`px-1.5 py-0.5 border transition-colors ${
                activeGenreFilter === 'ALL'
                  ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/20 text-[var(--color-term-green)] font-bold'
                  : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
              }`}
            >
              ALL
            </button>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenreFilter(g)}
                className={`px-1.5 py-0.5 border transition-colors ${
                  activeGenreFilter === g
                    ? 'border-[var(--color-term-cyan)] bg-[var(--color-term-cyan)]/20 text-[var(--color-term-cyan)] font-bold'
                    : 'border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
                }`}
              >
                {g}
              </button>
            ))}
          </>
        )}
      </div>

      {/* 4. Main Track Display or Empty State */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {processedTracks.length > 0 ? (
          viewMode === 'table' ? (
            <TrackTable
              tracks={processedTracks}
              onPlayTrack={(track) => playTrack(track, processedTracks)}
              onDeleteTrack={(id) => deleteTrack(id)}
            />
          ) : (
            <TrackGridView
              tracks={processedTracks}
              onPlayTrack={(track) => playTrack(track, processedTracks)}
            />
          )
        ) : searchQuery || activeGenreFilter !== 'ALL' ? (
          /* Empty Search Filter State */
          <div className="h-48 border border-dashed border-[var(--color-term-border)] flex flex-col items-center justify-center p-4 text-center">
            <FilterX className="w-8 h-8 text-[var(--color-term-error)] mb-2" />
            <p className="text-[var(--color-term-cyan)] font-bold mb-1">
              No matching tracks found
            </p>
            <p className="text-[11px] text-[var(--color-term-dim)] mb-3">
              No tracks matched &quot;{searchQuery || activeGenreFilter}&quot;
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveGenreFilter('ALL');
              }}
              className="px-2.5 py-1 border border-[var(--color-term-cyan)] text-[var(--color-term-cyan)] hover:bg-[var(--color-term-cyan)]/10 text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Empty Library State */
          <div className="h-64 border border-dashed border-[var(--color-term-border)] flex flex-col items-center justify-center p-6 text-center space-y-3">
            <FolderOpen className="w-12 h-12 text-[var(--color-term-green)] animate-pulse" />
            <div>
              <p className="text-sm font-bold text-[var(--color-term-cyan)] neon-text-glow">
                Terminal Media Library Ready
              </p>
              <p className="text-xs text-[var(--color-term-dim)] mt-1 max-w-md">
                Drag and drop songs, video files (MP4, WebM), or entire directories anywhere on the screen!
                Videos play automatically with real-time ASCII art video decoding.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onOpenImport}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/25 font-bold text-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Songs / Videos / Folders</span>
              </button>
              <button
                onClick={loadDemoTracks}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-term-cyan)] text-[var(--color-term-cyan)] hover:bg-[var(--color-term-cyan)]/10 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preload Demo Tracks & Video</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
