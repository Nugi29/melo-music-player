import { Track } from '@/types/music';

// Helper to sanitize text and avoid malicious/broken scripts
function cleanString(str?: string): string {
  if (!str) return '';
  return str.trim();
}

// Extract artist and title from filename like "Daft Punk - Around the World.mp3"
export function parseFilenameFallback(filename: string): { title: string; artist: string } {
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

export function isAudioFile(file: { name: string; type?: string }): boolean {
  if (file.type && file.type.startsWith('audio/')) return true;
  return /\.(mp3|wav|ogg|flac|m4a|aac|wma|opus|aiff|alac|weba)$/i.test(file.name);
}

export function isVideoFile(file: { name: string; type?: string }): boolean {
  if (file.type && file.type.startsWith('video/')) return true;
  return /\.(mp4|webm|mkv|mov|avi|ogv|m4v|3gp|wmv)$/i.test(file.name);
}

export function isMediaFile(file: { name: string; type?: string }): boolean {
  return isAudioFile(file) || isVideoFile(file);
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
    isVideo: false,
  };

  return { track, blob: file };
}

export async function parseVideoFile(file: File): Promise<{ track: Track; blob: Blob }> {
  const fallback = parseFilenameFallback(file.name);
  const title = fallback.title;
  const artist = fallback.artist === 'Unknown Artist' ? 'Video File' : fallback.artist;
  let duration = 0;
  let videoWidth = 1280;
  let videoHeight = 720;
  let pictureUrl: string | undefined;

  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise<void>((resolve) => {
      let resolved = false;
      const onDone = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      video.onloadedmetadata = () => {
        if (video.duration && isFinite(video.duration)) {
          duration = Math.round(video.duration);
        }
        if (video.videoWidth) videoWidth = video.videoWidth;
        if (video.videoHeight) videoHeight = video.videoHeight;

        // Seek slightly into the video to capture a meaningful frame thumbnail
        const seekTime = Math.min(1.0, (video.duration || 1) * 0.1);
        try {
          video.currentTime = seekTime;
        } catch {
          onDone();
        }
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const thumbWidth = 320;
          const thumbHeight = Math.round(thumbWidth * (videoHeight / videoWidth)) || 180;
          canvas.width = thumbWidth;
          canvas.height = thumbHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight);
            pictureUrl = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch (e) {
          console.warn('Could not extract video thumbnail:', e);
        }
        onDone();
      };

      video.onerror = () => onDone();
      // Safety timeout after 4s
      setTimeout(onDone, 4000);
    });
  } catch (err) {
    console.warn(`Could not parse video ${file.name}:`, err);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const id = `track_vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const track: Track = {
    id,
    title,
    artist,
    album: 'Video Library',
    duration,
    genre: 'Video',
    pictureUrl,
    fileBlob: file,
    dateAdded: Date.now(),
    playCount: 0,
    isLiked: false,
    source: 'local',
    sizeBytes: file.size,
    mimeType: file.type || 'video/mp4',
    isVideo: true,
    videoWidth,
    videoHeight,
  };

  return { track, blob: file };
}

export async function parseMediaFile(file: File): Promise<{ track: Track; blob: Blob }> {
  if (isVideoFile(file)) {
    return parseVideoFile(file);
  }
  return parseAudioFile(file);
}
