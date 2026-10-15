'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { parseMediaFile } from '@/lib/metadata/parser';
import { extractFilesFromDataTransfer } from '@/lib/utils/folderScanner';
import { dbManager } from '@/lib/database/indexedDb';
import { useAudio } from '@/lib/audio/AudioEngine';
import { Track } from '@/types/music';
import {
  Upload,
  FileAudio,
  Film,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  X,
  HardDrive,
  FolderTree,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils/formatters';

interface ImportDropzoneProps {
  onClose?: () => void;
  onImportComplete?: (tracksCount: number) => void;
}

export default function ImportDropzone({ onClose, onImportComplete }: ImportDropzoneProps) {
  const { allTracks, addTracks, refreshTracks } = useAudio();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [importedList, setImportedList] = useState<Track[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const processFileList = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setImportedList([]);
    const newlyParsed: Track[] = [];

    // Duplicate detection helper
    const existingSignatures = new Set(
      allTracks.map((t) => `${t.title.toLowerCase()}___${t.artist.toLowerCase()}`)
    );

    let skippedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgressMsg(`Parsing [${i + 1}/${files.length}]: ${file.name}...`);

      try {
        const { track, blob } = await parseMediaFile(file);
        const sig = `${track.title.toLowerCase()}___${track.artist.toLowerCase()}`;

        if (existingSignatures.has(sig)) {
          skippedCount++;
        } else {
          existingSignatures.add(sig);
          await dbManager.saveTrack(track, blob);
          newlyParsed.push(track);
        }
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
      }
    }

    if (newlyParsed.length > 0) {
      await addTracks(newlyParsed);
      await refreshTracks();
      setImportedList(newlyParsed);
      if (onImportComplete) {
        onImportComplete(newlyParsed.length);
      }
    }

    if (newlyParsed.length === 0 && skippedCount > 0) {
      setErrorMsg(`All ${skippedCount} file(s) already exist in your local library.`);
    } else if (newlyParsed.length === 0) {
      setErrorMsg('No valid audio or video files found in selection.');
    }

    setIsProcessing(false);
    setProgressMsg('');
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer) {
      setIsProcessing(true);
      setProgressMsg('Extracting files and folders recursively...');
      const report = await extractFilesFromDataTransfer(e.dataTransfer);
      await processFileList(report.files);
    }
  };

  const onFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFileList(Array.from(e.target.files));
    }
  };

  const onFolderChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFileList(Array.from(e.target.files));
    }
  };

  return (
    <div className="border border-[var(--color-term-border)] bg-[#020d0d] p-4 font-mono text-xs select-none shadow-[0_0_25px_rgba(0,255,136,0.15)]">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-term-border)] mb-3">
        <div className="flex items-center gap-2 text-[var(--color-term-green)] font-bold">
          <Upload className="w-4 h-4" />
          <span>LOCAL AUDIO & VIDEO INGEST ENGINE</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--color-term-muted)] hover:text-[var(--color-term-error)] p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden file inputs: one for individual files, one for directory folder */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,video/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.mp4,.webm,.mkv,.mov,.avi"
        onChange={onFilesChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard for folder picking
        webkitdirectory=""
        directory=""
        multiple
        onChange={onFolderChange}
        className="hidden"
      />

      {/* Drop Zone Box */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/10'
            : 'border-[var(--color-term-border)] hover:border-[var(--color-term-cyan)] bg-[#010909]'
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <FileAudio
            className={`w-8 h-8 transition-transform ${
              isDragging ? 'scale-110 text-[var(--color-term-green)]' : 'text-[var(--color-term-cyan)]'
            }`}
          />
          <Film
            className={`w-8 h-8 transition-transform ${
              isDragging ? 'scale-110 text-[var(--color-term-green)]' : 'text-[var(--color-term-green)]'
            }`}
          />
          <FolderOpen
            className={`w-8 h-8 transition-transform ${
              isDragging ? 'scale-110 text-[var(--color-term-green)]' : 'text-[var(--color-term-cyan)]'
            }`}
          />
        </div>

        <p className="font-bold text-sm text-[var(--color-term-green)] mb-1">
          DRAG & DROP SONGS, VIDEOS OR FOLDERS HERE
        </p>
        <p className="text-[11px] text-[var(--color-term-text)]">
          or click anywhere to select individual audio / video files
        </p>

        {/* Action Buttons: Choose Files or Choose Folder */}
        <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 border border-[var(--color-term-cyan)] bg-[var(--color-term-cyan)]/10 text-[var(--color-term-cyan)] hover:bg-[var(--color-term-cyan)]/20 font-bold text-[11px] flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>SELECT FILES</span>
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-3 py-1.5 border border-[var(--color-term-green)] bg-[var(--color-term-green)]/10 text-[var(--color-term-green)] hover:bg-[var(--color-term-green)]/20 font-bold text-[11px] flex items-center gap-1.5"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>SELECT FOLDER</span>
          </button>
        </div>

        <p className="text-[10px] text-[var(--color-term-dim)] mt-3">
          Audio (MP3, WAV, FLAC, OGG, M4A) • Videos (MP4, WebM, MKV with live ASCII) • Entire Directory Trees
        </p>
      </div>

      {/* Progress Feedback */}
      {isProcessing && (
        <div className="mt-3 p-2.5 border border-[var(--color-term-green)] bg-[#011414] text-[var(--color-term-green)] flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-[var(--color-term-green)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px]">{progressMsg}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-3 p-2.5 border border-[var(--color-term-error)] bg-[var(--color-term-error)]/10 text-[var(--color-term-error)] flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-[11px]">{errorMsg}</span>
        </div>
      )}

      {/* Success Ingested Tracks */}
      {importedList.length > 0 && (
        <div className="mt-3 border border-[var(--color-term-green)] bg-[#001e1e] p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[var(--color-term-green)] font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully imported {importedList.length} media item(s) to IndexedDB!</span>
          </div>
          <ul className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-[var(--color-term-text)] pr-1">
            {importedList.map((t) => (
              <li key={t.id} className="flex justify-between items-center truncate">
                <span className="flex items-center gap-1.5 truncate">
                  {t.isVideo ? (
                    <span className="text-[9px] px-1 bg-[var(--color-term-green)] text-black font-bold">
                      VIDEO
                    </span>
                  ) : (
                    <span className="text-[9px] px-1 bg-[#011e1e] text-[var(--color-term-cyan)]">
                      AUDIO
                    </span>
                  )}
                  <span className="truncate">{t.title} - {t.artist}</span>
                </span>
                <span className="text-[var(--color-term-dim)] text-[10px] ml-2 shrink-0">
                  {formatBytes(t.sizeBytes)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Local Storage Explanation & Privacy Guarantee */}
      <div className="mt-3 p-2 border border-[var(--color-term-border)] bg-[#010707] text-[10px] text-[var(--color-term-dim)] flex items-start gap-2">
        <HardDrive className="w-4 h-4 text-[var(--color-term-cyan)] shrink-0 mt-0.5" />
        <div>
          <span className="text-[var(--color-term-cyan)] font-semibold">Zero-Cloud Privacy Guarantee:</span>{' '}
          All audio & video files remain 100% strictly local in your browser via IndexedDB. Video frames are decoded
          and converted to ASCII art completely on your device.
        </div>
      </div>
    </div>
  );
}
