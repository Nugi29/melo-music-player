'use client';

import React, { useRef, useEffect } from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';

export default function DspSpectrumAnalyzer() {
  const { isPlaying, getAnalyserData } = useAudio();
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));
  const timeDataRef = useRef<Uint8Array>(new Uint8Array(64));

  const columns = 20;
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const peakRefs = useRef<(HTMLDivElement | null)[]>([]);
  const heightsRef = useRef<number[]>(Array(columns).fill(8));
  const peaksRef = useRef<number[]>(Array(columns).fill(8));

  useEffect(() => {
    let animId: number;

    const render = (now: number) => {
      getAnalyserData(freqDataRef.current, timeDataRef.current);
      const freq = freqDataRef.current;
      const heights = heightsRef.current;
      const peaks = peaksRef.current;

      let sum = 0;
      for (let i = 0; i < freq.length; i++) sum += freq[i];
      const hasAudio = sum > 0 && isPlaying;

      for (let i = 0; i < columns; i++) {
        let target = 10;
        if (hasAudio) {
          // Logarithmic bin distribution
          const binIdx = Math.min(63, Math.floor(Math.pow(i / columns, 1.25) * 50));
          const boost = 1.0 + (i / columns) * 1.6;
          const raw = (freq[binIdx] / 255) * boost;
          target = Math.max(10, Math.min(100, Math.round(raw * 100)));
        } else if (isPlaying) {
          // Synthetic procedural bounce
          const phase = now * 0.006 + i * 0.35;
          target = Math.round(15 + (Math.sin(phase) * 0.5 + 0.5) * 70);
        } else {
          // Idle ambient resting wave
          target = Math.round(8 + Math.sin(now * 0.002 + i * 0.4) * 5);
        }

        // Smooth height interpolation
        heights[i] = heights[i] + (target - heights[i]) * 0.55;

        // Peak hold decay
        if (heights[i] > peaks[i]) {
          peaks[i] = heights[i];
        } else {
          peaks[i] = Math.max(heights[i], peaks[i] - 1.2);
        }

        const barEl = barRefs.current[i];
        const peakEl = peakRefs.current[i];

        if (barEl) {
          barEl.style.height = `${Math.round(heights[i])}%`;
        }
        if (peakEl) {
          peakEl.style.bottom = `${Math.min(96, Math.round(peaks[i]))}%`;
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, getAnalyserData]);

  return (
    <section
      className="border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-2.5 flex flex-col shrink-0 font-mono select-none"
      data-purpose="dsp-spectrum-analyzer"
    >
      <div className="flex items-center justify-between text-[10px] pb-1.5 mb-1.5 border-b border-[var(--color-term-border)]">
        <span className="text-[var(--color-term-green)] font-bold flex items-center gap-1">
          <span>▥</span> DSP SPECTRUM ANALYZER
        </span>
        <span className="text-[var(--color-term-cyan)] text-[9px] bg-[var(--color-term-border)]/40 px-1 py-0.5 border border-[var(--color-term-border)]">
          ACTIVE 64-BIN
        </span>
      </div>

      {/* Segmented Graphic Spectrum Equalizer */}
      <div className="relative py-1">
        <div className="flex items-end justify-between h-14 gap-[3px] px-1 bg-[var(--color-term-bg)] border border-[var(--color-term-border)] p-1.5 relative overflow-hidden">
          {Array.from({ length: columns }).map((_, idx) => {
            const isNeon = idx === 5 || idx === 10 || idx === 15;
            return (
              <div
                key={idx}
                className="flex-1 h-full relative flex items-end justify-center"
              >
                {/* Peak hold dot */}
                <div
                  ref={(el) => {
                    peakRefs.current[idx] = el;
                  }}
                  className="absolute w-full h-0.5 bg-[var(--color-term-green)] shadow-[0_0_4px_var(--color-term-green)] transition-all"
                  style={{ bottom: '15%' }}
                />

                {/* Animated Column Bar */}
                <div
                  ref={(el) => {
                    barRefs.current[idx] = el;
                  }}
                  className={`w-full rounded-none transition-all flex flex-col justify-end gap-[1px] ${
                    isNeon ? 'neon-green-glow' : ''
                  }`}
                  style={{ height: '15%' }}
                >
                  <div className="w-full h-1 bg-[var(--color-term-green)]" />
                  <div className="w-full h-2 bg-[var(--color-term-cyan)]" />
                  <div className="w-full flex-1 bg-[var(--color-term-dim)]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Frequency / dB Labels */}
        <div className="flex justify-between items-center text-[8px] text-[var(--color-term-muted)] mt-1 px-1">
          <span>60Hz</span>
          <span>250Hz</span>
          <span>1kHz</span>
          <span>4kHz</span>
          <span>16kHz</span>
        </div>
      </div>
    </section>
  );
}
