import { NextRequest, NextResponse } from 'next/server';
import { extractClaudeShareId, fetchClaudeChat, ClaudeLinkError } from '@/lib/claude';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, code: 'invalid_url', error: 'Please provide a valid Claude share URL.' },
        { status: 400 }
      );
    }

    const id = extractClaudeShareId(url);
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          code: 'invalid_url',
          error: 'That does not look like a Claude share link. Expected format: https://claude.ai/share/[UUID]',
        },
        { status: 400 }
      );
    }

    const chat = await fetchClaudeChat(id);
    const preview = chat.messages
      .slice(0, 2)
      .map((m) => `${m.role === 'human' ? 'You' : 'Claude'}: ${m.text.slice(0, 400)}`)
      .join('\n\n');

    return NextResponse.json({
      success: true,
      data: {
        uuid: chat.uuid,
        shareUrl: `https://claude.ai/share/${chat.uuid}`,
        name: chat.name,
        messageCount: chat.messageCount,
        preview,
      },
    });
  } catch (error: any) {
    console.error('API /api/claude error:', error);
    const code = error instanceof ClaudeLinkError ? error.code : 'error';
    return NextResponse.json(
      {
        success: false,
        code,
        error: error.message || 'An unexpected error occurred while reading the Claude chat.',
      },
      { status: error instanceof ClaudeLinkError && error.code === 'invalid_url' ? 400 : 502 }
    );
  }
}
