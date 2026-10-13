'use client';

import React from 'react';
import { Track } from '@/types/music';
import { useAudio } from '@/lib/audio/AudioEngine';
import { formatDuration, padNumber } from '@/lib/utils/formatters';
import { Play, Pause, Heart, Music, Trash2 } from 'lucide-react';

interface TrackTableProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onDeleteTrack?: (trackId: string) => void;
}

export default function TrackTable({
  tracks,
  onPlayTrack,
  onDeleteTrack,
}: TrackTableProps) {
  const { currentTrack, isPlaying, toggleLike, deleteTrack } = useAudio();

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse text-xs font-mono">
        <thead>
          <tr className="text-[var(--color-term-dim)] border-b border-[var(--color-term-border)] select-none text-[11px]">
            <th className="py-1.5 px-2 font-semibold w-12 text-center">#</th>
            <th className="py-1.5 px-2 font-semibold">Title</th>
            <th className="py-1.5 px-2 font-semibold hidden sm:table-cell">Artist</th>
            <th className="py-1.5 px-2 font-semibold hidden md:table-cell">Album</th>
            <th className="py-1.5 px-2 font-semibold w-16 text-right">Duration</th>
            <th className="py-1.5 px-2 font-semibold w-20 hidden lg:table-cell">Genre</th>
            <th className="py-1.5 px-2 font-semibold w-16 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#002222]">
          {tracks.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <tr
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className={`group cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-[#002828] text-[var(--color-term-green)] font-semibold border-l-2 border-[var(--color-term-green)]'
                    : 'text-[var(--color-term-text)] hover:bg-[#011a1a]'
                }`}
              >
                {/* Track Number / Play Indicator */}
                <td className="py-2 px-2 text-center">
                  {isCurrent ? (
                    <span className="flex items-center justify-center text-[var(--color-term-green)] animate-pulse">
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </span>
                  ) : (
                    <span className="text-[var(--color-term-dim)] group-hover:text-[var(--color-term-cyan)]">
                      {padNumber(index + 1)}
                    </span>
                  )}
                </td>

                {/* Track Title */}
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`truncate ${
                        isCurrent
                          ? 'text-[var(--color-term-green)] font-bold neon-green-glow'
                          : 'text-[var(--color-term-cyan)] group-hover:text-[var(--color-term-green)]'
                      }`}
                    >
                      {track.title}
                    </span>
                  </div>
                  <div className="sm:hidden text-[10px] text-[var(--color-term-dim)] truncate">
                    {track.artist}
                  </div>
                </td>

                {/* Artist */}
                <td className="py-2 px-2 text-[var(--color-term-text)] truncate hidden sm:table-cell">
                  {track.artist}
                </td>

                {/* Album */}
                <td className="py-2 px-2 text-[var(--color-term-dim)] truncate hidden md:table-cell">
                  {track.album}
                </td>

                {/* Duration */}
                <td className="py-2 px-2 text-[var(--color-term-muted)] text-right font-mono">
                  {formatDuration(track.duration)}
                </td>

                {/* Genre */}
                <td className="py-2 px-2 text-[var(--color-term-dim)] truncate hidden lg:table-cell">
                  <span className="px-1.5 py-0.5 border border-[#003838] text-[10px]">
                    {track.genre}
                  </span>
                </td>

                {/* Actions (Like & Delete) */}
                <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => toggleLike(track.id)}
                      title={track.isLiked ? 'Unlike' : 'Favorite'}
                      className={`p-1 hover:scale-110 transition-transform ${
                        track.isLiked
                          ? 'text-[var(--color-term-error)]'
                          : 'text-[var(--color-term-dim)] hover:text-[var(--color-term-error)]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${track.isLiked ? 'fill-current' : ''}`} />
                    </button>
                    {onDeleteTrack && (
                      <button
                        onClick={() => onDeleteTrack(track.id)}
                        title="Delete from Library"
                        className="p-1 text-[var(--color-term-dim)] hover:text-[var(--color-term-error)] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
