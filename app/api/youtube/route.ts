import { NextRequest, NextResponse } from 'next/server';

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // URL match
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

const INVIDIOUS_INSTANCES = [
  'https://invidious.f5.si',
  'https://invidious.tiekoetter.com',
  'https://yt.chocolatemoo53.com',
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('url') || searchParams.get('id');

  if (!input) {
    return NextResponse.json({ error: 'Missing YouTube URL or video ID parameter' }, { status: 400 });
  }

  const videoId = extractVideoId(input);
  if (!videoId) {
    return NextResponse.json({ error: `Could not parse YouTube video ID from: "${input}"` }, { status: 400 });
  }

  let title = 'YouTube Video';
  let artist = 'YouTube Stream';
  let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  let duration = 0;
  let rawStreamUrl: string | null = null;

  // 1. Fetch metadata via YouTube oEmbed (fast and 100% reliable)
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      if (oembedData.title) title = oembedData.title;
      if (oembedData.author_name) artist = oembedData.author_name;
      if (oembedData.thumbnail_url) thumbnailUrl = oembedData.thumbnail_url;
    }
  } catch (err) {
    console.warn('YouTube oEmbed warning:', err);
  }

  // 2. Query Invidious instances in parallel with a fast 2.5s race timeout
  const fetchStreamFromInstance = async (instance: string): Promise<string | null> => {
    try {
      const apiUrl = `${instance}/api/v1/videos/${videoId}`;
      const res = await fetch(apiUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(2500),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title && title === 'YouTube Video') title = data.title;
        if (data.author && artist === 'YouTube Stream') artist = data.author;
        if (data.lengthSeconds) duration = parseInt(data.lengthSeconds, 10) || 0;

        const streams = data.formatStreams || [];
        const chosen =
          streams.find((s: { resolution?: string; container?: string }) => s.container === 'mp4' && s.resolution === '720p') ||
          streams.find((s: { resolution?: string; container?: string }) => s.container === 'mp4' && s.resolution === '360p') ||
          streams.find((s: { container?: string }) => s.container === 'mp4') ||
          streams[0];

        return chosen?.url || null;
      }
    } catch {
      // ignore
    }
    return null;
  };

  try {
    const streamResults = await Promise.race([
      Promise.any(INVIDIOUS_INSTANCES.map((inst) => fetchStreamFromInstance(inst).then((url) => {
        if (!url) throw new Error('No stream');
        return url;
      }))),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    if (streamResults) {
      rawStreamUrl = streamResults;
    }
  } catch {
    // No direct format streams available from public instances
  }

  // Construct stream URL if direct format stream was found
  const streamUrl = rawStreamUrl
    ? `/api/youtube/stream?url=${encodeURIComponent(rawStreamUrl)}`
    : null;

  return NextResponse.json({
    success: true,
    videoId,
    title,
    artist,
    duration,
    thumbnailUrl,
    streamUrl,
    directUrl: rawStreamUrl,
    hasDirectStream: !!streamUrl,
  });
}
