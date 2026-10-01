import { NextRequest, NextResponse } from 'next/server';
import { extractChatGptShareId, fetchChatGptChat, ChatGptLinkError } from '@/lib/chatgpt';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, code: 'invalid_url', error: 'Please provide a valid ChatGPT share URL.' },
        { status: 400 }
      );
    }

    const id = extractChatGptShareId(url);
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          code: 'invalid_url',
          error: 'That does not look like a ChatGPT share link. Expected format: https://chatgpt.com/share/[UUID]',
        },
        { status: 400 }
      );
    }

    const chat = await fetchChatGptChat(id);
    const preview = chat.messages
      .slice(0, 2)
      .map((m) => `${m.role === 'user' ? 'You' : 'ChatGPT'}: ${m.text.slice(0, 400)}`)
      .join('\n\n');

    return NextResponse.json({
      success: true,
      data: {
        uuid: chat.id,
        shareUrl: `https://chatgpt.com/share/${chat.id}`,
        name: chat.name,
        messageCount: chat.messageCount,
        preview,
      },
    });
  } catch (error: any) {
    console.error('API /api/chatgpt error:', error);
    const code = error instanceof ChatGptLinkError ? error.code : 'error';
    return NextResponse.json(
      {
        success: false,
        code,
        error: error.message || 'An unexpected error occurred while reading the ChatGPT chat.',
      },
      { status: error instanceof ChatGptLinkError && error.code === 'invalid_url' ? 400 : 502 }
    );
  }
}
