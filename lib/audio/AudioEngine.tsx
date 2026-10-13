'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track } from '@/types/music';
import { dbManager } from '@/lib/database/indexedDb';
import { DEMO_TRACKS } from '@/lib/demo/demoTracks';
import { DEFAULT_SETTINGS } from '@/types/settings';

export interface AudioContextType {
  // Audio state
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: 'off' | 'track' | 'all';
  queue: Track[];
  history: Track[];
  allTracks: Track[];
  isLoadingTrack: boolean;
  audioError: string | null;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'track' | 'all') => void;
  toggleRepeat: () => void;
  toggleLike: (trackId?: string) => Promise<void>;
  refreshTracks: () => Promise<void>;
  addTracks: (newTracks: Track[]) => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  loadDemoTracks: () => Promise<void>;

  // Web Audio Visualizer API access
  getAnalyserData: (freqArray: Uint8Array, timeArray: Uint8Array) => void;
  isAudioEngineReady: boolean;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'track' | 'all'>('all');
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [isLoadingTrack, setIsLoadingTrack] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioEngineReady, setIsAudioEngineReady] = useState<boolean>(false);

  // Audio elements & Web Audio API refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  // Initialize Web Audio Engine
  const initAudioEngine = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx || !audioRef.current) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128; // 64 frequency bins
        analyser.smoothingTimeConstant = 0.75;
        analyserRef.current = analyser;
      }

      if (!gainNodeRef.current) {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);
        gainNodeRef.current = gain;
      }

      // Ensure single MediaElementAudioSourceNode per Audio element
      if (!sourceNodeRef.current && audioRef.current && analyserRef.current && gainNodeRef.current) {
        audioRef.current.crossOrigin = 'anonymous';
        const source = ctx.createMediaElementSource(audioRef.current);
        // source -> analyser -> gainNode -> destination
        // This guarantees analyser gets audio data EVEN IF output gain is lowered or muted!
        source.connect(analyserRef.current);
        analyserRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(ctx.destination);
        sourceNodeRef.current = source;
      }

      setIsAudioEngineReady(true);
    } catch (err) {
      console.warn('Web Audio API init warning:', err);
    }
  }, [isMuted, volume]);

  // Visualizer data collector (called 60fps inside visualizers)
  const getAnalyserData = useCallback((freqArray: Uint8Array, timeArray: Uint8Array) => {
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(freqArray as unknown as Uint8Array<ArrayBuffer>);
      analyserRef.current.getByteTimeDomainData(timeArray as unknown as Uint8Array<ArrayBuffer>);
    }
  }, []);

  // Load stored tracks & settings on initial mount
  const refreshTracks = useCallback(async () => {
    try {
      const storedTracks = await dbManager.getAllTracks();
      if (storedTracks.length > 0) {
        setAllTracks(storedTracks);
      } else {
        // If empty, preload local demo tracks into state
        setAllTracks(DEMO_TRACKS);
      }
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setAllTracks(DEMO_TRACKS);
    }
  }, []);

  // Initialize Audio Element ONCE on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.8;
    audioRef.current = audio;

    // Load initial settings
    dbManager.getSettings().then((settings) => {
      setVolumeState(settings.volume);
      audio.volume = settings.volume;
      setIsMuted(settings.isMuted);
      audio.muted = settings.isMuted;
      setShuffle(settings.shuffle);
      setRepeatMode(settings.repeatMode);
    });

    // Event listeners
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoadingTrack(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setAudioError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      setIsLoadingTrack(false);
      setIsPlaying(false);
      setAudioError('Failed to load audio source');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    refreshTracks();

    // Auto-resume AudioContext on first user interaction
    const unlockAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [refreshTracks]); // Note: volume is deliberately excluded so volume changes never recreate audio!

  // Handle Play track
  const playTrack = useCallback(
    async (track: Track, newQueue?: Track[]) => {
      const audio = audioRef.current;
      if (!audio) return;

      setIsLoadingTrack(true);
      setAudioError(null);

      // Initialize Web Audio on first user interaction
      initAudioEngine();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      try {
        // Determine audio source URL
        let sourceUrl = track.audioSrc;

        // If local track and no sourceUrl, retrieve blob from IndexedDB
        if (!sourceUrl && track.source === 'local') {
          const blob = await dbManager.getAudioBlob(track.id);
          if (blob) {
            if (activeBlobUrlRef.current) {
              URL.revokeObjectURL(activeBlobUrlRef.current);
            }
            sourceUrl = URL.createObjectURL(blob);
            activeBlobUrlRef.current = sourceUrl;
          }
        }

        if (!sourceUrl) {
          throw new Error(`Unable to resolve audio source for ${track.title}`);
        }

        audio.src = sourceUrl;
        audio.currentTime = 0;
        await audio.play();

        setCurrentTrack(track);
        setIsPlaying(true);

        // Record play count and recently played
        const updatedPlayCount = (track.playCount || 0) + 1;
        dbManager.updateTrack({ id: track.id, playCount: updatedPlayCount }).catch(() => {});
        setAllTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, playCount: updatedPlayCount } : t))
        );

        // Update queue and history
        if (newQueue) {
          setQueue(newQueue);
        } else {
          setQueue((prev) => (prev.length === 0 ? allTracks : prev));
        }

        setHistory((prev) => [track, ...prev.filter((t) => t.id !== track.id).slice(0, 50)]);
      } catch (err: unknown) {
        console.error('Audio playback error:', err);
        const msg = err instanceof Error ? err.message : 'Playback failed';
        setAudioError(msg);
        setIsPlaying(false);
      } finally {
        setIsLoadingTrack(false);
      }
    },
    [allTracks, initAudioEngine]
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      if (allTracks.length > 0) {
        await playTrack(allTracks[0]);
      }
      return;
    }

    initAudioEngine();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (err) {
        console.error('Failed to resume playback:', err);
      }
    }
  }, [currentTrack, allTracks, isPlaying, playTrack, initAudioEngine]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const resume = useCallback(async () => {
    if (audioRef.current && !isPlaying) {
      initAudioEngine();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      await audioRef.current.play();
    }
  }, [isPlaying, initAudioEngine]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current && isFinite(seconds)) {
      audioRef.current.currentTime = Math.max(0, Math.min(seconds, audioRef.current.duration || seconds));
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // Safe volume adjustment: never stops audio playback!
  const setVolume = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(1, val));
      setVolumeState(clamped);

      // Direct adjustment on HTML audio element
      if (audioRef.current) {
        audioRef.current.volume = clamped;
      }

      // Direct adjustment on Web Audio GainNode
      if (gainNodeRef.current && audioContextRef.current) {
        try {
          gainNodeRef.current.gain.setValueAtTime(
            isMuted ? 0 : clamped,
            audioContextRef.current.currentTime
          );
        } catch {
          // ignore timing error if context not active
        }
      }

      dbManager
        .saveSettings({
          ...DEFAULT_SETTINGS,
          volume: clamped,
          isMuted,
          shuffle,
          repeatMode,
        })
        .catch(() => {});
    },
    [isMuted, shuffle, repeatMode]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (audioRef.current) {
        audioRef.current.muted = nextMuted;
      }
      if (gainNodeRef.current && audioContextRef.current) {
        try {
          gainNodeRef.current.gain.setValueAtTime(
            nextMuted ? 0 : volume,
            audioContextRef.current.currentTime
          );
        } catch {
          // ignore
        }
      }
      return nextMuted;
    });
  }, [volume]);

  const nextTrack = useCallback(() => {
    const activeQueue = queue.length > 0 ? queue : allTracks;
    if (activeQueue.length === 0) return;

    if (shuffle) {
      const remaining = activeQueue.filter((t) => t.id !== currentTrack?.id);
      if (remaining.length > 0) {
        const randomIndex = Math.floor(Math.random() * remaining.length);
        playTrack(remaining[randomIndex]);
        return;
      }
    }

    const currentIndex = activeQueue.findIndex((t) => t.id === currentTrack?.id);
    if (currentIndex === -1 || currentIndex >= activeQueue.length - 1) {
      // Loop to beginning if repeat is all
      if (repeatMode !== 'off') {
        playTrack(activeQueue[0]);
      } else {
        pause();
      }
    } else {
      playTrack(activeQueue[currentIndex + 1]);
    }
  }, [queue, allTracks, shuffle, currentTrack, repeatMode, playTrack, pause]);

  const prevTrack = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      // Restart current song if played more than 3 seconds
      seek(0);
      return;
    }

    const activeQueue = queue.length > 0 ? queue : allTracks;
    if (activeQueue.length === 0) return;

    const currentIndex = activeQueue.findIndex((t) => t.id === currentTrack?.id);
    if (currentIndex <= 0) {
      playTrack(activeQueue[activeQueue.length - 1]);
    } else {
      playTrack(activeQueue[currentIndex - 1]);
    }
  }, [queue, allTracks, currentTrack, playTrack, seek]);

  // Handle Track Ended Event
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatMode === 'track') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, nextTrack]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'all') return 'track';
      if (prev === 'track') return 'off';
      return 'all';
    });
  }, []);

  const toggleLike = useCallback(
    async (trackId?: string) => {
      const targetId = trackId || currentTrack?.id;
      if (!targetId) return;

      setAllTracks((prev) =>
        prev.map((t) => {
          if (t.id === targetId) {
            const nextLiked = !t.isLiked;
            dbManager.updateTrack({ id: targetId, isLiked: nextLiked }).catch(() => {});
            return { ...t, isLiked: nextLiked };
          }
          return t;
        })
      );

      if (currentTrack && currentTrack.id === targetId) {
        setCurrentTrack((prev) => (prev ? { ...prev, isLiked: !prev.isLiked } : null));
      }
    },
    [currentTrack]
  );

  const addTracks = useCallback(async (newTracks: Track[]) => {
    setAllTracks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const filtered = newTracks.filter((t) => !existingIds.has(t.id));
      return [...filtered, ...prev];
    });
  }, []);

  const deleteTrack = useCallback(
    async (trackId: string) => {
      await dbManager.deleteTrack(trackId);
      setAllTracks((prev) => prev.filter((t) => t.id !== trackId));
      setQueue((prev) => prev.filter((t) => t.id !== trackId));
      if (currentTrack?.id === trackId) {
        pause();
        setCurrentTrack(null);
      }
    },
    [currentTrack, pause]
  );

  const loadDemoTracks = useCallback(async () => {
    for (const demo of DEMO_TRACKS) {
      await dbManager.saveTrack(demo);
    }
    await refreshTracks();
  }, [refreshTracks]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        shuffle,
        repeatMode,
        queue,
        history,
        allTracks,
        isLoadingTrack,
        audioError,
        playTrack,
        togglePlay,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        nextTrack,
        prevTrack,
        toggleShuffle,
        setRepeatMode,
        toggleRepeat,
        toggleLike,
        refreshTracks,
        addTracks,
        deleteTrack,
        loadDemoTracks,
        getAnalyserData,
        isAudioEngineReady,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
