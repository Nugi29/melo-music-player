'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings, TerminalTheme, VisualizerMode, Mp3VisualDesign, AsciiQualityProfile } from '@/types/settings';
import { DspShaderSettings, DitherMatrixMode } from '@/components/terminal-os/types';
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
  Film,
  Cpu,
  Layers,
  Sparkles,
  Sliders,
  Volume2,
  RefreshCw,
  Maximize2,
} from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  dspSettings?: DspShaderSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onUpdateDspSettings?: (newSettings: Partial<DspShaderSettings>) => void;
  onClose: () => void;
  onClearLibrary: () => Promise<void>;
}

type SettingsTab = 'themes' | 'video' | 'dsp' | 'storage';

export default function SettingsModal({
  settings,
  dspSettings,
  onUpdateSettings,
  onUpdateDspSettings,
  onClose,
  onClearLibrary,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('video');
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

  // Helper to sync changes across both UserSettings and DspShaderSettings
  const applyDspUpdate = (updates: Partial<DspShaderSettings>) => {
    onUpdateDspSettings?.(updates);
    onUpdateSettings({
      ...(updates.mp3VisualDesign ? { mp3VisualDesign: updates.mp3VisualDesign } : {}),
      ...(updates.ditherMode ? { ditherMode: updates.ditherMode } : {}),
      ...(updates.scanlineDensity !== undefined ? { scanlineDensity: updates.scanlineDensity } : {}),
      ...(updates.phosphorBloom !== undefined ? { phosphorBloom: updates.phosphorBloom } : {}),
      ...(updates.curvatureBarrel !== undefined ? { curvatureBarrel: updates.curvatureBarrel } : {}),
      ...(updates.noiseVhsGlitch !== undefined ? { noiseVhsGlitch: updates.noiseVhsGlitch } : {}),
      ...(updates.charsetProfile ? { charsetProfile: updates.charsetProfile } : {}),
      ...(updates.freezeOnStop !== undefined ? { freezeOnStop: updates.freezeOnStop } : {}),
      ...(updates.resolutionProfile ? { resolutionProfile: updates.resolutionProfile } : {}),
    });
  };

  // 1. Color Themes
  const themes: { id: TerminalTheme; label: string; color: string; desc: string }[] = [
    { id: 'green', label: 'HACKER GREEN', color: '#00FF88', desc: 'Classic Phosphor Matrix P1' },
    { id: 'cyan', label: 'MATRIX CYAN', color: '#00F3FF', desc: 'Cyberpunk High-Tech Neon Blue' },
    { id: 'amber', label: 'CYBER AMBER', color: '#FFB703', desc: 'VT220 Vintage Industrial Amber' },
    { id: 'magenta', label: 'SYNTH MAGENTA', color: '#FF007F', desc: 'Outrun Synthwave Neon Pink' },
  ];

  // 2. MP3 Video Visual Designs
  const mp3Designs: {
    id: Mp3VisualDesign;
    title: string;
    tag: string;
    icon: string;
    desc: string;
  }[] = [
    {
      id: 'matrix-rain',
      title: 'Matrix Katakana Rain',
      tag: 'DIGITAL STREAM',
      icon: '01',
      desc: 'Cascading cyber glyphs reactive to music tempo, treble bursts, and pitch energy.',
    },
    {
      id: 'hologram-globe',
      title: '3D Hologram Globe',
      tag: '3D WIREFRAME',
      icon: '⊕',
      desc: 'Wireframe rotating 3D planetary mesh pulsating with audio bass kicks.',
    },
    {
      id: 'synth-horizon',
      title: 'Synthwave Horizon',
      tag: 'OUTRUN 80s',
      icon: '◬',
      desc: 'Retro perspective grid highway, parallax mountains, and segmented neon sun.',
    },
    {
      id: 'warp-tunnel',
      title: 'Hyperspace Tunnel',
      tag: 'WARP SPEED',
      icon: '◎',
      desc: 'Infinite 3D hyperspace tunnel with audio-reactive expanding ASCII rings.',
    },
    {
      id: 'reactor-core',
      title: 'Cyber Reactor Core',
      tag: 'TELEMETRY RADAR',
      icon: '☢',
      desc: 'Counter-rotating telemetry radar rings around a high-energy plasma audio vortex.',
    },
    {
      id: 'cyber-waveform',
      title: 'Cyber Scope Waveform',
      tag: 'OSCILLOSCOPE',
      icon: '∿',
      desc: 'Dual stereo oscilloscope and mirrored real-time frequency landscape.',
    },
    {
      id: 'isometric-bars',
      title: '3D Isometric VFD Bars',
      tag: 'GRAPHIC EQ',
      icon: '▥',
      desc: '32-band 2.5D isometric spectrum pillars with floating peak needles & reflections.',
    },
    {
      id: 'cyber-city',
      title: 'Cyberpunk Skyline',
      tag: 'NEO-CITY',
      icon: '🏙',
      desc: 'Skyscraper skyline with audio-pulsed windows, billboards, and sweeping searchlights.',
    },
  ];

  // 3. Dithering Modes
  const ditherModes: { id: DitherMatrixMode; label: string; desc: string }[] = [
    { id: 'bayer8x8', label: 'Bayer 8x8 Ordered', desc: 'Crisp dot-matrix ordered dither' },
    { id: 'floyd', label: 'Floyd-Steinberg', desc: 'Smooth error-diffusion retro gradients' },
    { id: 'atkinson', label: 'Atkinson MacPaint', desc: 'High-contrast 1-bit Macintosh halftone' },
    { id: 'sierra', label: 'Sierra Katakana', desc: 'Dense phosphor matrix glyph diffusion' },
  ];

  // 4. Charset Profiles
  const charsets = [
    { id: 'Cyber Glyphs [.,:;+*#%@]', label: 'Cyber Glyphs', preview: '/\\|><{}[]()#*+=-_~' },
    { id: 'Standard ASCII [ .:-=+*#%@]', label: 'Standard ASCII', preview: ' .:-=+*#%@' },
    { id: 'Dense Blocks [░▒▓█]', label: 'Dense Blocks', preview: ' ░▒▓█' },
    { id: 'Matrix Katakana [01ｦｱｳｴ]', label: 'Matrix Katakana', preview: '01ｦｱｳｴｵｶｷｹｺｻｼｽｾ' },
  ];

  // 5. Visualizer Modes
  const visualizerModes: { id: VisualizerMode; label: string }[] = [
    { id: 'equalizer', label: 'Equalizer' },
    { id: 'waveform', label: 'Waveform' },
    { id: 'spectrum', label: 'Spectrum Bars' },
    { id: 'matrix', label: 'Matrix Rain' },
    { id: 'pulse', label: 'Audio Pulse' },
  ];

  const resolutionProfiles: { id: AsciiQualityProfile; label: string; desc: string }[] = [
    { id: 'ASCII-Retro', label: 'ASCII-Retro (54c)', desc: 'Chunky phosphor 80s arcade terminal' },
    { id: 'ASCII-Std', label: 'ASCII-Std (80c)', desc: 'Standard classic VT100 density' },
    { id: 'ASCII-HQ', label: 'ASCII-HQ (110c)', desc: 'High-density sharp cyberpunk matrix' },
    { id: 'ASCII-Ultra', label: 'ASCII-Ultra (140c)', desc: 'Ultra-fine micro glyph resolution' },
    {
      id: 'ASCII-Pro',
      label: 'ASCII-Pro (Holo 220c)',
      desc: 'Pro Density Holo Cinema (Maximum fidelity micro-glyph matrix)',
    },
  ];

  const currentVisualDesign =
    dspSettings?.mp3VisualDesign || settings.mp3VisualDesign || 'matrix-rain';
  const freezeOnStop =
    dspSettings?.freezeOnStop !== undefined
      ? dspSettings.freezeOnStop
      : settings.freezeOnStop !== false;
  const currentDitherMode = dspSettings?.ditherMode || settings.ditherMode || 'bayer8x8';
  const currentResolutionProfile =
    dspSettings?.resolutionProfile || settings.resolutionProfile || 'ASCII-Std';
  const scanlineDensity = dspSettings?.scanlineDensity ?? settings.scanlineDensity ?? 72;
  const phosphorBloom = dspSettings?.phosphorBloom ?? settings.phosphorBloom ?? 85;
  const curvatureBarrel = dspSettings?.curvatureBarrel ?? settings.curvatureBarrel ?? 30;
  const noiseVhsGlitch = dspSettings?.noiseVhsGlitch ?? settings.noiseVhsGlitch ?? 15;
  const charsetProfile =
    dspSettings?.charsetProfile || settings.charsetProfile || 'Cyber Glyphs [.,:;+*#%@]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 font-mono text-xs select-none animate-fadeIn">
      <div className="w-full max-w-2xl border border-[var(--color-term-border-bright)] bg-[var(--color-term-surface)] flex flex-col shadow-[0_0_30px_var(--color-term-glow)] max-h-[90vh]">
        {/* Modal Window Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-term-border)] px-4 py-2.5 bg-[var(--color-term-bg)]">
          <div className="flex items-center gap-2 text-[var(--color-term-green)] font-bold text-sm tracking-wide">
            <SettingsIcon className="w-4 h-4 animate-spin-slow" />
            <span>MELO_OS // SYSTEM CONFIGURATION &amp; DSP MATRIX</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-term-muted)] hover:text-[var(--color-term-error)] transition-colors cursor-pointer"
            title="Close Settings [ESC]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-[var(--color-term-border)] bg-[var(--color-term-bg)]/80 overflow-x-auto text-[11px]">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-2 border-r border-[var(--color-term-border)] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'video'
                ? 'bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold border-b-2 border-b-[var(--color-term-green)]'
                : 'text-[var(--color-term-text)] hover:text-white hover:bg-[var(--color-term-border)]/20'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>MP3 VIDEO ENGINES</span>
            <span className="text-[9px] px-1 bg-[var(--color-term-green)]/20 text-[var(--color-term-green)] border border-[var(--color-term-green)]/40 rounded-xs">
              8
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dsp')}
            className={`flex items-center gap-1.5 px-3 py-2 border-r border-[var(--color-term-border)] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dsp'
                ? 'bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold border-b-2 border-b-[var(--color-term-green)]'
                : 'text-[var(--color-term-text)] hover:text-white hover:bg-[var(--color-term-border)]/20'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>CRT SHADER &amp; DSP</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`flex items-center gap-1.5 px-3 py-2 border-r border-[var(--color-term-border)] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'themes'
                ? 'bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold border-b-2 border-b-[var(--color-term-green)]'
                : 'text-[var(--color-term-text)] hover:text-white hover:bg-[var(--color-term-border)]/20'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>PALETTE &amp; THEMES</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-1.5 px-3 py-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'storage'
                ? 'bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold border-b-2 border-b-[var(--color-term-green)]'
                : 'text-[var(--color-term-text)] hover:text-white hover:bg-[var(--color-term-border)]/20'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>AUDIO &amp; STORAGE</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-4 overflow-y-auto space-y-4 max-h-[calc(85vh-120px)] custom-scrollbar">
          {/* ======================================================== */}
          {/* TAB 1: MP3 VIDEO ENGINES & HALT BEHAVIOR */}
          {/* ======================================================== */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              {/* Halt On Stop Banner Control */}
              <div className="border border-[var(--color-term-green)] bg-[var(--color-term-green)]/10 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[var(--color-term-green)] font-bold text-xs">
                    <span className="text-base">❚❚</span>
                    <span>HALT VIDEO ANIMATION WHEN MP3 STOPS / PAUSED</span>
                  </div>
                  <p className="text-[10px] text-[var(--color-term-text)] leading-relaxed">
                    When enabled, all procedural 3D/ASCII video rendering freezes in place, drops
                    GPU compute to 0 FPS, and displays the standby telemetry banner until playback
                    resumes.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer flex-none">
                  <span
                    className={`font-bold text-[10px] ${
                      freezeOnStop
                        ? 'text-[var(--color-term-green)]'
                        : 'text-[var(--color-term-muted)]'
                    }`}
                  >
                    {freezeOnStop ? 'HALT ON STOP: ON' : 'CONTINUOUS: OFF'}
                  </span>
                  <input
                    type="checkbox"
                    checked={freezeOnStop}
                    onChange={(e) => applyDspUpdate({ freezeOnStop: e.target.checked })}
                    className="accent-[var(--color-term-green)] cursor-pointer w-4 h-4"
                  />
                </label>
              </div>

              {/* MP3 Visual Designs Grid */}
              <div>
                <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    <span>SELECT ACTIVE MP3 MAIN WINDOW VIDEO DESIGN</span>
                  </span>
                  <span className="text-[10px] text-[var(--color-term-dim)]">
                    Total: {mp3Designs.length} Engines Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mp3Designs.map((d) => {
                    const isSelected = currentVisualDesign === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => applyDspUpdate({ mp3VisualDesign: d.id })}
                        className={`p-2.5 border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] neon-box-glow'
                            : 'border-[var(--color-term-border)] bg-[var(--color-term-bg)] text-[var(--color-term-text)] hover:border-[var(--color-term-cyan)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-[var(--color-term-surface)] border border-[var(--color-term-border)]">
                              {d.icon}
                            </span>
                            <span className="font-bold text-[11px]">{d.title}</span>
                          </div>
                          <span className="text-[9px] px-1 py-0.5 border border-current opacity-70">
                            {d.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--color-term-muted)] line-clamp-2">
                          {d.desc}
                        </p>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[9px] text-[var(--color-term-green)] font-bold mt-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>ACTIVE RENDER PIPELINE</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Animation Intensity / Audio Reactivity Slider */}
              <div className="border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--color-term-text)] font-bold">
                    Audio FFT Audio Reactivity Multiplier
                  </span>
                  <span className="text-[var(--color-term-green)] font-bold">
                    {(settings.animationIntensity || 1.0).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.8"
                  step="0.1"
                  value={settings.animationIntensity || 1.0}
                  onChange={(e) =>
                    onUpdateSettings({ animationIntensity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[var(--color-term-green)] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-[var(--color-term-dim)]">
                  <span>0.2x (Subtle Pulse)</span>
                  <span>1.0x (Calibrated Balance)</span>
                  <span>1.8x (Hyper Transients)</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CRT SHADER & ASCII DSP MATRIX */}
          {/* ======================================================== */}
          {activeTab === 'dsp' && (
            <div className="space-y-4">
              {/* ASCII Resolution & Density Profile */}
              <div>
                <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>ASCII RESOLUTION &amp; GRID DENSITY</span>
                  </span>
                  <span className="text-[10px] text-[var(--color-term-dim)]">
                    Current: {currentResolutionProfile}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {resolutionProfiles.map((rp) => {
                    const isSelected = currentResolutionProfile === rp.id;
                    return (
                      <button
                        key={rp.id}
                        onClick={() => applyDspUpdate({ resolutionProfile: rp.id })}
                        className={`p-2 border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold'
                            : 'border-[var(--color-term-border)] bg-[var(--color-term-bg)] text-[var(--color-term-text)] hover:border-[var(--color-term-cyan)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px]">{rp.label}</span>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <p className="text-[9px] text-[var(--color-term-muted)] mt-0.5">{rp.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dithering Mode Selector */}
              <div>
                <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>DITHERING MATRIX ALGORITHM</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ditherModes.map((dm) => {
                    const isSelected = currentDitherMode === dm.id;
                    return (
                      <button
                        key={dm.id}
                        onClick={() => applyDspUpdate({ ditherMode: dm.id })}
                        className={`p-2 border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold'
                            : 'border-[var(--color-term-border)] bg-[var(--color-term-bg)] text-[var(--color-term-text)] hover:border-[var(--color-term-cyan)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px]">{dm.label}</span>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <p className="text-[9px] text-[var(--color-term-muted)] mt-0.5">{dm.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Charset Profiles */}
              <div>
                <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>ASCII CHAR SET &amp; FONT MATRIX</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {charsets.map((cs) => {
                    const isSelected = charsetProfile === cs.id;
                    return (
                      <button
                        key={cs.id}
                        onClick={() => applyDspUpdate({ charsetProfile: cs.id })}
                        className={`p-2 border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold'
                            : 'border-[var(--color-term-border)] bg-[var(--color-term-bg)] text-[var(--color-term-text)] hover:border-[var(--color-term-cyan)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px]">{cs.label}</span>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[10px] text-[var(--color-term-cyan)] block truncate mt-1 bg-[var(--color-term-surface)] px-1 py-0.5 border border-[var(--color-term-border)]">
                          {cs.preview}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Realtime Shader Sliders */}
              <div className="border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-3 space-y-3">
                <div className="text-[11px] font-bold text-[var(--color-term-cyan)] flex items-center justify-between">
                  <span>CRT ANALOG EMULATION &amp; POST-PROCESSING</span>
                  <button
                    onClick={() =>
                      applyDspUpdate({
                        scanlineDensity: 72,
                        phosphorBloom: 85,
                        curvatureBarrel: 30,
                        noiseVhsGlitch: 15,
                      })
                    }
                    className="flex items-center gap-1 text-[9px] text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                {/* Scanline Density */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[var(--color-term-text)]">Scanline Density</span>
                    <span className="text-[var(--color-term-green)] font-bold">
                      {scanlineDensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scanlineDensity}
                    onChange={(e) =>
                      applyDspUpdate({ scanlineDensity: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[var(--color-term-green)] cursor-pointer"
                  />
                </div>

                {/* Phosphor Bloom */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[var(--color-term-text)]">Phosphor Bloom &amp; Glow</span>
                    <span className="text-[var(--color-term-green)] font-bold">
                      {phosphorBloom}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={phosphorBloom}
                    onChange={(e) =>
                      applyDspUpdate({ phosphorBloom: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[var(--color-term-green)] cursor-pointer"
                  />
                </div>

                {/* Curvature / Barrel */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[var(--color-term-text)]">CRT Barrel Curvature</span>
                    <span className="text-[var(--color-term-green)] font-bold">
                      {curvatureBarrel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={curvatureBarrel}
                    onChange={(e) =>
                      applyDspUpdate({ curvatureBarrel: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[var(--color-term-green)] cursor-pointer"
                  />
                </div>

                {/* VHS Glitch Noise */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[var(--color-term-text)]">VHS Tape Glitch &amp; Noise</span>
                    <span className="text-[var(--color-term-green)] font-bold">
                      {noiseVhsGlitch}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={noiseVhsGlitch}
                    onChange={(e) =>
                      applyDspUpdate({ noiseVhsGlitch: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[var(--color-term-green)] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PALETTE & THEMES */}
          {/* ======================================================== */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              {/* Color Scheme Grid */}
              <div>
                <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>TERMINAL COLOR SCHEME &amp; PHOSPHOR EMULATION</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateSettings({ theme: t.id })}
                      className={`p-3 border flex flex-col justify-between transition-all cursor-pointer ${
                        settings.theme === t.id
                          ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold neon-box-glow'
                          : 'border-[var(--color-term-border)] bg-[var(--color-term-bg)] text-[var(--color-term-text)] hover:border-[var(--color-term-cyan)]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/50 shadow-sm"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="text-[11px] font-bold">{t.label}</span>
                        </div>
                        {settings.theme === t.id && (
                          <CheckCircle className="w-3.5 h-3.5 text-[var(--color-term-green)]" />
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--color-term-muted)] mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Overlays & Screen Effects */}
              <div>
                <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>GLOBAL DISPLAY TOGGLES</span>
                </div>
                <div className="space-y-2 border border-[var(--color-term-border)] p-3 bg-[var(--color-term-bg)]">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[var(--color-term-text)]">
                      CRT Scanlines Overlay (Global Viewport)
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.crtScanlines}
                      onChange={(e) => onUpdateSettings({ crtScanlines: e.target.checked })}
                      className="accent-[var(--color-term-green)] cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[var(--color-term-text)]">
                      Screen Glow &amp; Ambient Neon Bloom
                    </span>
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
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: AUDIO & STORAGE */}
          {/* ======================================================== */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              {/* Default Visualizer Mode */}
              <div>
                <div className="text-[11px] font-bold text-[var(--color-term-cyan)] mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>BOTTOM DECK AUDIO VISUALIZER MODE</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {visualizerModes.map((vm) => (
                    <button
                      key={vm.id}
                      onClick={() => onUpdateSettings({ visualizerMode: vm.id })}
                      className={`p-2 border text-center transition-all cursor-pointer ${
                        settings.visualizerMode === vm.id
                          ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold'
                          : 'border-[var(--color-term-border)] bg-[var(--color-term-bg)] text-[var(--color-term-text)] hover:border-[var(--color-term-cyan)]'
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
                  <span>PERSISTENT INDEXEDDB STORAGE</span>
                </div>
                <div className="border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-3 space-y-3">
                  {storageInfo ? (
                    <div>
                      <div className="flex justify-between text-[11px] text-[var(--color-term-text)] mb-1">
                        <span>Storage Allocation:</span>
                        <span className="text-[var(--color-term-green)] font-bold">
                          {formatBytes(storageInfo.usedBytes)} / {formatBytes(storageInfo.quotaBytes)}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-term-surface)] h-2 border border-[var(--color-term-border)] overflow-hidden">
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
                      Persistent Browser Storage: IndexedDB Online
                    </div>
                  )}

                  {/* Clear Local Data */}
                  <div className="pt-2 border-t border-[var(--color-term-border)]">
                    {!confirmClear ? (
                      <button
                        onClick={() => setConfirmClear(true)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-[var(--color-term-error)] text-[var(--color-term-error)] hover:bg-[var(--color-term-error)]/15 transition-colors w-full justify-center cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge All Imported Songs &amp; Playlists</span>
                      </button>
                    ) : (
                      <div className="border border-[var(--color-term-error)] bg-[var(--color-term-error)]/10 p-3 space-y-2.5">
                        <div className="flex items-center gap-2 text-[var(--color-term-error)] font-bold text-[11px]">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            CRITICAL ACTION: This permanently removes all imported audio files,
                            streams, and playlists from local storage.
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setConfirmClear(false)}
                            className="px-3 py-1 border border-[var(--color-term-border)] text-[var(--color-term-dim)] hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleClear}
                            disabled={isClearing}
                            className="px-3 py-1 bg-[var(--color-term-error)] text-black font-bold hover:bg-red-400 cursor-pointer"
                          >
                            {isClearing ? 'Purging Database...' : 'Confirm Purge'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Window Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--color-term-border)] bg-[var(--color-term-bg)]">
          <div className="text-[10px] text-[var(--color-term-dim)]">
            <span>MELO_OS v2.4 // DSP CORE ONLINE</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold hover:bg-[var(--color-term-green)]/25 cursor-pointer neon-box-glow text-xs"
          >
            SAVE &amp; CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
