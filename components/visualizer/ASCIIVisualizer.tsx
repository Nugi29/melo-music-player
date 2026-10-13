'use client';

import React, { useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { VisualizerMode } from '@/types/settings';

interface ASCIIVisualizerProps {
  mode?: VisualizerMode;
  height?: number; // character rows
  width?: number; // character columns
  className?: string;
  onModeChange?: (mode: VisualizerMode) => void;
}

const MATRIX_CHARS = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';

export default function ASCIIVisualizer({
  mode = 'equalizer',
  height = 9,
  width = 34,
  className = '',
  onModeChange,
}: ASCIIVisualizerProps) {
  const { isPlaying, getAnalyserData } = useAudio();
  const preRef = useRef<HTMLPreElement | null>(null);
  const matrixDropsRef = useRef<number[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const smoothHeightsRef = useRef<number[]>([]);

  // Arrays for Web Audio analysis
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));
  const timeDataRef = useRef<Uint8Array>(new Uint8Array(64));

  // Initialize matrix drops and smooth heights
  useEffect(() => {
    matrixDropsRef.current = Array.from({ length: width }, () => Math.floor(Math.random() * height));
    smoothHeightsRef.current = Array.from({ length: 32 }, () => 0);
  }, [width, height]);

  useEffect(() => {
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      // Fetch latest analyser data from Web Audio API
      getAnalyserData(freqDataRef.current, timeDataRef.current);
      const freq = freqDataRef.current;
      const time = timeDataRef.current;

      // Calculate real audio energy
      let sum = 0;
      for (let i = 0; i < freq.length; i++) {
        sum += freq[i];
      }

      // If playing but raw sum is zero (e.g. before initial buffer flows), provide rhythmic fallback
      const hasRealAudio = sum > 0;
      let effectiveAvgEnergy = 0;

      if (isPlaying) {
        if (hasRealAudio) {
          effectiveAvgEnergy = sum / freq.length;
        } else {
          // Rhythmic fallback pulse based on elapsed time
          const beat = (now / 1000) * 2;
          effectiveAvgEnergy = 40 + Math.abs(Math.sin(beat * Math.PI)) * 50;
        }
      }

      const normalizedEnergy = Math.min(1, effectiveAvgEnergy / 150);
      let textOutput = '';

      switch (mode) {
        // --- 1. ASCII EQUALIZER ---
        case 'equalizer': {
          const numBars = Math.min(width, 22);
          const barHeights: number[] = [];
          const smooth = smoothHeightsRef.current;

          for (let b = 0; b < numBars; b++) {
            let rawVal = 0;

            if (isPlaying) {
              if (hasRealAudio) {
                // Logarithmic frequency bin mapping: lower bins for bass, higher bins for mids/treble
                const logIndex = Math.min(63, Math.floor(Math.pow(b / numBars, 1.4) * 50));
                // High frequency energy compensation boost
                const trebleBoost = 1 + (b / numBars) * 2.2;
                rawVal = Math.min(255, freq[logIndex] * trebleBoost);
              } else {
                // Procedural rhythmic wave fallback
                const phase = (now * 0.006) + (b * 0.4);
                rawVal = (Math.sin(phase) * 0.5 + 0.5) * (120 + Math.sin(now * 0.01) * 80);
              }
            }

            // Target height
            const targetH = Math.round((rawVal / 255) * height);
            // Smooth decay: quick rise, smooth drop
            const prevH = smooth[b] || 0;
            const nextH = targetH > prevH ? targetH : Math.max(0, prevH - 0.35);
            smooth[b] = nextH;
            barHeights.push(Math.round(nextH));
          }

          const rows: string[] = [];
          for (let row = height; row >= 1; row--) {
            let rowStr = '';
            for (let b = 0; b < numBars; b++) {
              const h = barHeights[b];
              if (h >= row) {
                if (h === row) {
                  rowStr += '▄';
                } else if (h - row > 2) {
                  rowStr += '█';
                } else {
                  rowStr += '▓';
                }
              } else if (h === row - 1) {
                rowStr += '░';
              } else {
                rowStr += ' ';
              }
              rowStr += ' ';
            }
            rows.push(rowStr);
          }
          textOutput = rows.join('\n');
          break;
        }

        // --- 2. WAVEFORM (Oscilloscope) ---
        case 'waveform': {
          const grid: string[][] = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => ' ')
          );

          const midRow = Math.floor(height / 2);

          for (let col = 0; col < width; col++) {
            let rawVal = 0;
            if (isPlaying) {
              if (hasRealAudio) {
                const timeIndex = Math.floor((col / width) * time.length);
                rawVal = (time[timeIndex] - 128) / 128;
              } else {
                rawVal = Math.sin((now * 0.015) + (col * 0.3)) * 0.7;
              }
            }

            const targetRow = Math.max(
              0,
              Math.min(height - 1, midRow - Math.round(rawVal * (height / 2)))
            );
            grid[targetRow][col] = isPlaying
              ? Math.abs(rawVal) > 0.35
                ? '█'
                : '■'
              : '-';
          }

          textOutput = grid.map((r) => r.join('')).join('\n');
          break;
        }

        // --- 3. SPECTRUM BARS ---
        case 'spectrum': {
          const getBandVal = (idx: number, fallbackPhase: number) => {
            if (!isPlaying) return 0;
            if (hasRealAudio) return Math.min(255, freq[idx] * (1 + idx * 0.03));
            return Math.min(255, (Math.sin(now * 0.008 + fallbackPhase) * 0.5 + 0.5) * 220);
          };

          const bands = [
            { name: 'SUB ', val: getBandVal(2, 0) },
            { name: 'BASS', val: getBandVal(6, 1) },
            { name: 'LOW ', val: getBandVal(12, 2) },
            { name: 'MID ', val: getBandVal(22, 3) },
            { name: 'HIGH', val: getBandVal(34, 4) },
            { name: 'AIR ', val: getBandVal(48, 5) },
          ];

          const maxBarWidth = Math.max(12, width - 13);
          const rows: string[] = [];

          bands.forEach((band) => {
            const fillLength = Math.max(
              0,
              Math.min(maxBarWidth, Math.round((band.val / 255) * maxBarWidth))
            );
            const barChars =
              '█'.repeat(Math.floor(fillLength * 0.7)) +
              '▓'.repeat(Math.floor(fillLength * 0.2)) +
              '░'.repeat(Math.ceil(fillLength * 0.1));
            const emptyChars = '·'.repeat(Math.max(0, maxBarWidth - fillLength));
            const percentage = Math.round((band.val / 255) * 100);
            rows.push(
              `${band.name} [${barChars}${emptyChars}] ${percentage < 10 ? ' ' : ''}${percentage}%`
            );
          });

          textOutput = rows.join('\n');
          break;
        }

        // --- 4. MATRIX RAIN (Sound Reactive) ---
        case 'matrix': {
          const dt = (now - lastTime) / 1000;
          lastTime = now;

          const drops = matrixDropsRef.current;
          const grid: string[][] = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => ' ')
          );

          const speedFactor = isPlaying ? 1 + normalizedEnergy * 4.5 : 0.8;

          for (let col = 0; col < width; col++) {
            drops[col] = (drops[col] + dt * 6 * speedFactor) % height;
            const currentHead = Math.floor(drops[col]);

            for (let trail = 0; trail < 4; trail++) {
              const y = (currentHead - trail + height) % height;
              const charIdx = Math.floor(
                (Math.sin(now * 0.005 + col + trail) + 1) * (MATRIX_CHARS.length / 2)
              );
              const char = MATRIX_CHARS[charIdx % MATRIX_CHARS.length];
              if (trail === 0) {
                grid[y][col] = isPlaying && normalizedEnergy > 0.35 ? '█' : char;
              } else {
                grid[y][col] = char;
              }
            }
          }

          textOutput = grid.map((r) => r.join('')).join('\n');
          break;
        }

        // --- 5. MINIMAL AUDIO PULSE ---
        case 'pulse': {
          const numRings = Math.max(3, Math.min(7, Math.floor(height / 2)));
          const activeRings = Math.round(normalizedEnergy * numRings);
          const rows: string[] = [];

          for (let r = 0; r < height; r++) {
            const distFromCenter = Math.abs(r - Math.floor(height / 2));
            const fillWidth = Math.min(
              width,
              Math.round((width / (distFromCenter + 1)) * (normalizedEnergy + 0.25))
            );
            const padLeft = Math.floor((width - fillWidth) / 2);

            const pad = ' '.repeat(Math.max(0, padLeft));
            const glyph = distFromCenter <= activeRings ? (isPlaying ? '▓' : '-') : '░';
            const bar = glyph.repeat(Math.max(0, fillWidth));
            const line = `${pad}${bar}${pad}`.slice(0, width);
            rows.push(line);
          }

          textOutput = rows.join('\n');
          break;
        }
      }

      if (preRef.current) {
        preRef.current.textContent = textOutput;
      }

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [mode, height, width, isPlaying, getAnalyserData]);

  const modeButtons: { key: VisualizerMode; label: string }[] = [
    { key: 'equalizer', label: 'EQ' },
    { key: 'waveform', label: 'WAVE' },
    { key: 'spectrum', label: 'SPEC' },
    { key: 'matrix', label: 'MATRIX' },
    { key: 'pulse', label: 'PULSE' },
  ];

  return (
    <div className={`flex flex-col select-none font-mono ${className}`}>
      {/* Mode Selector Mini Bar */}
      <div className="flex items-center justify-between text-[10px] pb-1 border-b border-[var(--color-term-border)] mb-1 text-[var(--color-term-muted)]">
        <span className="flex items-center gap-1 font-semibold text-[var(--color-term-green)]">
          <span>≋</span> ASCII VISUALIZER [{mode.toUpperCase()}]
        </span>
        <div className="flex items-center gap-1">
          {modeButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => onModeChange?.(btn.key)}
              className={`px-1.5 py-0.5 text-[9px] uppercase border transition-colors ${
                mode === btn.key
                  ? 'border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold'
                  : 'border-transparent text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)] hover:border-[var(--color-term-border)]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visualizer Display Output */}
      <pre
        ref={preRef}
        aria-label="Audio Visualizer Output"
        className="font-mono text-xs leading-[13px] tracking-tight text-[var(--color-term-green)] overflow-hidden whitespace-pre select-none h-24 flex items-center justify-center p-1 bg-[var(--color-term-bg)]/90 border border-[var(--color-term-border)]"
      />
    </div>
  );
}
