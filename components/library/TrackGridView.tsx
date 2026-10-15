'use client';

import React from 'react';
import { Track } from '@/types/music';
import { useAudio } from '@/lib/audio/AudioEngine';
import { formatDuration } from '@/lib/utils/formatters';
import { getRandomAsciiArt } from '@/lib/utils/asciiArt';
import { Play, Pause, Heart, Radio, Film } from 'lucide-react';

interface TrackGridViewProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
}

export default function TrackGridView({ tracks, onPlayTrack }: TrackGridViewProps) {
  const { currentTrack, isPlaying, toggleLike } = useAudio();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 p-1">
      {tracks.map((track) => {
        const isCurrent = currentTrack?.id === track.id;
        return (
          <div
            key={track.id}
            onClick={() => onPlayTrack(track)}
            className={`border transition-all cursor-pointer p-2 flex flex-col justify-between group ${
              isCurrent
                ? 'border-[var(--color-term-green)] bg-[#002626] shadow-[0_0_10px_rgba(0,255,136,0.15)]'
                : 'border-[var(--color-term-border)] bg-[#020b0b] hover:border-[var(--color-term-cyan)] hover:bg-[#011414]'
            }`}
          >
            {/* Artwork / ASCII Art Box */}
            <div className="w-full aspect-square border border-[var(--color-term-border)] bg-[#010606] flex items-center justify-center relative overflow-hidden mb-2">
              {track.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.pictureUrl}
                  alt={track.title}
                  className="w-full h-full object-cover filter contrast-125"
                />
              ) : (
                <pre className="text-[5.5px] leading-[6px] font-mono text-[var(--color-term-green)] select-none tracking-tighter m-0 p-1">
                  {getRandomAsciiArt(track.id)}
                </pre>
              )}

              {/* Play / Playing Badge */}
              <div
                className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                  isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <div className="w-10 h-10 rounded-full border border-[var(--color-term-green)] bg-[#010909] flex items-center justify-center text-[var(--color-term-green)] shadow-[0_0_8px_rgba(0,255,136,0.5)]">
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </div>
              </div>

              {isCurrent && (
                <span className="absolute top-1 left-1 px-1 py-0.5 bg-[var(--color-term-green)] text-black text-[9px] font-bold">
                  PLAYING
                </span>
              )}

              {track.isVideo && (
                <span className="absolute top-1 right-1 px-1 py-0.5 bg-[var(--color-term-cyan)] text-black text-[8px] font-bold tracking-wider flex items-center gap-0.5 shadow-[0_0_6px_rgba(0,217,255,0.6)]">
                  <Film className="w-2.5 h-2.5" />
                  <span>VIDEO</span>
                </span>
              )}
            </div>

            {/* Info Metadata */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4
                  className={`text-xs font-bold truncate ${
                    isCurrent ? 'text-[var(--color-term-green)] neon-green-glow' : 'text-[var(--color-term-cyan)]'
                  }`}
                  title={track.title}
                >
                  {track.title}
                </h4>
                <p className="text-[11px] text-[var(--color-term-text)] truncate mt-0.5" title={track.artist}>
                  {track.artist}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[var(--color-term-dim)] mt-2 pt-1 border-t border-[#002222]">
                <span>{formatDuration(track.duration)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(track.id);
                  }}
                  className={`p-1 hover:scale-110 transition-transform ${
                    track.isLiked
                      ? 'text-[var(--color-term-error)]'
                      : 'text-[var(--color-term-dim)] hover:text-[var(--color-term-error)]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${track.isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
