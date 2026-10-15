'use client';

import React from 'react';
import NowPlayingCard from './NowPlayingCard';
import DspSpectrumAnalyzer from './DspSpectrumAnalyzer';
import MixerConsole from './MixerConsole';
import ShortcutsCheatsheet from './ShortcutsCheatsheet';
import { DspShaderSettings } from '../types';

interface InspectorPanelProps {
  dspSettings?: DspShaderSettings;
  onUpdateDspSettings?: (newSettings: Partial<DspShaderSettings>) => void;
  onInsertCommand?: (cmd: string) => void;
  className?: string;
}

export default function InspectorPanel({
  onInsertCommand,
  className = '',
}: InspectorPanelProps) {
  return (
    <aside
      className={`flex flex-col gap-2 min-h-0 overflow-y-auto pr-0.5 select-none ${className}`}
      data-purpose="now-playing-panel"
    >
      {/* 1. TOP: NOW PLAYING & TRACK METADATA */}
      <NowPlayingCard />

      {/* 2. DSP SPECTRUM ANALYZER & HARDWARE AUDIO TELEMETRY */}
      <DspSpectrumAnalyzer />

      {/* 3. AUDIO PLAYBACK & MIXER CONSOLE */}
      <MixerConsole />

      {/* 4. TERMINAL SHORTCUTS & CLI CHEATSHEET */}
      <ShortcutsCheatsheet onInsertCommand={onInsertCommand} />
    </aside>
  );
}
