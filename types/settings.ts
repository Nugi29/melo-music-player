export type VisualizerMode = 'equalizer' | 'waveform' | 'spectrum' | 'matrix' | 'pulse';

export type TerminalTheme = 'green' | 'cyan' | 'amber' | 'magenta';

export interface UserSettings {
  theme: TerminalTheme;
  visualizerMode: VisualizerMode;
  crtScanlines: boolean;
  screenGlow: boolean;
  reducedMotion: boolean;
  animationIntensity: number; // 0.1 to 1.0
  volume: number; // 0 to 1
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: 'off' | 'track' | 'all';
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'green',
  visualizerMode: 'equalizer',
  crtScanlines: true,
  screenGlow: true,
  reducedMotion: false,
  animationIntensity: 1.0,
  volume: 0.8,
  isMuted: false,
  shuffle: false,
  repeatMode: 'all',
};
