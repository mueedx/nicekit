import { NextRequest, NextResponse } from 'next/server';
import { extractLoomId, fetchLoomMetadata } from '@/lib/loom/loom';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid Loom URL or video ID.' },
        { status: 400 }
      );
    }

    const id = extractLoomId(url);
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not recognize Loom video ID. Expected format: https://www.loom.com/share/[ID]',
        },
        { status: 400 }
      );
    }

    const metadata = await fetchLoomMetadata(id);

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    console.error('API /api/inspect error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred while inspecting the video.',
      },
      { status: 500 }
    );
  }
}
