'use client';

import React, { useState } from 'react';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/music';
import { X, ListMusic, Plus, Play, Trash2, Edit2, Check } from 'lucide-react';

interface PlaylistModalProps {
  playlists: Playlist[];
  allTracks: Track[];
  onClose: () => void;
  onCreatePlaylist: (name: string, description?: string) => Promise<Playlist>;
  onDeletePlaylist: (id: string) => Promise<void>;
  onPlayPlaylist: (playlist: Playlist) => Promise<void>;
  onAddTrackToPlaylist?: (playlistId: string, trackId: string) => Promise<void>;
  onRemoveTrackFromPlaylist?: (playlistId: string, trackId: string) => Promise<void>;
}

export default function PlaylistModal({
  playlists,
  allTracks,
  onClose,
  onCreatePlaylist,
  onDeletePlaylist,
  onPlayPlaylist,
}: PlaylistModalProps) {
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    playlists.length > 0 ? playlists[0] : null
  );

  const sampleNames = [
    'Coding Flow',
    'Cyberpunk Nights',
    'Chill Vibes',
    'Focus Mode',
    'Sinhala Classics',
  ];

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    const pl = await onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setSelectedPlaylist(pl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono text-xs select-none">
      <div className="w-full max-w-xl border border-[var(--color-term-border)] bg-[#030909] p-4 flex flex-col gap-3 shadow-[0_0_20px_rgba(0,255,136,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-term-border)] pb-2">
          <div className="flex items-center gap-2 text-[var(--color-term-green)] font-bold text-sm">
            <ListMusic className="w-4 h-4" />
            <span>PLAYLIST MANAGER</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-term-muted)] hover:text-[var(--color-term-error)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Input & Quick Suggestions */}
        <div className="border border-[var(--color-term-border)] bg-[#010909] p-2.5 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Enter new playlist name..."
              className="flex-1 bg-[#021313] border border-[var(--color-term-border)] px-2 py-1 text-xs text-[var(--color-term-cyan)] focus:outline-none focus:border-[var(--color-term-green)] font-mono"
            />
            <button
              onClick={handleCreate}
              className="flex items-center gap-1 px-3 py-1 bg-[var(--color-term-green)]/15 border border-[var(--color-term-green)] text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/25 font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-[var(--color-term-dim)]">Suggestions:</span>
            {sampleNames.map((name) => (
              <button
                key={name}
                onClick={() => setNewPlaylistName(name)}
                className="px-1.5 py-0.5 border border-[#003838] text-[var(--color-term-cyan)] hover:border-[var(--color-term-green)]"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>

        {/* Playlists Listing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
          {playlists.length === 0 ? (
            <div className="col-span-2 p-6 text-center text-[var(--color-term-dim)] italic border border-dashed border-[var(--color-term-border)]">
              No playlists created yet. Create one above!
            </div>
          ) : (
            playlists.map((pl) => (
              <div
                key={pl.id}
                className="border border-[var(--color-term-border)] bg-[#010909] p-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[var(--color-term-green)] text-xs truncate">
                      {pl.name}
                    </span>
                    <span className="text-[10px] text-[var(--color-term-dim)]">
                      {pl.trackIds.length} tracks
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-term-muted)]">
                    Created {new Date(pl.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1.5 mt-3 pt-1.5 border-t border-[#002222]">
                  <button
                    onClick={() => onPlayPlaylist(pl)}
                    title="Play Playlist"
                    className="flex items-center gap-1 px-2 py-0.5 border border-[var(--color-term-green)] text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/15"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>
                  <button
                    onClick={() => onDeletePlaylist(pl.id)}
                    title="Delete Playlist"
                    className="p-1 border border-[var(--color-term-border)] text-[var(--color-term-dim)] hover:text-[var(--color-term-error)] hover:border-[var(--color-term-error)]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[var(--color-term-border)]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold hover:bg-[var(--color-term-green)]/25"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
