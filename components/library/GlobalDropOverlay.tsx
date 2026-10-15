'use client';

import React, { useState, useEffect, useRef } from 'react';
import { extractFilesFromDataTransfer, ScannedFolderReport } from '@/lib/utils/folderScanner';
import { parseMediaFile } from '@/lib/metadata/parser';
import { dbManager } from '@/lib/database/indexedDb';
import { useAudio } from '@/lib/audio/AudioEngine';
import { Track } from '@/types/music';
import {
  Upload,
  FolderOpen,
  Film,
  Music,
  CheckCircle2,
  AlertTriangle,
  X,
  Play,
  Sparkles,
} from 'lucide-react';

interface GlobalDropOverlayProps {
  onOpenCinema?: () => void;
}

export default function GlobalDropOverlay({ onOpenCinema }: GlobalDropOverlayProps) {
  const { allTracks, addTracks, playTrack, refreshTracks } = useAudio();

  const [isDraggingOverWindow, setIsDraggingOverWindow] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [resultReport, setResultReport] = useState<{
    audioCount: number;
    videoCount: number;
    skippedCount: number;
    firstVideoTrack?: Track;
    firstAudioTrack?: Track;
  } | null>(null);

  const dragCounterRef = useRef<number>(0);

  // Set up global window drag & drop event listeners
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;

      if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDraggingOverWindow(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDraggingOverWindow(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDraggingOverWindow(false);

      if (!e.dataTransfer) return;

      setIsProcessing(true);
      setProgressPercent(0);
      setProgressMsg('Scanning dropped items and directory trees...');

      try {
        const report: ScannedFolderReport = await extractFilesFromDataTransfer(e.dataTransfer);
        const { files } = report;

        if (files.length === 0) {
          setIsProcessing(false);
          setProgressMsg('');
          return;
        }

        setProgressMsg(`Found ${files.length} media file(s). Starting local ingest...`);

        // Duplicate detection
        const existingSignatures = new Set(
          allTracks.map((t) => `${t.title.toLowerCase()}___${t.artist.toLowerCase()}`)
        );

        const newlyParsed: Track[] = [];
        let audioCount = 0;
        let videoCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const pct = Math.round(((i + 1) / files.length) * 100);
          setProgressPercent(pct);
          setProgressMsg(`[${i + 1}/${files.length}]: Parsing ${file.name}...`);

          try {
            const { track, blob } = await parseMediaFile(file);
            const sig = `${track.title.toLowerCase()}___${track.artist.toLowerCase()}`;

            if (existingSignatures.has(sig)) {
              skippedCount++;
            } else {
              existingSignatures.add(sig);
              await dbManager.saveTrack(track, blob);
              newlyParsed.push(track);

              if (track.isVideo) {
                videoCount++;
              } else {
                audioCount++;
              }
            }
          } catch (err) {
            console.error('Failed to parse file:', file.name, err);
          }
        }

        if (newlyParsed.length > 0) {
          await addTracks(newlyParsed);
          await refreshTracks();
        }

        const firstVideo = newlyParsed.find((t) => t.isVideo);
        const firstAudio = newlyParsed.find((t) => !t.isVideo);

        setResultReport({
          audioCount,
          videoCount,
          skippedCount,
          firstVideoTrack: firstVideo,
          firstAudioTrack: firstAudio,
        });

        // If only 1 video was dropped and nothing currently playing, or if requested
        if (files.length === 1 && firstVideo) {
          await playTrack(firstVideo);
          if (onOpenCinema) {
            onOpenCinema();
          }
        }
      } catch (err) {
        console.error('Error during global drop import:', err);
      } finally {
        setIsProcessing(false);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [allTracks, addTracks, playTrack, refreshTracks, onOpenCinema]);

  return (
    <>
      {/* 1. Fullscreen Drag Overlay HUD (when dragging files over browser) */}
      {isDraggingOverWindow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-6 select-none font-mono pointer-events-none">
          <div className="w-full max-w-2xl border-2 border-dashed border-[var(--color-term-green)] bg-[#011414]/90 p-8 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(0,255,136,0.3)] animate-pulse">
            <div className="flex items-center gap-4 mb-4 text-[var(--color-term-green)]">
              <div className="p-3 border border-[var(--color-term-green)] rounded-full bg-[var(--color-term-green)]/15">
                <Music className="w-8 h-8" />
              </div>
              <div className="p-3 border border-[var(--color-term-cyan)] rounded-full bg-[var(--color-term-cyan)]/15 text-[var(--color-term-cyan)]">
                <Film className="w-8 h-8" />
              </div>
              <div className="p-3 border border-[var(--color-term-green)] rounded-full bg-[var(--color-term-green)]/15">
                <FolderOpen className="w-8 h-8" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-term-green)] tracking-wider mb-2">
              RELEASE TO IMPORT MEDIA ANYWHERE
            </h2>

            <p className="text-xs sm:text-sm text-[var(--color-term-cyan)] max-w-lg mb-4">
              Drop single songs, videos, or entire folders with subdirectories. Everything is parsed recursively and saved locally to IndexedDB!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-[var(--color-term-dim)]">
              <span className="px-2 py-1 border border-[var(--color-term-border)] bg-[#010909]">
                AUDIO: MP3, WAV, FLAC, OGG, M4A
              </span>
              <span className="px-2 py-1 border border-[var(--color-term-border)] bg-[#010909]">
                VIDEO: MP4, WEBM, MKV, MOV (ASCII PLAYBACK)
              </span>
              <span className="px-2 py-1 border border-[var(--color-term-border)] bg-[#010909]">
                FOLDERS: RECURSIVE AUTO-SCAN
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Ingest Progress Modal (while scanning & parsing) */}
      {isProcessing && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none font-mono">
          <div className="w-full max-w-md border border-[var(--color-term-green)] bg-[#010e0e] p-5 shadow-[0_0_30px_rgba(0,255,136,0.25)] space-y-3">
            <div className="flex items-center gap-2 text-[var(--color-term-green)] font-bold text-sm">
              <span className="w-4 h-4 border-2 border-[var(--color-term-green)] border-t-transparent rounded-full animate-spin" />
              <span>LOCAL MEDIA INGEST IN PROGRESS</span>
            </div>

            <p className="text-xs text-[var(--color-term-text)] truncate">{progressMsg}</p>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-[#001c1c] border border-[var(--color-term-border)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-term-green)] transition-all duration-150 shadow-[0_0_8px_rgba(0,255,136,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-[var(--color-term-dim)]">
              <span>SCANNING FOLDERS & FRAMES</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Ingest Result Summary Toast / Modal */}
      {resultReport && (
        <div className="fixed inset-0 z-[102] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none font-mono">
          <div className="w-full max-w-md border-2 border-[var(--color-term-green)] bg-[#011010] p-5 shadow-[0_0_35px_rgba(0,255,136,0.3)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-term-border)]">
              <div className="flex items-center gap-2 text-[var(--color-term-green)] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>INGEST COMPLETED</span>
              </div>
              <button
                onClick={() => setResultReport(null)}
                className="text-[var(--color-term-muted)] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[var(--color-term-text)]">
              <div className="flex justify-between p-2 border border-[var(--color-term-border)] bg-[#010909]">
                <span className="flex items-center gap-1.5 text-[var(--color-term-cyan)]">
                  <Music className="w-3.5 h-3.5" />
                  <span>Audio Songs Added:</span>
                </span>
                <span className="font-bold text-[var(--color-term-green)]">{resultReport.audioCount}</span>
              </div>

              <div className="flex justify-between p-2 border border-[var(--color-term-border)] bg-[#010909]">
                <span className="flex items-center gap-1.5 text-[var(--color-term-green)]">
                  <Film className="w-3.5 h-3.5" />
                  <span>Videos (ASCII Ready) Added:</span>
                </span>
                <span className="font-bold text-[var(--color-term-green)]">{resultReport.videoCount}</span>
              </div>

              {resultReport.skippedCount > 0 && (
                <div className="flex justify-between p-2 border border-[var(--color-term-border)] bg-[#010909] text-[var(--color-term-dim)]">
                  <span>Duplicates Skipped:</span>
                  <span>{resultReport.skippedCount}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              {resultReport.firstVideoTrack && (
                <button
                  onClick={async () => {
                    await playTrack(resultReport.firstVideoTrack!);
                    setResultReport(null);
                    if (onOpenCinema) onOpenCinema();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold text-xs hover:bg-[var(--color-term-green)]/25 transition-all shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                >
                  <Film className="w-4 h-4" />
                  <span>PLAY VIDEO IN ASCII CINEMA</span>
                </button>
              )}

              {resultReport.firstAudioTrack && !resultReport.firstVideoTrack && (
                <button
                  onClick={async () => {
                    await playTrack(resultReport.firstAudioTrack!);
                    setResultReport(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-[var(--color-term-cyan)] bg-[var(--color-term-cyan)]/15 text-[var(--color-term-cyan)] font-bold text-xs hover:bg-[var(--color-term-cyan)]/25 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>PLAY IMPORTED TRACK</span>
                </button>
              )}

              <button
                onClick={() => setResultReport(null)}
                className="w-full px-3 py-2 border border-[var(--color-term-border)] bg-[#010808] text-[var(--color-term-muted)] hover:text-white text-xs transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
