import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

/**
 * Proxy stream endpoint to bypass CORS/Content-Disposition restrictions
 * Streams chunks directly using Web Streams API to satisfy Vercel serverless memory limits.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'loom-video.mp4';

  if (!targetUrl) {
    return new Response('Missing "url" parameter', { status: 400 });
  }

  // Security: only allow proxying from Loom CDN domains
  try {
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith('loom.com') && !parsed.hostname.endsWith('cloudfront.net')) {
      return new Response('Invalid media source host', { status: 403 });
    }
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  try {
    const rangeHeader = req.headers.get('range');
    const upstreamHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.loom.com/',
    };

    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader;
    }

    const upstreamResponse = await fetch(targetUrl, {
      headers: upstreamHeaders,
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      return new Response(`Upstream CDN responded with HTTP ${upstreamResponse.status}`, {
        status: upstreamResponse.status,
      });
    }

    const responseHeaders = new Headers();
    const contentType = upstreamResponse.headers.get('content-type') || 'video/mp4';
    const contentLength = upstreamResponse.headers.get('content-length');
    const contentRange = upstreamResponse.headers.get('content-range');

    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    if (contentLength) responseHeaders.set('Content-Length', contentLength);
    if (contentRange) responseHeaders.set('Content-Range', contentRange);
    if (upstreamResponse.headers.get('accept-ranges')) {
      responseHeaders.set('Accept-Ranges', 'bytes');
    }

    // Stream directly via ReadableStream body
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Stream proxy error:', err);
    return new Response(`Stream failed: ${err.message}`, { status: 500 });
  }
}
