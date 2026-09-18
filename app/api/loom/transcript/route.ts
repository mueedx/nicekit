import { NextRequest } from 'next/server';
import { formatTranscript } from '@/lib/loom/loom';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transcriptUrl = searchParams.get('url');
  const format = (searchParams.get('format') || 'srt') as 'txt' | 'srt' | 'vtt' | 'json';
  const title = searchParams.get('title') || 'loom-transcript';

  if (!transcriptUrl) {
    return new Response('Missing "url" parameter', { status: 400 });
  }

  try {
    const res = await fetch(transcriptUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.loom.com/',
      },
    });

    if (!res.ok) {
      return new Response('Failed to fetch transcript from upstream', { status: res.status });
    }

    const rawJson = await res.json();
    const formattedContent = formatTranscript(rawJson, format);

    const mimeTypes: Record<string, string> = {
      txt: 'text/plain; charset=utf-8',
      srt: 'text/plain; charset=utf-8',
      vtt: 'text/vtt; charset=utf-8',
      json: 'application/json; charset=utf-8',
    };

    const sanitizedTitle = title.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `${sanitizedTitle}.${format}`;

    return new Response(formattedContent, {
      headers: {
        'Content-Type': mimeTypes[format] || 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    console.error('Transcript route error:', err);
    return new Response(`Transcript error: ${err.message}`, { status: 500 });
  }
}
