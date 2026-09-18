// lib/loom.ts - Loom Video, Audio & Transcript Extraction Engine
// Designed for Next.js App Router (Node & Edge runtimes)
// Ponytail principle: Use native fetch and stdlib string/regex parsing. No heavy dependencies.

export interface LoomDownloadOption {
  quality: string;
  format: string;
  url: string;
  isDirect: boolean;
  label: string;
}

export interface LoomMetadata {
  id: string;
  shareUrl: string;
  title: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  thumbnailGifUrl: string;
  seekPreviewUrl?: string;
  seekPreviewVttUrl?: string;
  downloadOptions: LoomDownloadOption[];
  hlsUrl?: string;
  hasTranscript: boolean;
  transcriptUrl?: string;
  captionsUrl?: string;
}

/**
 * Extracts a clean Loom video ID from arbitrary share/embed URLs or raw IDs.
 */
export function extractLoomId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Match standard URLs: https://www.loom.com/share/[ID] or /embed/[ID]
  const urlMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]{12,64})/i);
  if (urlMatch) return urlMatch[1];

  // Match raw ID strings
  const idMatch = trimmed.match(/^[a-zA-Z0-9_-]{20,64}$/);
  if (idMatch) return idMatch[0];

  return null;
}

/**
 * Parses Loom Apollo state and HTML to extract metadata and media URLs.
 */
