import { Track } from '@/types/music';
import { Playlist } from '@/types/playlist';
import { VisualizerMode, TerminalTheme } from '@/types/settings';
import { formatDuration } from '@/lib/utils/formatters';

export interface CommandContext {
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  shuffle: boolean;
  repeatMode: 'off' | 'track' | 'all';
  playlists: Playlist[];
  visualizerMode: VisualizerMode;
  theme: TerminalTheme;

  // Actions
  playTrack: (track: Track) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (val: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'track' | 'all') => void;
  toggleLike: (trackId?: string) => Promise<void>;
  refreshTracks: () => Promise<void>;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setTheme: (theme: TerminalTheme) => void;
  createPlaylist: (name: string) => Promise<Playlist>;
  playPlaylist: (name: string) => Promise<boolean>;
  clearHistory: () => void;
  minimizeTerminal?: () => void;
  openCinema?: () => void;
  openImport?: () => void;
  addTracks?: (tracks: Track[]) => Promise<void>;
}

export interface CommandResult {
  output: string;
  type?: 'output' | 'error' | 'success' | 'info';
}

export const AVAILABLE_COMMANDS = [
  'help',
  'ls',
  'scan',
  'search',
  'play',
  'pause',
  'resume',
  'next',
  'prev',
  'volume',
  'shuffle',
  'repeat',
  'playlist',
  'like',
  'visualizer',
  'clear',
  'history',
  'status',
  'theme',
  'cinema',
  'video',
  'youtube',
  'import',
  'exit',
];

function extractYouTubeId(input: string): string | null {
  const match = input.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim()) && !input.includes(' ')) {
    return input.trim();
  }
  return null;
}

