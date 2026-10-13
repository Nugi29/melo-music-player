export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  genre: string;
  year?: number;
  trackNumber?: number;
  pictureUrl?: string; // object URL or data URL
  fileBlob?: Blob; // original file blob stored in IndexedDB
  audioSrc?: string; // playback URL (blob url or demo url)
  dateAdded: number; // timestamp
  playCount: number;
  isLiked: boolean;
  source: 'local' | 'demo';
  sizeBytes?: number;
  mimeType?: string;
}

export type SortField = 'trackNumber' | 'title' | 'artist' | 'album' | 'duration' | 'dateAdded' | 'playCount';
export type SortOrder = 'asc' | 'desc';

export type LibraryViewMode = 'table' | 'grid';
export type ActiveSection = 'all' | 'liked' | 'recent' | 'most-played' | 'genre' | 'playlist' | 'folders';
