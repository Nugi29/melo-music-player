'use client';

import React, { useState } from 'react';
import { X, Video, Plus, Radio } from 'lucide-react';
import { Track } from '@/types/music';

interface AddStreamModalProps {
  onClose: () => void;
  onAddStream: (stream: Track) => void;
}

export default function AddStreamModal({ onClose, onAddStream }: AddStreamModalProps) {
  const [url, setUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('YouTube Stream');

  const extractYoutubeId = (input: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = input.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const ytId = extractYoutubeId(url);
    const newTrack: Track = {
      id: `stream-${Date.now()}`,
      title: title.trim() || (ytId ? `YouTube Stream [${ytId}]` : 'Live ASCII Stream'),
      artist: artist.trim() || 'Live Streamer',
      album: 'Live ASCII Feeds',
      duration: 300,
      genre: 'ASCII Stream',
      year: new Date().getFullYear(),
      trackNumber: 1,
      youtubeId: ytId || undefined,
      audioSrc: url.trim(),
      dateAdded: Date.now(),
      playCount: 1,
      isLiked: false,
      source: 'local',
      isVideo: true,
      videoWidth: 1920,
      videoHeight: 1080,
    };

    onAddStream(newTrack);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-md bg-[#020b0b] border border-[#005555] p-4 text-xs shadow-[0_0_20px_rgba(0,255,136,0.2)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#003838] mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00ff88] animate-pulse" />
            <span className="font-bold text-[#00ff88] neon-green-glow">
              ADD LIVE STREAM // YT-STREAM
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#008f8f] hover:text-[#00ff88] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] text-[#00a89d] uppercase mb-1 font-semibold">
              Stream URL or YouTube Watch URL
            </label>
            <div className="flex items-center border border-[#005555] bg-[#011414] px-2 py-1.5 focus-within:border-[#00ff88]">
              <Video className="w-3.5 h-3.5 text-[#ff5555] mr-1.5 flex-none" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="w-full bg-transparent border-none p-0 text-xs text-[#00f3ff] placeholder-[#0e5c5c] focus:ring-0 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-[#00a89d] uppercase mb-1 font-semibold">
              Stream Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cyberpunk Lo-Fi 24/7"
              className="w-full border border-[#005555] bg-[#011414] px-2 py-1.5 text-xs text-[#00f3ff] placeholder-[#0e5c5c] focus:border-[#00ff88] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#00a89d] uppercase mb-1 font-semibold">
              Channel / Creator (Optional)
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Lofi Girl / Vector Hacker"
              className="w-full border border-[#005555] bg-[#011414] px-2 py-1.5 text-xs text-[#00f3ff] placeholder-[#0e5c5c] focus:border-[#00ff88] focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#003838]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border border-[#003838] text-[#008f8f] hover:text-[#00f3ff] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1 bg-[#003838] border border-[#00ff88] text-[#00ff88] font-bold hover:bg-[#00ff88]/20 transition-all neon-box-glow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buffer &amp; Play</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