async function resolveAndPlayYouTube(
  targetUrlOrId: string,
  context: CommandContext
): Promise<CommandResult> {
  try {
    const res = await fetch(`/api/youtube?url=${encodeURIComponent(targetUrlOrId)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        output: `[YOUTUBE ERROR] ${errData.error || 'Failed to resolve YouTube stream.'}`,
        type: 'error',
      };
    }

    const data = await res.json();
    if (!data.videoId && !data.title) {
      return {
        output: `[YOUTUBE ERROR] Video could not be resolved for: ${targetUrlOrId}`,
        type: 'error',
      };
    }

    const videoId = data.videoId || extractYouTubeId(targetUrlOrId) || String(Date.now());
    const isDirect = Boolean(data.streamUrl);

    const ytTrack: Track = {
      id: `yt_${videoId}`,
      youtubeId: videoId,
      title: data.title || 'YouTube Video',
      artist: data.artist || 'YouTube Stream',
      album: 'YouTube Stream',
      duration: data.duration || 0,
      genre: 'YouTube Video',
      pictureUrl: data.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      audioSrc: data.streamUrl || undefined,
      dateAdded: Date.now(),
      playCount: 1,
      isLiked: false,
      source: 'demo',
      isVideo: true,
      videoWidth: 1280,
      videoHeight: 720,
    };

    // Save to IndexedDB
    try {
      const { dbManager } = await import('@/lib/database/indexedDb');
      await dbManager.saveTrack(ytTrack);
    } catch (e) {
      console.warn('Could not cache YouTube track to IndexedDB:', e);
    }

    if (context.addTracks) {
      await context.addTracks([ytTrack]);
    }
    await context.refreshTracks();
    await context.playTrack(ytTrack);

    // Auto-open cinema if available for full immersion
    if (context.openCinema) {
      context.openCinema();
    }

    return {
      output: [
        '╔═══════════════════════════════════════════════════════════════╗',
        '║             YOUTUBE ASCII VIDEO STREAM CONNECTED              ║',
        '╚═══════════════════════════════════════════════════════════════╝',
        `TITLE    : ${data.title || ytTrack.title}`,
        `ARTIST   : ${data.artist || ytTrack.artist}`,
        `DURATION : ${formatDuration(data.duration || ytTrack.duration)}`,
        `MODE     : ${isDirect ? 'DIRECT ASCII CANVAS STREAM' : 'CRT RETRO VIDEO & ASCII MATRIX THEATER'}`,
        'SETTINGS : CYBER CHARSET • TRUECOLOR RGB • ULTRA RES • PULSE OFF',
        'DECODER  : REAL-TIME ASCII VIDEO ENGINE ONLINE (60 FPS)',
      ].join('\n'),
      type: 'success',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      output: `[YOUTUBE ERROR] Connection failed: ${msg}`,
      type: 'error',
    };
  }
}

export async function parseAndExecuteCommand(
  rawInput: string,
  context: CommandContext
): Promise<CommandResult> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { output: '', type: 'output' };
  }

  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'help': {
      if (args.length > 0) {
        const cmd = args[0].toLowerCase();
        switch (cmd) {
          case 'play':
            return { output: 'Usage: play <track_number | title>\nExample: play 1\nExample: play synthwave' };
          case 'volume':
            return { output: 'Usage: volume <0-100>\nExample: volume 75' };
          case 'visualizer':
            return { output: 'Usage: visualizer <equalizer | waveform | spectrum | matrix | pulse>' };
          case 'theme':
            return { output: 'Usage: theme <green | cyan | amber | magenta>' };
          case 'playlist':
            return { output: 'Usage: playlist list\nUsage: playlist create <name>\nUsage: playlist play <name>' };
          default:
            return { output: `Command '${cmd}' available. Run without args for help.` };
        }
      }

      return {
        output: [
          '╔═══════════════════════════════════════════════════════════════╗',
          '║               MELO_OS COMMAND LINE INTERFACE                  ║',
          '╚═══════════════════════════════════════════════════════════════╝',
          'Available Commands:',
          '  help [cmd]       - Display command manual and usage',
          '  ls               - List imported audio tracks in library',
          '  scan             - Rescan local library storage',
          '  search <query>   - Search tracks by title, artist, or album',
          '  play <num|title|url> - Play track or stream YouTube video directly',
          '  youtube <url>    - Stream YouTube video with live ASCII playback',
          '  pause            - Pause current playback',
          '  resume           - Resume audio playback',
          '  next             - Skip to the next track',
          '  prev             - Return to previous track',
          '  volume <0-100>   - Adjust master output volume',
          '  shuffle          - Toggle random shuffle playback',
          '  repeat [off|track|all] - Set repeat mode',
          '  playlist [sub]   - Manage playlists (list, create, play)',
          '  like             - Toggle favorite status for active track',
          '  visualizer <mode>- Set ASCII mode (eq, wave, spec, matrix, pulse)',
          '  cinema           - Open full-screen ASCII Video Cinema',
          '  status           - View system status, playback & engine info',
          '  theme <name>     - Switch color theme (green, cyan, amber, magenta)',
          '  clear            - Clear terminal screen output',
          '  history          - View past executed command history',
          '  exit             - Minimize or close terminal view',
        ].join('\n'),
        type: 'info',
      };
    }

    case 'ls': {
      if (context.allTracks.length === 0) {
        return { output: '[FS] Music library empty. Use "scan" or Import Music in UI.', type: 'info' };
      }

      const lines = context.allTracks.map((t, idx) => {
        const num = String(idx + 1).padStart(3, '0');
        const isCurrent = context.currentTrack?.id === t.id ? '▶' : ' ';
        return `${isCurrent} [${num}] ${t.title.padEnd(25).slice(0, 25)} - ${t.artist.padEnd(18).slice(0, 18)} (${formatDuration(t.duration)})`;
      });

      return {
        output: `[LIBRARY] Total tracks: ${context.allTracks.length}\n` + lines.join('\n'),
        type: 'output',
      };
    }

    case 'scan': {
      await context.refreshTracks();
      return {
        output: `[SYSTEM] Storage scan complete. ${context.allTracks.length} tracks registered in IndexedDB.`,
        type: 'success',
      };
    }

    case 'search': {
      if (args.length === 0) {
        return { output: 'Error: Missing search query. Usage: search <query>', type: 'error' };
      }
      const query = args.join(' ').toLowerCase();
      const matches = context.allTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.artist.toLowerCase().includes(query) ||
          t.album.toLowerCase().includes(query) ||
          t.genre.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        return { output: `[SEARCH] No matching tracks found for "${query}".`, type: 'info' };
      }

      const results = matches.map((t) => {
        const idx = context.allTracks.findIndex((track) => track.id === t.id);
        const num = String(idx + 1).padStart(3, '0');
        return `[${num}] ${t.title} by ${t.artist} (${t.album}) [${t.genre}]`;
      });

      return {
        output: `[SEARCH] ${matches.length} matching track(s) found:\n` + results.join('\n'),
        type: 'success',
      };
    }

    case 'play': {
      if (args.length === 0) {
        if (!context.isPlaying && context.currentTrack) {
          await context.resume();
          return { output: `[PLAYER] Resumed: ${context.currentTrack.title}`, type: 'success' };
        } else if (context.allTracks.length > 0) {
          await context.playTrack(context.allTracks[0]);
          return { output: `[PLAYER] Playing [001]: ${context.allTracks[0].title}`, type: 'success' };
        }
        return { output: 'Error: No track specified and library is empty.', type: 'error' };
      }

      const query = args.join(' ').trim();

      // Check if YouTube URL or video ID
      const ytId = extractYouTubeId(query);
      if (ytId) {
        return await resolveAndPlayYouTube(query, context);
      }

      // Check if number
      const trackNum = parseInt(query, 10);
      if (!isNaN(trackNum) && trackNum >= 1 && trackNum <= context.allTracks.length) {
        const target = context.allTracks[trackNum - 1];
        await context.playTrack(target);
        return {
          output: `[PLAYER] Playing track [${String(trackNum).padStart(3, '0')}]: ${target.title} - ${target.artist}`,
          type: 'success',
        };
      }

      // Check title or artist match
      const lower = query.toLowerCase();
      const match = context.allTracks.find(
        (t) => t.title.toLowerCase().includes(lower) || t.artist.toLowerCase().includes(lower)
      );

      if (match) {
        await context.playTrack(match);
        return {
          output: `[PLAYER] Playing: ${match.title} - ${match.artist}`,
          type: 'success',
        };
      }

      return { output: `Error: Track "${query}" not found in library. (To stream YouTube: play https://www.youtube.com/watch?v=...)`, type: 'error' };
    }

    case 'youtube': {
      if (args.length === 0) {
        return {
          output: 'Usage: youtube <url | video_id>\nExample: youtube https://www.youtube.com/watch?v=iIm4gcybpsI',
          type: 'error',
        };
      }
      return await resolveAndPlayYouTube(args.join(' ').trim(), context);
    }

    case 'pause': {
      context.pause();
      return { output: '[PLAYER] Playback paused.', type: 'info' };
    }

    case 'resume': {
      await context.resume();
      return { output: '[PLAYER] Playback resumed.', type: 'info' };
    }

    case 'next': {
      context.nextTrack();
      return { output: '[PLAYER] Skipped to next track.', type: 'info' };
    }

    case 'prev': {
      context.prevTrack();
      return { output: '[PLAYER] Returning to previous track.', type: 'info' };
    }

    case 'volume': {
      if (args.length === 0) {
        return { output: `[AUDIO] Master Volume is currently ${Math.round(context.volume * 100)}%.` };
      }
      const val = parseInt(args[0], 10);
      if (isNaN(val) || val < 0 || val > 100) {
        return { output: 'Error: Volume must be an integer between 0 and 100.', type: 'error' };
      }
      context.setVolume(val / 100);
      return { output: `[AUDIO] Volume set to ${val}%.`, type: 'success' };
    }

    case 'shuffle': {
      context.toggleShuffle();
      return {
        output: `[PLAYER] Shuffle mode ${!context.shuffle ? 'ENABLED' : 'DISABLED'}.`,
        type: 'success',
      };
    }

    case 'repeat': {
      if (args.length === 0) {
        return { output: `[PLAYER] Repeat mode is currently: ${context.repeatMode.toUpperCase()}` };
      }
      const mode = args[0].toLowerCase();
      if (mode === 'off' || mode === 'track' || mode === 'all') {
        context.setRepeatMode(mode);
        return { output: `[PLAYER] Repeat mode set to ${mode.toUpperCase()}.`, type: 'success' };
      }
      return { output: 'Error: Repeat mode must be "off", "track", or "all".', type: 'error' };
    }

    case 'like': {
      if (!context.currentTrack) {
        return { output: 'Error: No track currently playing.', type: 'error' };
      }
      await context.toggleLike();
      const newState = !context.currentTrack.isLiked;
      return {
        output: `[LIBRARY] ${newState ? 'Favorited ♡' : 'Unfavorited'} "${context.currentTrack.title}".`,
        type: 'success',
      };
    }

    case 'visualizer': {
      if (args.length === 0) {
        return {
          output: `[VISUALIZER] Current mode: ${context.visualizerMode}.\nModes: equalizer, waveform, spectrum, matrix, pulse`,
        };
      }
      const rawMode = args[0].toLowerCase();
      let mode: VisualizerMode | null = null;
      if (rawMode === 'eq' || rawMode === 'equalizer') mode = 'equalizer';
      else if (rawMode === 'wave' || rawMode === 'waveform') mode = 'waveform';
      else if (rawMode === 'spec' || rawMode === 'bars' || rawMode === 'spectrum') mode = 'spectrum';
      else if (rawMode === 'matrix' || rawMode === 'rain') mode = 'matrix';
      else if (rawMode === 'pulse') mode = 'pulse';

      if (mode) {
        context.setVisualizerMode(mode);
        return { output: `[VISUALIZER] Switched to [${mode.toUpperCase()}] mode.`, type: 'success' };
      }
      return { output: 'Error: Unknown mode. Choose: equalizer, waveform, spectrum, matrix, pulse', type: 'error' };
    }

    case 'playlist': {
      const sub = args[0]?.toLowerCase();
      if (!sub || sub === 'list') {
        if (context.playlists.length === 0) {
          return { output: '[PLAYLISTS] No user playlists. Create one with: playlist create <name>', type: 'info' };
        }
        const list = context.playlists.map(
          (p) => `* ${p.name.padEnd(20)} (${p.trackIds.length} tracks)`
        );
        return { output: `[PLAYLISTS] Found ${context.playlists.length} playlist(s):\n` + list.join('\n') };
      }

      if (sub === 'create') {
        const name = args.slice(1).join(' ').trim();
        if (!name) return { output: 'Error: Missing playlist name. Usage: playlist create <name>', type: 'error' };
        const pl = await context.createPlaylist(name);
        return { output: `[PLAYLISTS] Created new playlist "${pl.name}".`, type: 'success' };
      }

      if (sub === 'play') {
        const name = args.slice(1).join(' ').trim();
        if (!name) return { output: 'Error: Missing playlist name. Usage: playlist play <name>', type: 'error' };
        const ok = await context.playPlaylist(name);
        if (ok) return { output: `[PLAYLISTS] Playing playlist "${name}".`, type: 'success' };
        return { output: `Error: Playlist "${name}" not found.`, type: 'error' };
      }

      return { output: 'Usage: playlist [list | create <name> | play <name>]' };
    }

    case 'status': {
      const trackInfo = context.currentTrack
        ? `${context.currentTrack.title} by ${context.currentTrack.artist} (${context.currentTrack.album})`
        : 'NONE';

      return {
        output: [
          '═══════════════════════════════════════',
          'SYSTEM: MELO_OS KERNEL v1.0.0 ONLINE',
          `PLAYBACK STATE : ${context.isPlaying ? 'PLAYING ▶' : 'PAUSED ❚❚'}`,
          `NOW PLAYING    : ${trackInfo}`,
          `VOLUME         : ${Math.round(context.volume * 100)}%`,
          `SHUFFLE        : ${context.shuffle ? 'ON' : 'OFF'}`,
          `REPEAT         : ${context.repeatMode.toUpperCase()}`,
          `VISUALIZER     : ${context.visualizerMode.toUpperCase()}`,
          `COLOR THEME    : ${context.theme.toUpperCase()}`,
          `TOTAL TRACKS   : ${context.allTracks.length}`,
          `TOTAL PLAYLISTS: ${context.playlists.length}`,
          'AUDIO ENGINE   : WEB AUDIO API READY (LOW LATENCY)',
          '═══════════════════════════════════════',
        ].join('\n'),
        type: 'info',
      };
    }

    case 'theme': {
      if (args.length === 0) {
        return {
          output: `[THEME] Current theme: ${context.theme}.\nAvailable themes: green, cyan, amber, magenta`,
        };
      }
      const t = args[0].toLowerCase() as TerminalTheme;
      if (['green', 'cyan', 'amber', 'magenta'].includes(t)) {
        context.setTheme(t);
        return { output: `[THEME] Switched UI palette to [${t.toUpperCase()}].`, type: 'success' };
      }
      return { output: 'Error: Available themes are: green, cyan, amber, magenta', type: 'error' };
    }

    case 'clear': {
      context.clearHistory();
      return { output: '', type: 'output' };
    }

    case 'cinema':
    case 'video': {
      if (context.openCinema) {
        context.openCinema();
        return {
          output: '[ASCII CINEMA ACTIVATED] Launching full-screen CRT ASCII Video Theater...',
          type: 'success',
        };
      }
      return { output: 'Cinema module unavailable', type: 'error' };
    }

    case 'import': {
      if (context.openImport) {
        context.openImport();
        return {
          output: '[INGEST ENGINE] Opening media import dropzone...',
          type: 'success',
        };
      }
      return { output: 'Import module unavailable', type: 'error' };
    }

    case 'exit': {
      if (context.minimizeTerminal) {
        context.minimizeTerminal();
      }
      return { output: '[TERMINAL] Terminal minimized.', type: 'info' };
    }

    default:
      return {
        output: `Command not found: "${command}". Type "help" to see available terminal commands.`,
        type: 'error',
      };
  }
}
