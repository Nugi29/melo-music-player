import { Mp3VisualDesign, AsciiQualityProfile } from '@/types/settings';

export type DitherMatrixMode = 'bayer8x8' | 'floyd' | 'atkinson' | 'sierra';
export type CrtPhosphor = 'green' | 'amber' | 'cyan';
export type MediaMode = 'video' | 'audio';
export type { Mp3VisualDesign, AsciiQualityProfile };

export interface DspShaderSettings {
  ditherMode: DitherMatrixMode;
  phosphor: CrtPhosphor;
  scanlineDensity: number; // 0 - 100
  phosphorBloom: number; // 0 - 100
  curvatureBarrel: number; // 0 - 100
  noiseVhsGlitch: number; // 0 - 100
  charsetProfile: string;
  mp3VisualDesign: Mp3VisualDesign;
  freezeOnStop: boolean;
  resolutionProfile: AsciiQualityProfile;
}

export const DEFAULT_DSP_SETTINGS: DspShaderSettings = {
  ditherMode: 'bayer8x8',
  phosphor: 'green',
  scanlineDensity: 72,
  phosphorBloom: 85,
  curvatureBarrel: 30,
  noiseVhsGlitch: 15,
  charsetProfile: 'Cyber Glyphs [.,:;+*#%@]',
  mp3VisualDesign: 'matrix-rain',
  freezeOnStop: true,
  resolutionProfile: 'ASCII-Std',
};

export interface ChatMessage {
  id: string;
  sender: string;
  color?: string;
  text: string;
  time: string;
  isSystem?: boolean;
}
