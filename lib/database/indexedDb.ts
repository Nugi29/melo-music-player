import { Track } from '@/types/music';
import { Playlist } from '@/types/playlist';
import { UserSettings, DEFAULT_SETTINGS } from '@/types/settings';

const DB_NAME = 'MELO_OS_DB';
const DB_VERSION = 1;

export interface StoredAudioFile {
  id: string;
  blob: Blob;
  mimeType: string;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Tracks metadata store
        if (!db.objectStoreNames.contains('tracks')) {
          const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
          trackStore.createIndex('title', 'title', { unique: false });
          trackStore.createIndex('artist', 'artist', { unique: false });
          trackStore.createIndex('genre', 'genre', { unique: false });
          trackStore.createIndex('dateAdded', 'dateAdded', { unique: false });
        }

        // Binary audio files store (Blob)
        if (!db.objectStoreNames.contains('audio_files')) {
          db.createObjectStore('audio_files', { keyPath: 'id' });
        }

        // Playlists store
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }

        // Preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  // --- Tracks Operations ---
  public async saveTrack(track: Track, audioBlob?: Blob): Promise<void> {
    const db = await this.getDB();

    // 1. Save metadata (strip fileBlob from track object in metadata store for fast queries)
    const { fileBlob, ...metaOnly } = track;

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['tracks'], 'readwrite');
      const store = tx.objectStore('tracks');
      const req = store.put(metaOnly);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // 2. Save binary Blob if provided
    const blobToSave = audioBlob || fileBlob;
    if (blobToSave) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['audio_files'], 'readwrite');
        const store = tx.objectStore('audio_files');
        const fileRecord: StoredAudioFile = {
          id: track.id,
          blob: blobToSave,
          mimeType: track.mimeType || blobToSave.type || 'audio/mpeg',
        };
        const req = store.put(fileRecord);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }

  public async getAllTracks(): Promise<Track[]> {
    const db = await this.getDB();
    return new Promise<Track[]>((resolve, reject) => {
      const tx = db.transaction(['tracks'], 'readonly');
      const store = tx.objectStore('tracks');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as Track[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async getAudioBlob(trackId: string): Promise<Blob | null> {
    const db = await this.getDB();
    return new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(['audio_files'], 'readonly');
      const store = tx.objectStore('audio_files');
      const req = store.get(trackId);
      req.onsuccess = () => {
        const result = req.result as StoredAudioFile | undefined;
        resolve(result?.blob || null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteTrack(trackId: string): Promise<void> {
    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['tracks', 'audio_files'], 'readwrite');
      tx.objectStore('tracks').delete(trackId);
      tx.objectStore('audio_files').delete(trackId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async updateTrack(track: Partial<Track> & { id: string }): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['tracks'], 'readwrite');
      const store = tx.objectStore('tracks');
      const getReq = store.get(track.id);
      getReq.onsuccess = () => {
        const existing = getReq.result as Track | undefined;
        if (!existing) {
          reject(new Error(`Track ${track.id} not found`));
          return;
        }
        const updated = { ...existing, ...track };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // --- Playlists Operations ---
  public async getAllPlaylists(): Promise<Playlist[]> {
    const db = await this.getDB();
    return new Promise<Playlist[]>((resolve, reject) => {
      const tx = db.transaction(['playlists'], 'readonly');
      const store = tx.objectStore('playlists');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as Playlist[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async savePlaylist(playlist: Playlist): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['playlists'], 'readwrite');
      const store = tx.objectStore('playlists');
      const req = store.put(playlist);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async deletePlaylist(playlistId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['playlists'], 'readwrite');
      const store = tx.objectStore('playlists');
      const req = store.delete(playlistId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Settings Operations ---
  public async getSettings(): Promise<UserSettings> {
    try {
      const db = await this.getDB();
      return new Promise<UserSettings>((resolve) => {
        const tx = db.transaction(['preferences'], 'readonly');
        const store = tx.objectStore('preferences');
        const req = store.get('user_settings');
        req.onsuccess = () => {
          if (req.result && req.result.value) {
            resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
          } else {
            // Check LocalStorage fallback
            if (typeof window !== 'undefined') {
              const local = localStorage.getItem('nugi_os_settings');
              if (local) {
                try {
                  resolve({ ...DEFAULT_SETTINGS, ...JSON.parse(local) });
                  return;
                } catch {
                  // fallback to default
                }
              }
            }
            resolve(DEFAULT_SETTINGS);
          }
        };
        req.onerror = () => resolve(DEFAULT_SETTINGS);
      });
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(settings: UserSettings): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nugi_os_settings', JSON.stringify(settings));
    }
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['preferences'], 'readwrite');
        const store = tx.objectStore('preferences');
        const req = store.put({ key: 'user_settings', value: settings });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignore if indexedDB is not available
    }
  }

  // --- Storage Quota and Clear ---
  public async getStorageEstimate(): Promise<{ usedBytes: number; quotaBytes: number } | null> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usedBytes: estimate.usage || 0,
          quotaBytes: estimate.quota || 0,
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  public async clearAllData(): Promise<void> {
    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['tracks', 'audio_files', 'playlists', 'preferences'], 'readwrite');
      tx.objectStore('tracks').clear();
      tx.objectStore('audio_files').clear();
      tx.objectStore('playlists').clear();
      tx.objectStore('preferences').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nugi_os_settings');
    }
  }
}

export const dbManager = new IndexedDBManager();