export async function fetchLoomMetadata(id: string): Promise<LoomMetadata> {
  const shareUrl = `https://www.loom.com/share/${id}`;
  
  const response = await fetch(shareUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    next: { revalidate: 300 }, // Cache on Vercel Edge for 5 minutes
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Loom video not found. Please check the URL or privacy settings.');
    }
    throw new Error(`Failed to fetch Loom video page: HTTP ${response.status}`);
  }

  const html = await response.text();

  // 1. Extract Apollo State JSON
  let apolloData: Record<string, any> | null = null;
  const apolloMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]+?\});?\s*<\/script>/);
  if (apolloMatch) {
    try {
      apolloData = JSON.parse(apolloMatch[1]);
    } catch {
      apolloData = null;
    }
  }

  // 2. Derive video title
  let title = 'Loom Video';
  let duration = 0;
  let hlsUrl: string | undefined;
  let transcriptUrl: string | undefined;
  let captionsUrl: string | undefined;
  let thumbJpg: string | undefined;
  let thumbGif: string | undefined;
  const directMp4Urls = new Set<string>();

  if (apolloData) {
    for (const key of Object.keys(apolloData)) {
      const item = apolloData[key] as Record<string, any> | undefined;
      if (!item || typeof item !== 'object') continue;

      // Title & duration
      if (item.name && typeof item.name === 'string' && item.__typename?.includes('Video')) {
        title = item.name.trim();
      }
      const propsDuration = item.playable_duration ?? item.source_duration ?? item.video_properties?.duration;
      const rawDuration = typeof propsDuration === 'number' ? propsDuration : item.duration;
      if (typeof rawDuration === 'number' && rawDuration > 0) {
        duration = Math.round(rawDuration);
      }

      // Thumbnails (real hashed CDN URLs from Apollo)
      if (item.thumbnails?.default) {
        if (String(item.thumbnails.default).endsWith('.gif')) thumbGif = item.thumbnails.default;
        else thumbJpg = item.thumbnails.default;
      } else if (item.defaultThumbnails?.default) {
        if (String(item.defaultThumbnails.default).endsWith('.gif')) thumbGif = item.defaultThumbnails.default;
        else thumbJpg = item.defaultThumbnails.default;
      }

      // HLS Stream (signed URL under nullableRawCdnUrl M3U8 key)
      const m3u8Key = Object.keys(item).find(k => k.includes('M3U8') && item[k]?.url);
      if (m3u8Key && item[m3u8Key]?.url) {
        hlsUrl = item[m3u8Key].url;
      }

      // Transcript (relative paths need CDN prefix)
      if (item.__typename === 'VideoTranscriptDetails') {
        const toAbsolute = (u: string) =>
          u && u.startsWith('http') ? u : `https://cdn.loom.com/${u.replace(/^\//, '')}`;
        if (item.transcript_url) transcriptUrl = toAbsolute(item.transcript_url);
        if (item.captions_url) captionsUrl = toAbsolute(item.captions_url);
      }
    }
  }

  // Fallback title from HTML title tag
  if (title === 'Loom Video') {
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleTagMatch && titleTagMatch[1]) {
      const clean = titleTagMatch[1].replace(/\s*\|\s*Loom$/i, '').trim();
      if (clean && clean !== 'Loom') title = clean;
    }
  }

  // 3. Extract direct MP4 URLs via regex scanning on page content
  const mp4Regex = /https:\/\/cdn\.loom\.com\/sessions\/(?:transcoded|raw)\/[^"'\s\\]+\.mp4/g;
  let match: RegExpExecArray | null;
  while ((match = mp4Regex.exec(html)) !== null) {
    directMp4Urls.add(match[0].replace(/\\u0026/g, '&'));
  }

  // Build Download Options array
  const downloadOptions: LoomDownloadOption[] = [];

  if (directMp4Urls.size > 0) {
    // Categorize resolutions from URL names (e.g. 1080p, 720p, 480p, 360p)
    const sortedUrls = Array.from(directMp4Urls).sort((a, b) => {
      const getRes = (u: string) => {
        const m = u.match(/(\d{3,4})p/);
        return m ? parseInt(m[1], 10) : 0;
      };
      return getRes(b) - getRes(a);
    });

    for (const url of sortedUrls) {
      const resMatch = url.match(/(\d{3,4})p/);
      const quality = resMatch ? `${resMatch[1]}p` : 'HD';
      downloadOptions.push({
        quality,
        format: 'MP4',
        url,
        isDirect: true,
        label: `Video (${quality} MP4)`,
      });
    }
  }

  // If no direct MP4 was found in HTML, request a signed URL from Loom's public API.
  // # ponytail: single "original/HD" quality only — Loom no longer exposes per-resolution MP4s
  // publicly; upgrade path: parse HLS master playlist variants for multiple qualities.
  if (downloadOptions.length === 0) {
    try {
      const signedRes = await fetch(
        `https://www.loom.com/api/campaigns/sessions/${id}/transcoded-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({}),
        }
      );
      if (signedRes.ok) {
        const signedJson: any = await signedRes.json();
        if (signedJson?.url) {
          downloadOptions.push({
            quality: 'HD',
            format: 'MP4',
            url: signedJson.url,
            isDirect: true,
            label: 'Video (Original HD MP4)',
          });
        }
      }
    } catch {
      // Signed URL request failed; fall through to HLS-only options
    }
  }

  // HLS fallback if still no MP4
  if (downloadOptions.length === 0 && hlsUrl) {
    downloadOptions.push({
      quality: 'HLS',
      format: 'M3U8',
      url: hlsUrl,
      isDirect: false,
      label: 'Video (HLS Stream)',
    });
  }

  // Real hashed thumbnail URLs from Apollo; fall back to HTML scan, then legacy pattern
  const thumbnailUrl = thumbJpg
    || html.match(/https:\/\/cdn\.loom\.com\/sessions\/thumbnails\/[a-zA-Z0-9_-]+\.jpg/)?.[0]
    || `https://cdn.loom.com/sessions/thumbnails/${id}-00001.jpg`;
  const thumbnailGifUrl = thumbGif
    || html.match(/https:\/\/cdn\.loom\.com\/sessions\/thumbnails\/[a-zA-Z0-9_-]+\.gif/)?.[0]
    || `https://cdn.loom.com/sessions/thumbnails/${id}-00001.gif`;

  // Seek preview assets
  const seekJpgMatch = html.match(/https:\/\/[^"'\s]*mediametadata\/seekpreview\/[^"'\s]*\.jpg[^"'\s]*/);
  const seekVttMatch = html.match(/https:\/\/[^"'\s]*mediametadata\/seekpreview\/[^"'\s]*\.vtt[^"'\s]*/);

  return {
    id,
    shareUrl,
    title,
    duration,
    thumbnailUrl,
    thumbnailGifUrl,
    seekPreviewUrl: seekJpgMatch ? seekJpgMatch[0].replace(/\\u0026/g, '&') : undefined,
    seekPreviewVttUrl: seekVttMatch ? seekVttMatch[0].replace(/\\u0026/g, '&') : undefined,
    downloadOptions,
    hlsUrl,
    hasTranscript: Boolean(transcriptUrl),
    transcriptUrl,
    captionsUrl,
  };
}

/**
 * Formats raw Loom transcript JSON into plain text, SubRip (.srt), or WebVTT (.vtt).
 */
export function formatTranscript(
  rawJson: any,
  format: 'txt' | 'srt' | 'vtt' | 'json'
): string {
  if (format === 'json') {
    return JSON.stringify(rawJson, null, 2);
  }

  const sentences: Array<{ text?: string; value?: string; start_time?: number; end_time?: number }> =
    rawJson?.sentences || [];

  if (format === 'txt') {
    if (sentences.length > 0) {
      return sentences
        .map((s) => (s.text || s.value || '').trim())
        .filter(Boolean)
        .join('\n\n');
    }
    // Fallback to words
    const words = rawJson?.words || [];
    return words.map((w: any) => w.text || w.value || '').join(' ');
  }

  // Subtitle timestamp formatter
  const formatTime = (seconds: number = 0, isVtt: boolean = false): string => {
    const totalMs = Math.round(seconds * 1000);
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;

    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const separator = isVtt ? '.' : ',';
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}${separator}${pad(ms, 3)}`;
  };

  const isVtt = format === 'vtt';
  let out = isVtt ? 'WEBVTT\n\n' : '';

  sentences.forEach((item, index) => {
    const text = (item.text || item.value || '').trim();
    if (!text) return;

    const start = item.start_time ?? index * 3;
    const end = item.end_time ?? (start + 2.8);

    if (!isVtt) {
      out += `${index + 1}\n`;
    }
    out += `${formatTime(start, isVtt)} --> ${formatTime(end, isVtt)}\n`;
    out += `${text}\n\n`;
  });

  return out;
}
