'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { Track } from '@/types/music';
import { Playlist } from '@/types/playlist';
import { UserSettings, DEFAULT_SETTINGS, TerminalTheme, VisualizerMode } from '@/types/settings';
import { dbManager } from '@/lib/database/indexedDb';

import TerminalHeader from './header/TerminalHeader';
import TerminalSidebar from './sidebar/TerminalSidebar';
import AsciiStreamScreen from './video/AsciiStreamScreen';
import ControllerDeck from './video/ControllerDeck';
import InteractiveConsole from './console/InteractiveConsole';
import InspectorPanel from './inspector/InspectorPanel';
import AddStreamModal from './modals/AddStreamModal';

import MusicLibrary from '@/components/library/MusicLibrary';
import ASCIICinemaModal from '@/components/modals/ASCIICinemaModal';
import SettingsModal from '@/components/modals/SettingsModal';
import ShortcutsModal from '@/components/modals/ShortcutsModal';
import GlobalDropOverlay from '@/components/library/GlobalDropOverlay';
import { CommandContext } from '@/components/terminal/commandParser';
import { DspShaderSettings, DEFAULT_DSP_SETTINGS, MediaMode } from './types';

export default function MeloOSPlayer() {
  const {
    allTracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeatMode,
    history,
    queue,
    playTrack,
    togglePlay,
    pause,
    resume,
    seek,
    setVolume,
    toggleShuffle,
    setRepeatMode,
    toggleLike,
    refreshTracks,
    addTracks,
    nextTrack,
    prevTrack,
  } = useAudio();

  // Settings & Playlists State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Decomposed UI State
  const [mediaMode, setMediaMode] = useState<MediaMode>('video');
  const [dspSettings, setDspSettings] = useState<DspShaderSettings>(DEFAULT_DSP_SETTINGS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFeed, setActiveFeed] = useState<string>('youtube');

  // Modals
  const [isAddStreamOpen, setIsAddStreamOpen] = useState<boolean>(false);
  const [isCinemaOpen, setIsCinemaOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Load persistent settings
  useEffect(() => {
    dbManager.getSettings().then((s) => {
      if (s) {
        setSettings(s);
        setDspSettings((prev) => ({
          ...prev,
          mp3VisualDesign: s.mp3VisualDesign || prev.mp3VisualDesign,
          ditherMode: s.ditherMode || prev.ditherMode,
          scanlineDensity: s.scanlineDensity ?? prev.scanlineDensity,
          phosphorBloom: s.phosphorBloom ?? prev.phosphorBloom,
          curvatureBarrel: s.curvatureBarrel ?? prev.curvatureBarrel,
          noiseVhsGlitch: s.noiseVhsGlitch ?? prev.noiseVhsGlitch,
          charsetProfile: s.charsetProfile || prev.charsetProfile,
          freezeOnStop: s.freezeOnStop ?? prev.freezeOnStop,
          resolutionProfile: s.resolutionProfile || prev.resolutionProfile,
        }));
      }
    });
    dbManager.getAllPlaylists().then((p) => {
      if (p) setPlaylists(p);
    });
  }, []);

  // Update & persist settings in IndexedDB
  const handleUpdateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      dbManager.saveSettings(updated).catch(() => {});
      return updated;
    });
    setDspSettings((prev) => ({
      ...prev,
      ...(newSettings.mp3VisualDesign ? { mp3VisualDesign: newSettings.mp3VisualDesign } : {}),
      ...(newSettings.ditherMode ? { ditherMode: newSettings.ditherMode } : {}),
      ...(newSettings.scanlineDensity !== undefined ? { scanlineDensity: newSettings.scanlineDensity } : {}),
      ...(newSettings.phosphorBloom !== undefined ? { phosphorBloom: newSettings.phosphorBloom } : {}),
      ...(newSettings.curvatureBarrel !== undefined ? { curvatureBarrel: newSettings.curvatureBarrel } : {}),
      ...(newSettings.noiseVhsGlitch !== undefined ? { noiseVhsGlitch: newSettings.noiseVhsGlitch } : {}),
      ...(newSettings.charsetProfile ? { charsetProfile: newSettings.charsetProfile } : {}),
      ...(newSettings.freezeOnStop !== undefined ? { freezeOnStop: newSettings.freezeOnStop } : {}),
      ...(newSettings.resolutionProfile ? { resolutionProfile: newSettings.resolutionProfile } : {}),
    }));
  }, []);

  const handleUpdateDspSettings = useCallback((newSettings: Partial<DspShaderSettings>) => {
    setDspSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      setSettings((prevSettings) => {
        const synced: UserSettings = {
          ...prevSettings,
          mp3VisualDesign: updated.mp3VisualDesign,
          ditherMode: updated.ditherMode,
          scanlineDensity: updated.scanlineDensity,
          phosphorBloom: updated.phosphorBloom,
          curvatureBarrel: updated.curvatureBarrel,
          noiseVhsGlitch: updated.noiseVhsGlitch,
          charsetProfile: updated.charsetProfile,
          freezeOnStop: updated.freezeOnStop,
          resolutionProfile: updated.resolutionProfile,
        };
        dbManager.saveSettings(synced).catch(() => {});
        return synced;
      });
      return updated;
    });
  }, []);

  // Filtered tracks based on active feed and search query
  const displayedTracks = useMemo(() => {
    let list = [...allTracks];

    // Feed filter
    if (activeFeed === 'youtube') {
      const ytTracks = list.filter((t) => Boolean(t.youtubeId));
      list = ytTracks.length > 0 ? ytTracks : list;
    } else if (activeFeed === 'local') {
      list = list.filter((t) => t.source === 'local' || t.isVideo);
    } else if (activeFeed === 'liked') {
      list = list.filter((t) => t.isLiked);
    } else if (activeFeed === 'history') {
      list = history;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.genre.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allTracks, activeFeed, searchQuery, history]);

  // Feed counts
  const counts = useMemo(
    () => ({
      videos: allTracks.filter((t) => t.isVideo).length,
      liked: allTracks.filter((t) => t.isLiked).length,
      history: history.length,
      subscriptions: 19,
    }),
    [allTracks, history]
  );

  // Handle stream presets
  const handleSelectStreamPreset = useCallback(
    async (presetName: string) => {
      const match = allTracks.find((t) =>
        t.title.toLowerCase().includes(presetName.toLowerCase().slice(0, 10))
      );
      if (match) {
        await playTrack(match, allTracks);
      } else if (allTracks.length > 0) {
        await playTrack(allTracks[0], allTracks);
      }
    },
    [allTracks, playTrack]
  );

  // Handle Add Stream
  const handleAddStream = useCallback(
    async (newStream: Track) => {
      await addTracks([newStream]);
      await playTrack(newStream);
    },
    [addTracks, playTrack]
  );

  // Build CommandContext for terminal prompt
  const commandContext: CommandContext = useMemo(
    () => ({
      allTracks,
      currentTrack,
      isPlaying,
      volume,
      shuffle,
      repeatMode,
      playlists,
      visualizerMode: settings.visualizerMode,
      theme: settings.theme,
      playTrack: async (track: Track) => {
        await playTrack(track);
      },
      togglePlay,
      pause,
      resume,
      nextTrack,
      prevTrack,
      setVolume,
      toggleShuffle,
      setRepeatMode,
      toggleLike,
      refreshTracks,
      setVisualizerMode: (mode: VisualizerMode) => handleUpdateSettings({ visualizerMode: mode }),
      setTheme: (theme: TerminalTheme) => handleUpdateSettings({ theme }),
      createPlaylist: async (name: string) => {
        const pl: Playlist = {
          id: `pl-${Date.now()}`,
          name,
          trackIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await dbManager.savePlaylist(pl);
        setPlaylists((prev) => [...prev, pl]);
        return pl;
      },
      playPlaylist: async (name: string) => {
        const pl = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (pl && pl.trackIds.length > 0) {
          const track = allTracks.find((t) => pl.trackIds.includes(t.id));
          if (track) {
            await playTrack(track);
            return true;
          }
        }
        return false;
      },
      clearHistory: () => {},
      openCinema: () => setIsCinemaOpen(true),
      addTracks,
    }),
    [
      allTracks,
      currentTrack,
      isPlaying,
      volume,
      shuffle,
      repeatMode,
      playlists,
      settings,
      playTrack,
      togglePlay,
      pause,
      resume,
      nextTrack,
      prevTrack,
      setVolume,
      toggleShuffle,
      setRepeatMode,
      toggleLike,
      refreshTracks,
      addTracks,
      handleUpdateSettings,
    ]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (e.key === 'Escape') {
        setIsAddStreamOpen(false);
        setIsCinemaOpen(false);
        setIsSettingsOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      if (!isInput) {
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlay();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          setVolume(volume > 0 ? 0 : 0.8);
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          toggleShuffle();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          setRepeatMode(repeatMode === 'all' ? 'track' : repeatMode === 'track' ? 'off' : 'all');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, currentTime, duration, setVolume, volume, toggleShuffle, setRepeatMode, repeatMode]);

  // Dynamic Theme Palette Tokens based on settings.theme
  const themeVars = useMemo(() => {
    switch (settings.theme) {
      case 'cyan':
        return {
          '--color-term-bg': '#020b14',
          '--color-term-surface': '#041322',
          '--color-term-border': '#005b8a',
          '--color-term-border-bright': '#00f3ff',
          '--color-term-green': '#00F3FF',
          '--color-term-cyan': '#38bdf8',
          '--color-term-text': '#dbeafe',
          '--color-term-muted': '#64748b',
          '--color-term-dim': '#0c4a6e',
          '--color-term-dimmer': '#041d2c',
          '--color-term-error': '#f43f5e',
          '--color-term-warning': '#fbbf24',
          '--color-term-glow': 'rgba(0, 243, 255, 0.45)',
          '--color-term-accent': '#00f3ff',
        } as React.CSSProperties;
      case 'amber':
        return {
          '--color-term-bg': '#0e0802',
          '--color-term-surface': '#1b1104',
          '--color-term-border': '#664500',
          '--color-term-border-bright': '#ffb703',
          '--color-term-green': '#ffb703',
          '--color-term-cyan': '#fb8500',
          '--color-term-text': '#fef08a',
          '--color-term-muted': '#a16207',
          '--color-term-dim': '#451a03',
          '--color-term-dimmer': '#290f02',
          '--color-term-error': '#ef4444',
          '--color-term-warning': '#fde047',
          '--color-term-glow': 'rgba(255, 183, 3, 0.45)',
          '--color-term-accent': '#ffb703',
        } as React.CSSProperties;
      case 'magenta':
        return {
          '--color-term-bg': '#0d020d',
          '--color-term-surface': '#1a051a',
          '--color-term-border': '#701a75',
          '--color-term-border-bright': '#ff007f',
          '--color-term-green': '#ff007f',
          '--color-term-cyan': '#c084fc',
          '--color-term-text': '#f5d0fe',
          '--color-term-muted': '#a21caf',
          '--color-term-dim': '#4a044e',
          '--color-term-dimmer': '#2c022f',
          '--color-term-error': '#f43f5e',
          '--color-term-warning': '#fde047',
          '--color-term-glow': 'rgba(255, 0, 127, 0.45)',
          '--color-term-accent': '#ff007f',
        } as React.CSSProperties;
      case 'green':
      default:
        return {
          '--color-term-bg': '#030707',
          '--color-term-surface': '#020d0d',
          '--color-term-border': '#005b5b',
          '--color-term-border-bright': '#00ff88',
          '--color-term-green': '#00FF88',
          '--color-term-cyan': '#00F3FF',
          '--color-term-text': '#38e8d8',
          '--color-term-muted': '#1f7d75',
          '--color-term-dim': '#145338',
          '--color-term-dimmer': '#0a291c',
          '--color-term-error': '#FF5555',
          '--color-term-warning': '#FFD166',
          '--color-term-glow': 'rgba(0, 255, 136, 0.45)',
          '--color-term-accent': '#00ff88',
        } as React.CSSProperties;
    }
  }, [settings.theme]);

  return (
    <div
      style={themeVars}
      className={`h-screen w-screen bg-[var(--color-term-bg)] text-[var(--color-term-cyan)] overflow-hidden select-none p-2 sm:p-3 relative flex flex-col justify-between font-mono ${
        settings.screenGlow ? 'glow-mode' : ''
      }`}
    >
      {/* Subtle CRT Scanlines Overlay controlled by Settings */}
      {settings.crtScanlines && (
        <div
          className="fixed inset-0 crt-overlay z-40 pointer-events-none"
          style={{ opacity: (dspSettings.scanlineDensity || 72) / 180 }}
        />
      )}

      {/* TopBar System Header */}
      <TerminalHeader
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCinema={() => setIsCinemaOpen(true)}
      />

      {/* Main Content 12-Column Grid */}
      <main
        className="flex-1 grid grid-cols-12 gap-2 pt-2 min-h-0 overflow-hidden"
        data-purpose="main-layout"
      >
        {/* Left Sidebar (2 cols) */}
        <TerminalSidebar
          mediaMode={mediaMode}
          onSetMediaMode={setMediaMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFeed={activeFeed}
          onSelectFeed={setActiveFeed}
          onSelectStreamPreset={handleSelectStreamPreset}
          onOpenAddStream={() => setIsAddStreamOpen(true)}
          counts={counts}
          className="col-span-12 md:col-span-3 lg:col-span-2"
        />

        {/* Center Main Workspace (7 cols) */}
        <div
          className="col-span-12 md:col-span-9 lg:col-span-7 flex flex-col gap-2 min-h-0 overflow-hidden"
          data-purpose="center-main-workspace"
        >
          {mediaMode === 'video' ? (
            /* Dedicated High-Density ASCII Stream View & Deck */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <AsciiStreamScreen
                dspSettings={dspSettings}
                theme={settings.theme}
                onUpdateDspSettings={handleUpdateDspSettings}
                className="flex-1 min-h-0"
              />
              <ControllerDeck
                dspSettings={dspSettings}
                onUpdateDspSettings={handleUpdateDspSettings}
                onOpenCinema={() => setIsCinemaOpen(true)}
              />
            </div>
          ) : (
            /* Audio Mode: Music Library Table with Search & Filtering */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <MusicLibrary
                tracks={displayedTracks}
                title="Audio Library &amp; HiFi Tracks"
                subtitle="/music/audio-stream/"
                onOpenImport={() => setIsAddStreamOpen(true)}
                className="flex-1 min-h-0"
              />
              <ControllerDeck
                dspSettings={dspSettings}
                onUpdateDspSettings={handleUpdateDspSettings}
                onOpenCinema={() => setIsCinemaOpen(true)}
              />
            </div>
          )}

          {/* Bottom Interactive Multi-Tab Console (Queue, Logs, IRC) */}
          <InteractiveConsole
            queue={displayedTracks.length > 0 ? displayedTracks : queue}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={(track) => playTrack(track, displayedTracks)}
            terminalContext={commandContext}
          />
        </div>

        {/* Right Inspector & Telemetry Column (3 cols) */}
        <InspectorPanel
          dspSettings={dspSettings}
          onUpdateDspSettings={handleUpdateDspSettings}
          className="col-span-12 lg:col-span-3"
        />
      </main>

      {/* Add Live Stream / YouTube Stream Modal */}
      {isAddStreamOpen && (
        <AddStreamModal
          onClose={() => setIsAddStreamOpen(false)}
          onAddStream={handleAddStream}
        />
      )}

      {/* Fullscreen ASCII Cinema Theater */}
      {isCinemaOpen && (
        <ASCIICinemaModal onClose={() => setIsCinemaOpen(false)} />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          dspSettings={dspSettings}
          onUpdateSettings={handleUpdateSettings}
          onUpdateDspSettings={handleUpdateDspSettings}
          onClose={() => setIsSettingsOpen(false)}
          onClearLibrary={async () => {
            await dbManager.clearAllData();
            await refreshTracks();
          }}
        />
      )}

      {/* Shortcuts Modal */}
      {isShortcutsOpen && (
        <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}

      {/* Global Anywhere Window Drag & Drop Overlay */}
      <GlobalDropOverlay onOpenCinema={() => setIsCinemaOpen(true)} />
    </div>
  );
}
