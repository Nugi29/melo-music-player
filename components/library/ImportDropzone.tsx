'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { parseAudioFile } from '@/lib/metadata/parser';
import { dbManager } from '@/lib/database/indexedDb';
import { useAudio } from '@/lib/audio/AudioEngine';
import { Track } from '@/types/music';
import { Upload, FileAudio, CheckCircle2, AlertTriangle, X, HardDrive } from 'lucide-react';
import { formatBytes } from '@/lib/utils/formatters';

interface ImportDropzoneProps {
  onClose?: () => void;
  onImportComplete?: (tracksCount: number) => void;
}

const SUPPORTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'audio/mp4',
  'audio/m4a',
];

export default function ImportDropzone({ onClose, onImportComplete }: ImportDropzoneProps) {
  const { allTracks, addTracks } = useAudio();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [importedList, setImportedList] = useState<Track[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
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

      // File validation
      const isAudio =
        file.type.startsWith('audio/') ||
        SUPPORTED_MIME_TYPES.includes(file.type) ||
        /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name);

      if (!isAudio) {
        console.warn(`File ${file.name} is not recognized as audio`);
        continue;
      }

      try {
        const { track, blob } = await parseAudioFile(file);
        const sig = `${track.title.toLowerCase()}___${track.artist.toLowerCase()}`;

        if (existingSignatures.has(sig)) {
          skippedCount++;
        } else {
          existingSignatures.add(sig);
          // Save file to IndexedDB
          await dbManager.saveTrack(track, blob);
          newlyParsed.push(track);
        }
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
      }
    }

    if (newlyParsed.length > 0) {
      await addTracks(newlyParsed);
      setImportedList(newlyParsed);
      if (onImportComplete) {
        onImportComplete(newlyParsed.length);
      }
    }

    if (newlyParsed.length === 0 && skippedCount > 0) {
      setErrorMsg(`All ${skippedCount} file(s) already exist in your local library.`);
    } else if (newlyParsed.length === 0) {
      setErrorMsg('No valid audio files found in selection.');
    }

    setIsProcessing(false);
    setProgressMsg('');
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="border border-[var(--color-term-border)] bg-[#020d0d] p-4 font-mono text-xs select-none">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-term-border)] mb-3">
        <div className="flex items-center gap-2 text-[var(--color-term-green)] font-bold">
          <Upload className="w-4 h-4" />
          <span>LOCAL AUDIO INGEST ENGINE</span>
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
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
          onChange={onInputChange}
          className="hidden"
        />

        <FileAudio
          className={`w-10 h-10 mb-2 transition-transform ${
            isDragging ? 'scale-110 text-[var(--color-term-green)]' : 'text-[var(--color-term-cyan)]'
          }`}
        />

        <p className="font-bold text-sm text-[var(--color-term-cyan)] mb-1">
          DRAG & DROP AUDIO FILES HERE
        </p>
        <p className="text-[11px] text-[var(--color-term-text)]">
          or click anywhere to open local file explorer
        </p>
        <p className="text-[10px] text-[var(--color-term-dim)] mt-2">
          Formats: MP3, WAV, OGG, FLAC, M4A // Multi-file selection supported
        </p>
      </div>

      {/* Progress Feedback */}
      {isProcessing && (
        <div className="mt-3 p-2 border border-[var(--color-term-border)] bg-[#011414] text-[var(--color-term-green)] flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-[var(--color-term-green)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px]">{progressMsg}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-3 p-2 border border-[var(--color-term-error)] bg-[var(--color-term-error)]/10 text-[var(--color-term-error)] flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-[11px]">{errorMsg}</span>
        </div>
      )}

      {/* Success Ingested Tracks */}
      {importedList.length > 0 && (
        <div className="mt-3 border border-[var(--color-term-green)] bg-[#001e1e] p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[var(--color-term-green)] font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully imported {importedList.length} track(s) to IndexedDB!</span>
          </div>
          <ul className="max-h-24 overflow-y-auto space-y-0.5 text-[11px] text-[var(--color-term-text)] pr-1">
            {importedList.map((t) => (
              <li key={t.id} className="flex justify-between truncate">
                <span>{t.title} - {t.artist}</span>
                <span className="text-[var(--color-term-dim)]">{formatBytes(t.sizeBytes)}</span>
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
          All audio files remain 100% strictly local in your browser via IndexedDB. No audio is ever uploaded
          to any external server.
        </div>
      </div>
    </div>
  );
}
