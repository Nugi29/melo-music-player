'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAudio } from '@/lib/audio/AudioEngine';
import { ActiveSection, Track } from '@/types/music';
import { Playlist } from '@/types/playlist';
import { UserSettings, DEFAULT_SETTINGS, TerminalTheme, VisualizerMode } from '@/types/settings';
import { dbManager } from '@/lib/database/indexedDb';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import MusicLibrary from '../library/MusicLibrary';
import NowPlayingPanel from '../player/NowPlayingPanel';
import Terminal from '../terminal/Terminal';
import MobileMiniPlayer from '../player/MobileMiniPlayer';
import ImportDropzone from '../library/ImportDropzone';
import SettingsModal from '../modals/SettingsModal';
import PlaylistModal from '../modals/PlaylistModal';
import ShortcutsModal from '../modals/ShortcutsModal';
import GlobalDropOverlay from '../library/GlobalDropOverlay';
import ASCIICinemaModal from '../modals/ASCIICinemaModal';
import { CommandContext } from '../terminal/commandParser';
import { X, Layers } from 'lucide-react';

export default function MainLayout() {
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
  } = useAudio();

  // Settings State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Navigation State
  const [activeSection, setActiveSection] = useState<ActiveSection>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');

  // Modals & Panels State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPlaylistsModalOpen, setIsPlaylistsModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isCinemaOpen, setIsCinemaOpen] = useState<boolean>(false);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState<boolean>(false);

  // Mobile Views
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState<boolean>(false);
  const [isMobileTerminalOpen, setIsMobileTerminalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Load Settings and Playlists from IndexedDB
  useEffect(() => {
    dbManager.getSettings().then((s) => setSettings(s));
    dbManager.getAllPlaylists().then((p) => setPlaylists(p));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      dbManager.saveSettings(updated).catch(() => {});
      return updated;
    });
  }, []);

  // Playlist handlers
  const handleCreatePlaylist = useCallback(async (name: string, description?: string): Promise<Playlist> => {
    const pl: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      description,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbManager.savePlaylist(pl);
    setPlaylists((prev) => [...prev, pl]);
    return pl;
  }, []);

  const handleDeletePlaylist = useCallback(async (id: string) => {
    await dbManager.deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlaylistId === id) {
      setSelectedPlaylistId(null);
      setActiveSection('all');
    }
  }, [selectedPlaylistId]);

  const handlePlayPlaylist = useCallback(async (playlist: Playlist) => {
    const playlistTracks = allTracks.filter((t) => playlist.trackIds.includes(t.id));
    if (playlistTracks.length > 0) {
      await playTrack(playlistTracks[0], playlistTracks);
    }
  }, [allTracks, playTrack]);

  // Track sets according to active section
  const currentDisplayedTracks = useMemo(() => {
    switch (activeSection) {
      case 'liked':
        return allTracks.filter((t) => t.isLiked);
      case 'recent':
        return history;
      case 'most-played':
        return [...allTracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      case 'genre':
        if (selectedGenre === 'ALL') return allTracks;
        return allTracks.filter((t) => t.genre.toLowerCase() === selectedGenre.toLowerCase());
      case 'playlist': {
        if (!selectedPlaylistId) return allTracks;
        const pl = playlists.find((p) => p.id === selectedPlaylistId);
        if (!pl) return allTracks;
        return allTracks.filter((t) => pl.trackIds.includes(t.id));
      }
      case 'videos':
        return allTracks.filter((t) => t.isVideo);
      case 'folders':
        return allTracks.filter((t) => t.source === 'local');
      case 'all':
      default:
        return allTracks;
    }
  }, [activeSection, allTracks, history, selectedGenre, selectedPlaylistId, playlists]);

  const libraryTitle = useMemo(() => {
    switch (activeSection) {
      case 'liked':
        return 'Liked Songs [Favorites]';
      case 'recent':
        return 'Recently Played Stream';
      case 'most-played':
        return 'Most Played Tracks';
      case 'genre':
        return `Genre: ${selectedGenre}`;
      case 'playlist': {
        const pl = playlists.find((p) => p.id === selectedPlaylistId);
        return pl ? `Playlist: ${pl.name}` : 'Playlists';
      }
      case 'videos':
        return 'Videos Library [ASCII Playback Engine]';
      case 'folders':
        return 'Local Files Directory';
      case 'all':
      default:
        return 'Music Library';
    }
  }, [activeSection, selectedGenre, selectedPlaylistId, playlists]);

  // Unique genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    allTracks.forEach((t) => {
      if (t.genre) set.add(t.genre);
    });
    return Array.from(set);
  }, [allTracks]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsPlaylistsModalOpen(false);
        setIsShortcutsOpen(false);
        setIsImportModalOpen(false);
        setIsMobilePlayerOpen(false);
        setIsMobileTerminalOpen(false);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      // Non-input hotkeys
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

  // Build command context for Terminal
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
      playTrack,
      togglePlay,
      pause,
      resume,
      nextTrack: () => {},
      prevTrack: () => {},
      setVolume,
      toggleShuffle,
      setRepeatMode,
      toggleLike,
      refreshTracks,
      setVisualizerMode: (mode: VisualizerMode) => updateSettings({ visualizerMode: mode }),
      setTheme: (theme: TerminalTheme) => updateSettings({ theme }),
      createPlaylist: handleCreatePlaylist,
      playPlaylist: async (name: string) => {
        const pl = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (pl) {
          await handlePlayPlaylist(pl);
          return true;
        }
        return false;
      },
      clearHistory: () => {},
      minimizeTerminal: () => setIsTerminalMinimized((prev) => !prev),
      openCinema: () => setIsCinemaOpen(true),
      openImport: () => setIsImportModalOpen(true),
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
      settings.visualizerMode,
      settings.theme,
      playTrack,
      togglePlay,
      pause,
      resume,
      setVolume,
      toggleShuffle,
      setRepeatMode,
      toggleLike,
      refreshTracks,
      addTracks,
      updateSettings,
      handleCreatePlaylist,
      handlePlayPlaylist,
    ]
  );

  // Set theme colors via CSS variables on root
  const themeStyles = useMemo(() => {
    switch (settings.theme) {
      case 'cyan':
        return {
          '--color-term-bg': '#020b14',
          '--color-term-surface': '#041322',
          '--color-term-border': '#005b8a',
          '--color-term-green': '#00F3FF',
          '--color-term-cyan': '#38bdf8',
          '--color-term-text': '#dbeafe',
          '--color-term-muted': '#64748b',
          '--color-term-dim': '#0c4a6e',
          '--color-term-error': '#f43f5e',
          '--color-term-warning': '#fbbf24',
        } as React.CSSProperties;
      case 'amber':
        return {
          '--color-term-bg': '#0e0802',
          '--color-term-surface': '#1b1104',
          '--color-term-border': '#664500',
          '--color-term-green': '#ffb703',
          '--color-term-cyan': '#fb8500',
          '--color-term-text': '#fef08a',
          '--color-term-muted': '#a16207',
          '--color-term-dim': '#451a03',
          '--color-term-error': '#ef4444',
          '--color-term-warning': '#fde047',
        } as React.CSSProperties;
      case 'magenta':
        return {
          '--color-term-bg': '#0d020d',
          '--color-term-surface': '#1a051a',
          '--color-term-border': '#701a75',
          '--color-term-green': '#ff007f',
          '--color-term-cyan': '#c084fc',
          '--color-term-text': '#f5d0fe',
          '--color-term-muted': '#a21caf',
          '--color-term-dim': '#4a044e',
          '--color-term-error': '#f43f5e',
          '--color-term-warning': '#fde047',
        } as React.CSSProperties;
      case 'green':
      default:
        return {
          '--color-term-bg': '#030605',
          '--color-term-surface': '#07100C',
          '--color-term-border': '#124B35',
          '--color-term-green': '#00FF88',
          '--color-term-cyan': '#00D9FF',
          '--color-term-text': '#D5FFE8',
          '--color-term-muted': '#79A992',
          '--color-term-dim': '#145338',
          '--color-term-error': '#FF5555',
          '--color-term-warning': '#FFD166',
        } as React.CSSProperties;
    }
  }, [settings.theme]);

  return (
    <div
      style={themeStyles}
      className={`h-screen w-screen overflow-hidden flex flex-col justify-between bg-[var(--color-term-bg)] text-[var(--color-term-cyan)] font-mono p-1.5 sm:p-2.5 relative select-none ${
        settings.screenGlow ? 'glow-mode' : ''
      }`}
    >
      {/* CRT Scanline Aesthetic Overlay */}
      {settings.crtScanlines && (
        <div className="fixed inset-0 crt-overlay z-40 pointer-events-none opacity-30" />
      )}

      {/* Top Status Bar */}
      <TopBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => {
          const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          input?.focus();
        }}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Grid: Sidebar (2) + Center Library/Terminal (7) + Right Now Playing (3) */}
      <main className="flex-1 grid grid-cols-12 gap-2 pt-2 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={(sec) => {
            setActiveSection(sec);
            setSelectedPlaylistId(null);
          }}
          selectedGenre={selectedGenre}
          onSelectGenre={(g) => {
            setActiveSection('genre');
            setSelectedGenre(g);
          }}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={(plId) => {
            setActiveSection('playlist');
            setSelectedPlaylistId(plId);
          }}
          playlists={playlists}
          genres={genres}
          totalTracksCount={allTracks.length}
          likedTracksCount={allTracks.filter((t) => t.isLiked).length}
          recentTracksCount={history.length}
          videoTracksCount={allTracks.filter((t) => t.isVideo).length}
          onOpenImport={() => setIsImportModalOpen(true)}
          onOpenCreatePlaylist={() => setIsPlaylistsModalOpen(true)}
          className="hidden md:flex md:col-span-3 lg:col-span-2 min-h-0"
        />

        {/* Center Main Workspace (Library + Terminal CLI) */}
        <div className="col-span-12 md:col-span-9 lg:col-span-7 flex flex-col gap-2 min-h-0 overflow-hidden">
          {/* Main Library View */}
          <MusicLibrary
            tracks={currentDisplayedTracks}
            title={libraryTitle}
            subtitle={`/music/${activeSection}/`}
            onOpenImport={() => setIsImportModalOpen(true)}
            className="flex-1 min-h-0"
          />

          {/* Bottom Interactive Terminal CLI */}
          <Terminal
            context={commandContext}
            isMinimized={isTerminalMinimized}
            onToggleMinimize={() => setIsTerminalMinimized((prev) => !prev)}
            className={`${
              isTerminalMinimized ? 'h-8' : 'h-44 sm:h-48'
            } shrink-0 transition-all`}
          />
        </div>

        {/* Right Now-Playing Panel (Visualizer, Controls, Artwork) */}
        <NowPlayingPanel
          visualizerMode={settings.visualizerMode}
          onVisualizerModeChange={(mode) => updateSettings({ visualizerMode: mode })}
          onOpenCinema={() => setIsCinemaOpen(true)}
          className="hidden lg:flex lg:col-span-3 min-h-0"
        />
      </main>

      {/* Mobile Bottom Mini Player Bar */}
      <MobileMiniPlayer
        onOpenFullPlayer={() => setIsMobilePlayerOpen(true)}
        onOpenTerminal={() => setIsMobileTerminalOpen(true)}
      />

      {/* Mobile Full Screen Now Playing Drawer Modal */}
      {isMobilePlayerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#020b0b] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-term-border)]">
            <span className="font-bold text-[var(--color-term-green)]">NOW PLAYING</span>
            <button
              onClick={() => setIsMobilePlayerOpen(false)}
              className="p-1 text-[var(--color-term-muted)] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <NowPlayingPanel
              visualizerMode={settings.visualizerMode}
              onVisualizerModeChange={(mode) => updateSettings({ visualizerMode: mode })}
              onOpenCinema={() => {
                setIsMobilePlayerOpen(false);
                setIsCinemaOpen(true);
              }}
              className="h-full border-none p-0"
            />
          </div>
        </div>
      )}

      {/* Mobile Terminal Drawer Modal */}
      {isMobileTerminalOpen && (
        <div className="fixed inset-0 z-50 bg-[#020b0b] p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-term-border)] mb-2">
            <span className="font-bold text-[var(--color-term-green)]">TERMINAL CLI</span>
            <button
              onClick={() => setIsMobileTerminalOpen(false)}
              className="p-1 text-[var(--color-term-muted)] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Terminal
            context={commandContext}
            isMinimized={false}
            className="flex-1"
          />
        </div>
      )}

      {/* Ingest / Import Audio Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg">
            <ImportDropzone
              onClose={() => setIsImportModalOpen(false)}
              onImportComplete={() => {
                refreshTracks();
              }}
            />
          </div>
        </div>
      )}

      {/* System Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={() => setIsSettingsOpen(false)}
          onClearLibrary={async () => {
            await dbManager.clearAllData();
            await refreshTracks();
            setPlaylists([]);
          }}
        />
      )}

      {/* Playlists Manager Modal */}
      {isPlaylistsModalOpen && (
        <PlaylistModal
          playlists={playlists}
          allTracks={allTracks}
          onClose={() => setIsPlaylistsModalOpen(false)}
          onCreatePlaylist={handleCreatePlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onPlayPlaylist={handlePlayPlaylist}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {isShortcutsOpen && (
        <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}

      {/* Global Anywhere Window Drag & Drop Overlay */}
      <GlobalDropOverlay onOpenCinema={() => setIsCinemaOpen(true)} />

      {/* Full Screen ASCII Video Cinema Theater */}
      {isCinemaOpen && (
        <ASCIICinemaModal onClose={() => setIsCinemaOpen(false)} />
      )}
    </div>
  );
}
