'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings, TerminalTheme, VisualizerMode } from '@/types/settings';
import { dbManager } from '@/lib/database/indexedDb';
import { formatBytes } from '@/lib/utils/formatters';
import {
  Settings as SettingsIcon,
  X,
  Palette,
  Monitor,
  Activity,
  HardDrive,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClose: () => void;
  onClearLibrary: () => Promise<void>;
}

export default function SettingsModal({
  settings,
  onUpdateSettings,
  onClose,
  onClearLibrary,
}: SettingsModalProps) {
  const [storageInfo, setStorageInfo] = useState<{ usedBytes: number; quotaBytes: number } | null>(
    null
  );
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  useEffect(() => {
    dbManager.getStorageEstimate().then((est) => {
      if (est) setStorageInfo(est);
    });
  }, []);

  const handleClear = async () => {
    setIsClearing(true);
    await onClearLibrary();
    setIsClearing(false);
    setConfirmClear(false);
    onClose();
  };

  const themes: { id: TerminalTheme; label: string; color: string }[] = [
    { id: 'green', label: 'HACKER GREEN', color: '#00FF88' },
    { id: 'cyan', label: 'MATRIX CYAN', color: '#00F3FF' },
    { id: 'amber', label: 'CYBER AMBER', color: '#FFB703' },
    { id: 'magenta', label: 'SYNTH MAGENTA', color: '#FF007F' },
  ];

  const visualizerModes: { id: VisualizerMode; label: string }[] = [
    { id: 'equalizer', label: 'Equalizer' },
    { id: 'waveform', label: 'Waveform' },
    { id: 'spectrum', label: 'Spectrum Bars' },
    { id: 'matrix', label: 'Matrix Rain' },
    { id: 'pulse', label: 'Audio Pulse' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono text-xs select-none">
      <div className="w-full max-w-lg border border-[var(--color-term-border)] bg-[#030909] p-4 flex flex-col gap-4 shadow-[0_0_20px_rgba(0,255,136,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-term-border)] pb-2">
          <div className="flex items-center gap-2 text-[var(--color-term-green)] font-bold text-sm">
            <SettingsIcon className="w-4 h-4" />
            <span>NUGI_OS // SYSTEM PREFERENCES</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-term-muted)] hover:text-[var(--color-term-error)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Theme Palette */}
          <div>
            <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>TERMINAL COLOR SCHEME</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`p-2 border flex items-center justify-between transition-all ${
                    settings.theme === t.id
                      ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold'
                      : 'border-[var(--color-term-border)] bg-[#010909] text-[var(--color-term-text)] hover:border-[var(--color-term-cyan)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-black/40"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-[11px]">{t.label}</span>
                  </div>
                  {settings.theme === t.id && <CheckCircle className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Display Effects */}
          <div>
            <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" />
              <span>CRT & VISUAL DISPLAY</span>
            </div>
            <div className="space-y-2 border border-[var(--color-term-border)] p-2.5 bg-[#010909]">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[var(--color-term-text)]">CRT Scanlines Overlay</span>
                <input
                  type="checkbox"
                  checked={settings.crtScanlines}
                  onChange={(e) => onUpdateSettings({ crtScanlines: e.target.checked })}
                  className="accent-[var(--color-term-green)] cursor-pointer w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[var(--color-term-text)]">Screen Glow Aesthetics</span>
                <input
                  type="checkbox"
                  checked={settings.screenGlow}
                  onChange={(e) => onUpdateSettings({ screenGlow: e.target.checked })}
                  className="accent-[var(--color-term-green)] cursor-pointer w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[var(--color-term-text)]">Prefers Reduced Motion</span>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
                  className="accent-[var(--color-term-green)] cursor-pointer w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Default Visualizer Mode */}
          <div>
            <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>DEFAULT VISUALIZER ENGINE</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visualizerModes.map((vm) => (
                <button
                  key={vm.id}
                  onClick={() => onUpdateSettings({ visualizerMode: vm.id })}
                  className={`p-2 border text-center transition-all ${
                    settings.visualizerMode === vm.id
                      ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold'
                      : 'border-[var(--color-term-border)] bg-[#010909] text-[var(--color-term-text)] hover:border-[var(--color-term-cyan)]'
                  }`}
                >
                  {vm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Storage Information & Purge */}
          <div>
            <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span>INDEXEDDB STORAGE USAGE</span>
            </div>
            <div className="border border-[var(--color-term-border)] bg-[#010909] p-3 space-y-2">
              {storageInfo ? (
                <div>
                  <div className="flex justify-between text-[11px] text-[var(--color-term-text)] mb-1">
                    <span>Storage Utilized:</span>
                    <span className="text-[var(--color-term-green)] font-bold">
                      {formatBytes(storageInfo.usedBytes)} / {formatBytes(storageInfo.quotaBytes)}
                    </span>
                  </div>
                  <div className="w-full bg-[#001414] h-2 border border-[var(--color-term-border)] overflow-hidden">
                    <div
                      className="bg-[var(--color-term-green)] h-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (storageInfo.usedBytes / (storageInfo.quotaBytes || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-[var(--color-term-dim)]">
                  Persistent Browser Storage: Active
                </div>
              )}

              {/* Clear Local Data */}
              <div className="pt-2 border-t border-[var(--color-term-border)]">
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--color-term-error)] text-[var(--color-term-error)] hover:bg-[var(--color-term-error)]/10 transition-colors w-full justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge All Imported Library Data</span>
                  </button>
                ) : (
                  <div className="border border-[var(--color-term-error)] bg-[var(--color-term-error)]/10 p-2.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-[var(--color-term-error)] font-bold text-[11px]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Are you sure? This will delete all songs and playlists from IndexedDB.</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="px-2 py-1 border border-[var(--color-term-border)] text-[var(--color-term-dim)] hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClear}
                        disabled={isClearing}
                        className="px-2 py-1 bg-[var(--color-term-error)] text-black font-bold hover:bg-red-400"
                      >
                        {isClearing ? 'Purging...' : 'Confirm Purge'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
