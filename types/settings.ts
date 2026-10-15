export type VisualizerMode = 'equalizer' | 'waveform' | 'spectrum' | 'matrix' | 'pulse';

export type TerminalTheme = 'green' | 'cyan' | 'amber' | 'magenta';

export type Mp3VisualDesign =
  | 'matrix-rain'
  | 'hologram-globe'
  | 'synth-horizon'
  | 'warp-tunnel'
  | 'reactor-core'
  | 'cyber-waveform'
  | 'isometric-bars'
  | 'cyber-city';

export type AsciiQualityProfile = 'ASCII-Retro' | 'ASCII-Std' | 'ASCII-HQ' | 'ASCII-Ultra' | 'ASCII-Pro';

export interface UserSettings {
  theme: TerminalTheme;
  visualizerMode: VisualizerMode;
  mp3VisualDesign: Mp3VisualDesign;
  crtScanlines: boolean;
  screenGlow: boolean;
  reducedMotion: boolean;
  animationIntensity: number; // 0.1 to 1.0
  volume: number; // 0 to 1
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: 'off' | 'track' | 'all';
  // Advanced DSP & CRT Shader System
  ditherMode?: 'bayer8x8' | 'floyd' | 'atkinson' | 'sierra';
  scanlineDensity?: number; // 0 - 100
  phosphorBloom?: number; // 0 - 100
  curvatureBarrel?: number; // 0 - 100
  noiseVhsGlitch?: number; // 0 - 100
  charsetProfile?: string;
  freezeOnStop?: boolean;
  resolutionProfile?: AsciiQualityProfile;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'green',
  visualizerMode: 'equalizer',
  mp3VisualDesign: 'matrix-rain',
  crtScanlines: true,
  screenGlow: true,
  reducedMotion: false,
  animationIntensity: 1.0,
  volume: 0.8,
  isMuted: false,
  shuffle: false,
  repeatMode: 'all',
  ditherMode: 'bayer8x8',
  scanlineDensity: 72,
  phosphorBloom: 85,
  curvatureBarrel: 30,
  noiseVhsGlitch: 15,
  charsetProfile: 'Cyber Glyphs [.,:;+*#%@]',
  freezeOnStop: true,
  resolutionProfile: 'ASCII-Std',
};
