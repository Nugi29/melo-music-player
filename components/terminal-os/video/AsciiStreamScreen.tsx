'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { DspShaderSettings, Mp3VisualDesign } from '../types';
import { TerminalTheme } from '@/types/settings';
import { ChevronLeft, ChevronRight, Play, Pause, Layers } from 'lucide-react';

interface AsciiStreamScreenProps {
  dspSettings: DspShaderSettings;
  theme?: TerminalTheme;
  onUpdateDspSettings?: (newSettings: Partial<DspShaderSettings>) => void;
  className?: string;
}

export default function AsciiStreamScreen({
  dspSettings,
  theme = 'green',
  onUpdateDspSettings,
  className = '',
}: AsciiStreamScreenProps) {
  const { currentTrack, isPlaying, currentTime, duration, getAnalyserData, mediaElement } =
    useAudio();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  // Web Audio analyzer buffers
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));
  const timeDataRef = useRef<Uint8Array>(new Uint8Array(64));

  // Virtual animation time that HALTS when playback stops
  const virtualTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Matrix Rain state
  const rainColumnsRef = useRef<
    { y: number; speed: number; chars: string[]; charChangeTimer: number }[]
  >([]);

  const visualDesigns: { id: Mp3VisualDesign; label: string; icon: string }[] = [
    { id: 'matrix-rain', label: 'Matrix Rain', icon: '01' },
    { id: 'hologram-globe', label: 'Holo Globe', icon: '⊕' },
    { id: 'synth-horizon', label: 'Synth Horizon', icon: '◬' },
    { id: 'warp-tunnel', label: 'Warp Tunnel', icon: '◎' },
    { id: 'reactor-core', label: 'Reactor Core', icon: '☢' },
    { id: 'cyber-waveform', label: 'Cyber Scope', icon: '∿' },
    { id: 'isometric-bars', label: '3D Iso Bars', icon: '▥' },
    { id: 'cyber-city', label: 'Cyber City', icon: '🏙' },
  ];

  const currentDesign = dspSettings.mp3VisualDesign || 'matrix-rain';

  const handleCycleDesign = (direction: 'next' | 'prev') => {
    const curIdx = visualDesigns.findIndex((d) => d.id === currentDesign);
    let nextIdx = direction === 'next' ? curIdx + 1 : curIdx - 1;
    if (nextIdx >= visualDesigns.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = visualDesigns.length - 1;
    onUpdateDspSettings?.({ mp3VisualDesign: visualDesigns[nextIdx].id });
  };

  // Determine phosphor color code based on active theme
  const phosphorHex = useMemo(() => {
    switch (theme) {
      case 'amber':
        return {
          primary: '#ffb703',
          secondary: '#fb8500',
          glow: 'rgba(255, 183, 3, 0.45)',
          text: '#fef08a',
        };
      case 'cyan':
        return {
          primary: '#00f3ff',
          secondary: '#38bdf8',
          glow: 'rgba(0, 243, 255, 0.45)',
          text: '#dbeafe',
        };
      case 'magenta':
        return {
          primary: '#ff007f',
          secondary: '#c084fc',
          glow: 'rgba(255, 0, 127, 0.45)',
          text: '#f5d0fe',
        };
      case 'green':
      default:
        return {
          primary: '#00ff88',
          secondary: '#00f3ff',
          glow: 'rgba(0, 255, 136, 0.45)',
          text: '#D5FFE8',
        };
    }
  }, [theme]);

  // Frame calculation
  const totalFrames = Math.max(1, Math.round((duration || 200) * 24));
  const currentFrame = Math.min(totalFrames, Math.round((currentTime || 0) * 24));
  const percent = duration > 0 ? ((currentTime / duration) * 100).toFixed(1) : '0.0';

  // Character sets based on selected mode
  const asciiChars = useMemo(() => {
    if (dspSettings.ditherMode === 'floyd') return ' .:-=+*#%@';
    if (dspSettings.ditherMode === 'atkinson') return ' ░▒▓█';
    if (dspSettings.ditherMode === 'sierra') return ' 01ｦｱｳｴｵｶｷｹｺｻｼｽｾ';
    return ' /\\|><{}[]()#*+=-_~';
  }, [dspSettings.ditherMode]);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let isCancelled = false;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

    const render = (now: number) => {
      if (isCancelled) return;

      const delta = Math.min(100, now - lastFrameTimeRef.current);
      lastFrameTimeRef.current = now;

      // ACCUMULATE VIRTUAL TIME ONLY IF PLAYING!
      // When MP3 stops/pauses, virtualTime FREEZES so all motion halts!
      if (isPlaying) {
        virtualTimeRef.current += delta;
      }
      const t = virtualTimeRef.current * 0.001; // elapsed animation seconds

      // Compute FPS: if playing, track FPS; if stopped, display 0
      if (isPlaying) {
        frameCountRef.current++;
        if (now - lastFpsTimeRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsTimeRef.current = now;
        }
      } else {
        if (fps !== 0) setFps(0);
      }

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !offCtx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = container.clientWidth || 640;
      const height = container.clientHeight || 360;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Background clear
      ctx.fillStyle = '#010505';
      ctx.fillRect(0, 0, width, height);

      // Read audio data if active
      let bassEnergy = 0;
      let midEnergy = 0;
      if (isPlaying) {
        getAnalyserData(freqDataRef.current, timeDataRef.current);
        const freq = freqDataRef.current;
        let bSum = 0;
        let mSum = 0;
        for (let i = 0; i < 8; i++) bSum += freq[i];
        for (let i = 8; i < 32; i++) mSum += freq[i];
        bassEnergy = bSum / (8 * 255);
        midEnergy = mSum / (24 * 255);
      }

      const video = mediaElement;
      const hasRealVideo = Boolean(
        video &&
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          (!video.paused || video.currentTime > 0)
      );

      let cols = 80;
      switch (dspSettings.resolutionProfile) {
        case 'ASCII-Retro':
          cols = 54;
          break;
        case 'ASCII-Std':
          cols = 80;
          break;
        case 'ASCII-HQ':
          cols = 110;
          break;
        case 'ASCII-Ultra':
          cols = 140;
          break;
        case 'ASCII-Pro':
          cols = 190;
          break;
        default:
          cols = 80;
      }
      const fontAspect = 0.55;
      const rows = Math.round((cols / (16 / 9)) * fontAspect);

      offscreen.width = cols;
      offscreen.height = rows;

      const cellW = width / cols;
      const cellH = height / rows;
      const fontSize = Math.max(7, Math.floor(cellH * 1.05));
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (hasRealVideo && video) {
        // REAL VIDEO PLAYBACK PIPELINE
        offCtx.drawImage(video, 0, 0, cols, rows);
        const imgData = offCtx.getImageData(0, 0, cols, rows);
        const pixels = imgData.data;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = (r * cols + c) * 4;
            const lum =
              (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114) / 255;
            if (lum > 0.08) {
              const charIdx = Math.floor(lum * (asciiChars.length - 1));
              const ch = asciiChars[charIdx] || ' ';
              ctx.fillStyle = phosphorHex.primary;
              ctx.globalAlpha = Math.min(1, lum + (dspSettings.phosphorBloom / 100) * 0.25);
              ctx.fillText(ch, c * cellW + cellW / 2, r * cellH + cellH / 2);
            }
          }
        }
        ctx.globalAlpha = 1.0;
      } else {
        // ==========================================================
        // MP3 AUDIO VISUAL ENGINE: MULTIPLE DESIGNS
        // (Freezes in place when MP3 is paused or stopped!)
        // ==========================================================

        switch (currentDesign) {
          // --------------------------------------------------------
          // DESIGN 1: MATRIX DIGITAL CODE RAIN
          // --------------------------------------------------------
          case 'matrix-rain': {
            if (rainColumnsRef.current.length !== cols) {
              const katakana = '0123456789ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
              rainColumnsRef.current = Array.from({ length: cols }, () => ({
                y: Math.random() * rows,
                speed: 0.15 + Math.random() * 0.35,
                chars: Array.from({ length: rows }, () => katakana[Math.floor(Math.random() * katakana.length)]),
                charChangeTimer: 0,
              }));
            }

            const rainCols = rainColumnsRef.current;
            const katakana = '0123456789ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';

            // Only update raindrop positions when playing
            if (isPlaying) {
              for (let c = 0; c < cols; c++) {
                const col = rainCols[c];
                const freqIdx = Math.floor((c / cols) * 32);
                const boost = 1 + (freqDataRef.current[freqIdx] / 255) * 2.0;
                col.y += col.speed * boost;
                if (col.y >= rows + 8) {
                  col.y = -Math.random() * 8;
                  col.speed = 0.15 + Math.random() * 0.35;
                }
                col.charChangeTimer++;
                if (col.charChangeTimer > 8) {
                  col.charChangeTimer = 0;
                  const swapIdx = Math.floor(Math.random() * rows);
                  col.chars[swapIdx] = katakana[Math.floor(Math.random() * katakana.length)];
                }
              }
            }

            // Render rain grid
            for (let c = 0; c < cols; c++) {
              const col = rainCols[c];
              const headY = Math.floor(col.y);
              const trailLen = 14;

              for (let r = 0; r < rows; r++) {
                const distFromHead = headY - r;
                if (distFromHead >= 0 && distFromHead < trailLen) {
                  const ch = col.chars[r % col.chars.length];
                  if (distFromHead === 0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 1.0;
                  } else {
                    ctx.fillStyle = phosphorHex.primary;
                    ctx.globalAlpha = Math.max(0.08, 1 - distFromHead / trailLen);
                  }
                  ctx.fillText(ch, c * cellW + cellW / 2, r * cellH + cellH / 2);
                }
              }
            }
            ctx.globalAlpha = 1.0;
            break;
          }

          // --------------------------------------------------------
          // DESIGN 2: 3D WIREFRAME HOLOGRAPHIC SPHERE
          // --------------------------------------------------------
          case 'hologram-globe': {
            const rotY = t * 0.7;
            const rotX = Math.sin(t * 0.4) * 0.35;
            const R = Math.min(width, height) * 0.36 * (1 + bassEnergy * 0.3);
            const centerX = width / 2;
            const centerY = height / 2;

            const lats = 16;
            const lons = 28;

            for (let i = 0; i <= lats; i++) {
              const lat = (i / lats) * Math.PI - Math.PI / 2;
              for (let j = 0; j < lons; j++) {
                const lon = (j / lons) * Math.PI * 2;

                // 3D sphere coordinate
                let x = R * Math.cos(lat) * Math.sin(lon);
                let y = R * Math.sin(lat);
                let z = R * Math.cos(lat) * Math.cos(lon);

                // Y-axis rotation
                const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
                const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);

                // X-axis rotation
                const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
                const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

                // Perspective projection
                const fov = 350;
                const scale = fov / (fov + z2 + R * 0.5);
                const projX = centerX + x1 * scale;
                const projY = centerY + y2 * scale;

                if (z2 > -R * 0.6) {
                  const depthAlpha = Math.max(0.15, Math.min(1, (z2 + R) / (2 * R)));
                  const charSet = ['.', ':', '+', '*', '#', '@'];
                  const charIdx = Math.floor(depthAlpha * (charSet.length - 1));

                  ctx.fillStyle = depthAlpha > 0.75 ? '#ffffff' : phosphorHex.primary;
                  ctx.globalAlpha = depthAlpha;
                  ctx.fillText(charSet[charIdx], projX, projY);
                }
              }
            }
            ctx.globalAlpha = 1.0;
            break;
          }

          // --------------------------------------------------------
          // DESIGN 3: RETRO SYNTHWAVE PERSPECTIVE HORIZON
          // --------------------------------------------------------
          case 'synth-horizon': {
            const horizonY = height * 0.52;
            const sunR = Math.min(width, height) * 0.22 * (1 + bassEnergy * 0.2);

            // Draw Neon Sun with sliced horizontal lines
            for (let r = 0; r < rows; r++) {
              const py = r * cellH + cellH / 2;
              if (py < horizonY + 10) {
                for (let c = 0; c < cols; c++) {
                  const px = c * cellW + cellW / 2;
                  const dx = px - width / 2;
                  const dy = py - (horizonY - sunR * 0.5);
                  const dist = Math.sqrt(dx * dx + dy * dy);

                  if (dist < sunR) {
                    const sliceBand = (py / 12) % 1;
                    if (sliceBand > 0.35) {
                      const sunIntensity = 1 - dist / sunR;
                      ctx.fillStyle = sunIntensity > 0.6 ? phosphorHex.secondary : phosphorHex.primary;
                      ctx.globalAlpha = Math.min(1, 0.4 + sunIntensity * 0.6);
                      ctx.fillText('#', px, py);
                    }
                  }
                }
              }
            }

            // Mountain audio silhouette along horizon
            const freq = freqDataRef.current;
            for (let c = 0; c < cols; c++) {
              const fIdx = Math.floor((Math.abs(c - cols / 2) / (cols / 2)) * 30);
              const mHeight = (freq[fIdx] / 255) * (height * 0.18);
              const px = c * cellW + cellW / 2;

              for (let y = horizonY - mHeight; y < horizonY; y += cellH) {
                ctx.fillStyle = phosphorHex.secondary;
                ctx.globalAlpha = 0.7;
                ctx.fillText('^', px, y);
              }
            }

            // Ground 3D Perspective Lines
            const scrollOffset = (t * 2.5) % 1;
            for (let r = Math.floor(rows * 0.52); r < rows; r++) {
              const py = r * cellH + cellH / 2;
              const depth = (py - horizonY) / (height - horizonY); // 0 at horizon, 1 at bottom
              const rowSpeed = Math.pow(depth, 2);

              for (let c = 0; c < cols; c++) {
                const px = c * cellW + cellW / 2;
                const normX = (px - width / 2) / depth; // perspective spread

                const isRadialLine = Math.abs(normX % 50) < 6;
                const isCrossLine = Math.abs((depth * 8 - (isPlaying ? scrollOffset : 0)) % 1) < 0.15;

                if (isRadialLine || isCrossLine) {
                  ctx.fillStyle = phosphorHex.primary;
                  ctx.globalAlpha = depth * 0.9;
                  ctx.fillText('+', px, py);
                }
              }
            }
            ctx.globalAlpha = 1.0;
            break;
          }

          // --------------------------------------------------------
          // DESIGN 4: HYPERSPACE 3D WARP TUNNEL
          // --------------------------------------------------------
          case 'warp-tunnel': {
            const rings = 14;
            const segments = 24;
            const tunnelSpeed = (t * 1.5) % 1;

            for (let i = 0; i < rings; i++) {
              const progress = (i + (isPlaying ? tunnelSpeed : 0)) / rings;
              const radius = Math.pow(progress, 2.5) * (Math.max(width, height) * 0.65);
              const wobble = Math.sin(t * 3 + i * 0.5) * (bassEnergy * 20);

              for (let s = 0; s < segments; s++) {
                const angle = (s / segments) * Math.PI * 2 + t * 0.4;
                const px = width / 2 + (radius + wobble) * Math.cos(angle);
                const py = height / 2 + (radius + wobble) * Math.sin(angle) * 0.7;

                if (px >= 0 && px < width && py >= 0 && py < height) {
                  ctx.fillStyle = progress > 0.8 ? '#ffffff' : phosphorHex.primary;
                  ctx.globalAlpha = Math.min(1, progress * 1.2);
                  const chars = ['·', ':', '+', 'x', '*', '#', '@'];
                  const cIdx = Math.floor(progress * (chars.length - 1));
                  ctx.fillText(chars[cIdx], px, py);
                }
              }
            }
            ctx.globalAlpha = 1.0;
            break;
          }

          // --------------------------------------------------------
          // DESIGN 5: CYBER TELEMETRY REACTOR CORE
          // --------------------------------------------------------
          case 'reactor-core': {
            const centerX = width / 2;
            const centerY = height / 2;
            const coreR = Math.min(width, height) * 0.28 * (1 + bassEnergy * 0.25);

            // Dial 1: Clockwise Outer Ring
            const outerR = coreR * 1.25;
            for (let a = 0; a < 360; a += 10) {
              const rad = ((a + (isPlaying ? t * 35 : 0)) * Math.PI) / 180;
              const px = centerX + outerR * Math.cos(rad);
              const py = centerY + outerR * Math.sin(rad) * 0.8;
              ctx.fillStyle = phosphorHex.secondary;
              ctx.globalAlpha = 0.75;
              ctx.fillText(a % 90 === 0 ? '♦' : '·', px, py);
            }

            // Dial 2: Counter-Clockwise Middle Ring
            const midR = coreR * 0.85;
            for (let a = 0; a < 360; a += 15) {
              const rad = ((a - (isPlaying ? t * 50 : 0)) * Math.PI) / 180;
              const px = centerX + midR * Math.cos(rad);
              const py = centerY + midR * Math.sin(rad) * 0.8;
              ctx.fillStyle = phosphorHex.primary;
              ctx.globalAlpha = 0.85;
              ctx.fillText(':', px, py);
            }

            // Center Plasma Core: Audio Reactive Burst
            for (let a = 0; a < 360; a += 12) {
              const binIdx = Math.floor((a / 360) * 32);
              const amp = (freqDataRef.current[binIdx] / 255) * (coreR * 0.5);
              const rad = (a * Math.PI) / 180;
              const px = centerX + (coreR * 0.45 + amp) * Math.cos(rad);
              const py = centerY + (coreR * 0.45 + amp) * Math.sin(rad) * 0.8;
              ctx.fillStyle = '#ffffff';
              ctx.globalAlpha = 0.9;
              ctx.fillText('*', px, py);
            }

            // Radar Sweep Beam
            if (isPlaying) {
              const sweepRad = t * 4;
              for (let r = 0; r < coreR * 1.3; r += cellW) {
                const px = centerX + r * Math.cos(sweepRad);
                const py = centerY + r * Math.sin(sweepRad) * 0.8;
                ctx.fillStyle = phosphorHex.primary;
                ctx.globalAlpha = 1 - r / (coreR * 1.3);
                ctx.fillText('─', px, py);
              }
            }
            ctx.globalAlpha = 1.0;
            break;
          }

          // --------------------------------------------------------
          // DESIGN 6: DUAL CYBER OSCILLOSCOPE & EQUALIZER
          // --------------------------------------------------------
          case 'cyber-waveform': {
            const timeData = timeDataRef.current;
            const midY = height / 2;

            // Oscilloscope Waveform Line
            for (let c = 0; c < cols; c++) {
              const sampleIdx = Math.floor((c / cols) * timeData.length);
              const v = (timeData[sampleIdx] - 128) / 128; // -1 to 1
              const waveY = midY + v * (height * 0.35) * (isPlaying ? 1 : 0);
              const px = c * cellW + cellW / 2;

              ctx.fillStyle = phosphorHex.primary;
              ctx.globalAlpha = 0.95;
              ctx.fillText('█', px, waveY);
            }

            // Dual Mirrored Spectrum Bars
            const freq = freqDataRef.current;
            for (let c = 0; c < cols; c++) {
              const fIdx = Math.floor((c / cols) * 32);
              const barH = (freq[fIdx] / 255) * (height * 0.4) * (isPlaying ? 1 : 0);
              const px = c * cellW + cellW / 2;

              for (let y = midY - barH; y <= midY + barH; y += cellH * 1.5) {
                if (Math.abs(y - midY) > 8) {
                  ctx.fillStyle = phosphorHex.secondary;
                  ctx.globalAlpha = 0.4;
                  ctx.fillText('░', px, y);
                }
              }
            }
            ctx.globalAlpha = 1.0;
            break;
          }

          // --------------------------------------------------------
          // DESIGN 7: 3D ISOMETRIC VFD GRAPHIC EQUALIZER
          // --------------------------------------------------------
          case 'isometric-bars': {
            const freq = freqDataRef.current;
            const numBars = 32;
            const barColSpan = Math.max(1, Math.floor(cols / (numBars + 4)));
            const baseY = Math.floor(rows * 0.72);

            // Floor grid reflection line
            ctx.fillStyle = phosphorHex.secondary;
            ctx.globalAlpha = 0.2;
            for (let c = 2; c < cols - 2; c += 2) {
              ctx.fillText('═', c * cellW + cellW / 2, baseY * cellH);
            }

            for (let b = 0; b < numBars; b++) {
              const fVal = isPlaying ? freq[b % freq.length] / 255 : 0.05;
              const barHeightCells = Math.floor(fVal * (rows * 0.6));
              const startCol = 2 + b * barColSpan;

              if (startCol >= cols - 2) break;

              // Render bar height from bottom up
              for (let h = 0; h <= barHeightCells; h++) {
                const curRow = baseY - h;
                if (curRow < 2) continue;

                const px = startCol * cellW + cellW / 2;
                const py = curRow * cellH + cellH / 2;

                // Color gradient from primary (base) to secondary (peak)
                const isPeak = h === barHeightCells;
                ctx.fillStyle = isPeak ? phosphorHex.secondary : phosphorHex.primary;
                ctx.globalAlpha = isPeak ? 1.0 : 0.75 + (h / rows) * 0.25;

                // 3D Isometric block glyph
                const glyph = isPeak ? '▀' : h % 3 === 0 ? '▓' : '█';
                ctx.fillText(glyph, px, py);

                // Side 3D projection character
                if (startCol + 1 < cols - 1) {
                  ctx.fillStyle = phosphorHex.secondary;
                  ctx.globalAlpha = 0.45;
                  ctx.fillText('▌', (startCol + 0.6) * cellW + cellW / 2, py - cellH * 0.2);
                }
              }

              // Floating peak marker
              const peakRow = baseY - barHeightCells - 2;
              if (peakRow > 1) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = isPlaying ? 0.9 : 0.4;
                ctx.fillText('▔', startCol * cellW + cellW / 2, peakRow * cellH + cellH / 2);
              }

              // Mirrored floor reflection
              for (let rh = 1; rh <= Math.min(6, Math.floor(barHeightCells * 0.4)); rh++) {
                const reflRow = baseY + rh;
                if (reflRow < rows - 1) {
                  ctx.fillStyle = phosphorHex.primary;
                  ctx.globalAlpha = Math.max(0.05, 0.25 - rh * 0.04);
                  ctx.fillText('░', startCol * cellW + cellW / 2, reflRow * cellH + cellH / 2);
                }
              }
            }
            ctx.globalAlpha = 1.0;
            break;
          }

          // --------------------------------------------------------
          // DESIGN 8: CYBERPUNK SKYLINE & SEARCHLIGHTS
          // --------------------------------------------------------
          case 'cyber-city':
          default: {
            const freq = freqDataRef.current;
            const groundRow = Math.floor(rows * 0.82);

            // Sweeping sky searchlights driven by virtual time t
            const beamAngle1 = Math.sin(t * 0.9) * 0.55;
            const beamAngle2 = Math.cos(t * 0.7) * 0.65;
            ctx.fillStyle = phosphorHex.secondary;

            for (let r = 2; r < groundRow; r++) {
              const lightCol1 = Math.floor(cols * 0.3 + (groundRow - r) * Math.tan(beamAngle1));
              const lightCol2 = Math.floor(cols * 0.7 + (groundRow - r) * Math.tan(beamAngle2));

              if (lightCol1 >= 0 && lightCol1 < cols) {
                ctx.globalAlpha = Math.max(0.08, 0.35 - (r / rows) * 0.2);
                ctx.fillText('/', lightCol1 * cellW + cellW / 2, r * cellH + cellH / 2);
              }
              if (lightCol2 >= 0 && lightCol2 < cols) {
                ctx.globalAlpha = Math.max(0.08, 0.35 - (r / rows) * 0.2);
                ctx.fillText('\\', lightCol2 * cellW + cellW / 2, r * cellH + cellH / 2);
              }
            }

            // Procedural Skyline Buildings
            const buildingWidth = 6;
            const numBuildings = Math.ceil(cols / buildingWidth);

            for (let b = 0; b < numBuildings; b++) {
              // Deterministic building height using seeded hash + audio energy
              const hash = Math.sin(b * 12.9898) * 43758.5453;
              const normalizedHeight = 0.3 + (Math.abs(hash) % 1) * 0.45;
              const bHeight = Math.floor(rows * normalizedHeight);
              const topRow = groundRow - bHeight;
              const fVal = isPlaying ? freq[(b * 3) % 32] / 255 : 0;

              for (let c = b * buildingWidth; c < (b + 1) * buildingWidth - 1; c++) {
                if (c >= cols) break;

                // Rooftop antenna or beacon
                if (c === b * buildingWidth + Math.floor(buildingWidth / 2) && topRow > 3) {
                  ctx.fillStyle = phosphorHex.secondary;
                  ctx.globalAlpha = isPlaying && fVal > 0.4 ? 1.0 : 0.5;
                  ctx.fillText('▲', c * cellW + cellW / 2, (topRow - 1) * cellH + cellH / 2);
                  ctx.fillText('|', c * cellW + cellW / 2, (topRow - 2) * cellH + cellH / 2);
                }

                // Building columns and lit windows
                for (let r = topRow; r < groundRow; r++) {
                  const px = c * cellW + cellW / 2;
                  const py = r * cellH + cellH / 2;
                  const isEdge = c === b * buildingWidth || c === (b + 1) * buildingWidth - 2;

                  if (isEdge) {
                    ctx.fillStyle = phosphorHex.secondary;
                    ctx.globalAlpha = 0.3;
                    ctx.fillText('│', px, py);
                  } else {
                    // Lit window pattern influenced by audio
                    const windowLit = ((r * 7 + c * 13) % 4 === 0) || (fVal > 0.5 && r % 2 === 0);
                    ctx.fillStyle = windowLit ? phosphorHex.primary : phosphorHex.secondary;
                    ctx.globalAlpha = windowLit ? (isPlaying ? 0.85 + fVal * 0.15 : 0.4) : 0.15;
                    ctx.fillText(windowLit ? '■' : '·', px, py);
                  }
                }
              }

              // Neon Billboard on tallest tower
              if (b === Math.floor(numBuildings / 2)) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = isPlaying ? 0.95 : 0.5;
                const signX = (b * buildingWidth + 1) * cellW;
                ctx.fillText('MELO_OS', signX + cellW, (topRow + 2) * cellH);
              }
            }

            // Neon river/highway at bottom with audio ripple
            for (let c = 0; c < cols; c++) {
              const px = c * cellW + cellW / 2;
              const py = groundRow * cellH + cellH / 2;
              ctx.fillStyle = phosphorHex.primary;
              ctx.globalAlpha = 0.8;
              ctx.fillText('═', px, py);

              // Water reflection below ground
              for (let wr = groundRow + 1; wr < rows; wr++) {
                const ripple = Math.sin(t * 3 + wr * 0.8 + c * 0.2);
                ctx.fillStyle = phosphorHex.secondary;
                ctx.globalAlpha = Math.max(0.05, 0.3 - (wr - groundRow) * 0.05);
                ctx.fillText(ripple > 0 ? '~' : '≈', px, wr * cellH + cellH / 2);
              }
            }
            ctx.globalAlpha = 1.0;
            break;
          }
        }

        // ==========================================================
        // WHEN MP3 IS STOPPED/PAUSED: DISPLAY STREAM HALT HUD
        // ==========================================================
        if (!isPlaying) {
          // Dim ambient overlay
          ctx.fillStyle = 'rgba(0, 5, 5, 0.65)';
          ctx.fillRect(0, 0, width, height);

          // Center Standby Badge
          const bannerW = Math.min(420, width - 24);
          const bannerH = 50;
          ctx.fillStyle = 'rgba(2, 13, 13, 0.92)';
          ctx.fillRect(width / 2 - bannerW / 2, height / 2 - bannerH / 2, bannerW, bannerH);
          ctx.strokeStyle = phosphorHex.primary;
          ctx.lineWidth = 1;
          ctx.strokeRect(width / 2 - bannerW / 2, height / 2 - bannerH / 2, bannerW, bannerH);

          ctx.fillStyle = phosphorHex.primary;
          ctx.font = 'bold 11px monospace';
          ctx.fillText(
            '❚❚ ENGINE HALTED // AUDIO PLAYBACK PAUSED',
            width / 2,
            height / 2 - 8
          );

          ctx.fillStyle = phosphorHex.secondary;
          ctx.font = '10px monospace';
          ctx.fillText(
            'PRESS [SPACE] OR CLICK PLAY TO RESUME PIPELINE',
            width / 2,
            height / 2 + 10
          );
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      isCancelled = true;
      cancelAnimationFrame(animId);
    };
  }, [
    isPlaying,
    dspSettings,
    asciiChars,
    phosphorHex,
    getAnalyserData,
    mediaElement,
    currentDesign,
  ]);

  const streamTitle =
    currentTrack?.title || 'The Weeknd - Blinding Lights (Official ASCII Video)';
  const sourceTag = currentTrack?.youtubeId
    ? `yt://watch?v=${currentTrack.youtubeId}`
    : currentTrack?.audioSrc || 'stream://live/cyber-matrix';

  return (
    <section
      className={`border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-2 sm:p-2.5 flex flex-col min-h-0 overflow-hidden font-mono ${className}`}
      data-purpose="ascii-video-player"
    >
      {/* Stream HUD Header */}
      <div className="flex-none flex items-center justify-between border-b border-[var(--color-term-border)] pb-1.5 mb-1.5 text-xs font-mono">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[var(--color-term-green)] text-xs">▣</span>
          <span className="font-bold text-[var(--color-term-green)] truncate">
            {currentTrack?.isVideo ? 'yt-stream:' : 'mp3-vis:'} {streamTitle}
          </span>
          <span className="text-[10px] px-1 bg-[var(--color-term-border)]/40 text-[var(--color-term-cyan)] border border-[var(--color-term-border)] flex-none">
            {dspSettings.ditherMode.toUpperCase()}
          </span>
          <span className="text-[10px] px-1 bg-[var(--color-term-border)]/40 text-[var(--color-term-green)] border border-[var(--color-term-border)] flex-none hidden sm:inline">
            {dspSettings.resolutionProfile || 'ASCII-Std'}
          </span>
        </div>

        {/* Right HUD Controls: Visual Design Selector & Telemetry */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--color-term-text)] flex-none">
          {/* Design Cycler Badge for MP3 Playback */}
          <div className="flex items-center border border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-1 py-0.5 gap-1">
            <button
              onClick={() => handleCycleDesign('prev')}
              className="text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] transition-colors"
              title="Previous Video Design"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span
              onClick={() => handleCycleDesign('next')}
              className="text-[var(--color-term-cyan)] font-bold cursor-pointer hover:underline text-[9px] px-1"
              title="Click to cycle next MP3 video design"
            >
              DESIGN: {visualDesigns.find((d) => d.id === currentDesign)?.label.toUpperCase()}
            </span>
            <button
              onClick={() => handleCycleDesign('next')}
              className="text-[var(--color-term-muted)] hover:text-[var(--color-term-green)] transition-colors"
              title="Next Video Design"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <span className="hidden sm:inline text-[var(--color-term-dim)]">|</span>
          <span
            className={`font-bold ${
              isPlaying ? 'text-[var(--color-term-green)]' : 'text-[var(--color-term-error)]'
            }`}
          >
            {isPlaying ? `${fps} FPS` : 'HALTED'}
          </span>
          <span className="hidden md:inline text-[var(--color-term-dim)]">|</span>
          <span className="hidden md:inline">
            {isPlaying ? '4.2 Mbps' : '0.0 Kbps'}
          </span>
        </div>
      </div>

      {/* High-Density ASCII Video Canvas Screen */}
      <div
        ref={containerRef}
        className="flex-1 bg-[#000505] border border-[var(--color-term-border)] relative overflow-hidden flex flex-col justify-center items-center select-none"
        style={{
          boxShadow: `0 0 15px ${phosphorHex.glow}`,
        }}
      >
        {/* Dynamic CRT Scanlines Overlay */}
        <div
          className="absolute inset-0 crt-overlay pointer-events-none"
          style={{ opacity: (dspSettings.scanlineDensity || 72) / 150 }}
        />

        {/* Video In-HUD Overlay Overlay Tags */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-2 text-[9px] font-mono pointer-events-none">
          <span
            className={`px-1.5 py-0.5 border font-bold ${
              isPlaying
                ? 'bg-[var(--color-term-surface)]/90 border-[var(--color-term-green)] text-[var(--color-term-green)]'
                : 'bg-[var(--color-term-surface)]/90 border-[var(--color-term-error)] text-[var(--color-term-error)]'
            }`}
          >
            {isPlaying ? '● LIVE BUFFER' : '❚❚ STANDBY'}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[var(--color-term-surface)]/90 border border-[var(--color-term-border)] text-[var(--color-term-cyan)] truncate max-w-[200px]">
            SRC: {sourceTag}
          </span>
          <span className="hidden md:inline-block px-1.5 py-0.5 bg-[var(--color-term-surface)]/90 border border-[var(--color-term-border)] text-[var(--color-term-text)]">
            MODE: {visualDesigns.find((d) => d.id === currentDesign)?.label.toUpperCase()}
          </span>
        </div>

        <div className="absolute top-2 right-2 z-10 text-[9px] font-mono text-[var(--color-term-text)] bg-[var(--color-term-surface)]/90 border border-[var(--color-term-border)] px-1.5 py-0.5 pointer-events-none">
          FRM: {currentFrame}/{totalFrames} ({percent}%)
        </div>

        {/* Live Canvas Screen */}
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </section>
  );
}
