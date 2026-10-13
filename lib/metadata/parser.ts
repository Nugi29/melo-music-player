import { Track } from '@/types/music';

// Helper to sanitize text and avoid malicious/broken scripts
function cleanString(str?: string): string {
  if (!str) return '';
  return str.trim();
}

// Extract artist and title from filename like "Daft Punk - Around the World.mp3"
function parseFilenameFallback(filename: string): { title: string; artist: string } {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const parts = nameWithoutExt.split(' - ');
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }
  return {
    artist: 'Unknown Artist',
    title: nameWithoutExt.replace(/_/g, ' ').trim(),
  };
}

// Measure duration using an Audio element if metadata parser doesn't return duration
async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise<number>((resolve) => {
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(blob);
    audio.preload = 'metadata';

    const cleanUp = () => {
      URL.revokeObjectURL(objectUrl);
      audio.remove();
    };

    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      cleanUp();
      resolve(isFinite(dur) && dur > 0 ? dur : 0);
    };

    audio.onerror = () => {
      cleanUp();
      resolve(0);
    };

    audio.src = objectUrl;
  });
}

export async function parseAudioFile(file: File): Promise<{ track: Track; blob: Blob }> {
  const fallback = parseFilenameFallback(file.name);
  let title = fallback.title;
  let artist = fallback.artist;
  let album = 'Unknown Album';
  let genre = 'Electronic';
  let duration = 0;
  let year: number | undefined;
  let trackNumber: number | undefined;
  let pictureUrl: string | undefined;

  try {
    // Dynamic import to prevent SSR issues
    const mm = await import('music-metadata-browser');
    const metadata = await mm.parseBlob(file);

    if (metadata.common) {
      if (cleanString(metadata.common.title)) title = cleanString(metadata.common.title);
      if (cleanString(metadata.common.artist)) artist = cleanString(metadata.common.artist);
      if (cleanString(metadata.common.album)) album = cleanString(metadata.common.album);
      if (metadata.common.genre && metadata.common.genre.length > 0) {
        genre = cleanString(metadata.common.genre[0]) || genre;
      }
      if (metadata.common.year) year = metadata.common.year;
      if (metadata.common.track?.no) trackNumber = metadata.common.track.no;

      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        const picBlob = new Blob([new Uint8Array(pic.data)], { type: pic.format || 'image/jpeg' });
        pictureUrl = URL.createObjectURL(picBlob);
      }
    }

    if (metadata.format?.duration && metadata.format.duration > 0) {
      duration = Math.round(metadata.format.duration);
    }
  } catch (err) {
    console.warn(`Could not parse ID3 metadata for ${file.name}, using fallback:`, err);
  }

  // If duration still not resolved, measure with HTML Audio
  if (!duration || duration === 0) {
    try {
      duration = Math.round(await getAudioDuration(file));
    } catch {
      duration = 0;
    }
  }

  const id = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const track: Track = {
    id,
    title,
    artist,
    album,
    duration,
    genre,
    year,
    trackNumber,
    pictureUrl,
    fileBlob: file,
    dateAdded: Date.now(),
    playCount: 0,
    isLiked: false,
    source: 'local',
    sizeBytes: file.size,
    mimeType: file.type || 'audio/mpeg',
  };

  return { track, blob: file };
}
