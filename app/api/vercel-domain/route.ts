import { NextRequest, NextResponse } from 'next/server';
import { normalizeVercelAppName, VERCEL_APP_NAME_RE } from '@/lib/vercel-domain';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get('name') || '';
    const name = normalizeVercelAppName(raw);

    if (!name) {
      return NextResponse.json(
        { success: false, code: 'invalid_url', error: 'Enter an app name to check.' },
        { status: 400 }
      );
    }

    if (!VERCEL_APP_NAME_RE.test(name)) {
      return NextResponse.json(
        {
          success: false,
          code: 'invalid_url',
          error:
            'Invalid name. Use lowercase letters, digits and hyphens only — it cannot start or end with a hyphen (max 63 chars).',
        },
        { status: 400 }
      );
    }

    const checkedUrl = `https://${name}.vercel.app`;
    const res = await fetch(checkedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,*/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
      next: { revalidate: 60 },
    });

    // Any successful or non-404 response means the subdomain resolves to a live
    // deployment → the name is taken. Vercel's DEPLOYMENT_NOT_FOUND (404) means free.
    let available: boolean;
    if (res.status === 404) {
      available = true;
    } else if (res.status < 500) {
      available = false;
    } else {
      // 5xx: ambiguous — an existing deployment erroring out. Assume taken.
      available = false;
    }

    return NextResponse.json({
      success: true,
      data: { name, checkedUrl, available, status: res.status },
    });
  } catch (error: any) {
    console.error('API /api/vercel-domain error:', error);
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return NextResponse.json(
      {
        success: false,
        code: 'error',
        error: timedOut
          ? 'The check timed out — the domain took too long to respond. Try again.'
          : 'Could not reach the domain to verify. Please try again.',
      },
      { status: 502 }
    );
  }
}
