import { NextRequest, NextResponse } from 'next/server';
import {
  extractChatGptShareId,
  fetchChatGptChat,
  chatGptToMarkdown,
  chatGptToText,
  chatGptToDocChat,
  safeChatFileName,
  ChatGptLinkError,
} from '@/lib/chatgpt';
import { chatToDocx, chatToPdf } from '@/lib/exporters';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url') || '';
    const format = (req.nextUrl.searchParams.get('format') || 'md').toLowerCase();
    const id = extractChatGptShareId(url);

    if (!id) {
      return NextResponse.json(
        { success: false, code: 'invalid_url', error: 'Expected a ChatGPT share URL: https://chatgpt.com/share/[UUID]' },
        { status: 400 }
      );
    }

    if (!['md', 'txt', 'docx', 'pdf'].includes(format)) {
      return NextResponse.json(
        { success: false, code: 'invalid_url', error: 'Unsupported format. Use md, txt, docx or pdf.' },
        { status: 400 }
      );
    }

    const chat = await fetchChatGptChat(id);
    const base = safeChatFileName(chat.name);

    if (format === 'md') {
      return new NextResponse(chatGptToMarkdown(chat), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${base}.md"`,
        },
      });
    }

    if (format === 'txt') {
      return new NextResponse(chatGptToText(chat), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${base}.txt"`,
        },
      });
    }

    const docChat = chatGptToDocChat(chat);
    const bytes = format === 'docx' ? chatToDocx(docChat) : chatToPdf(docChat);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type':
          format === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf',
        'Content-Disposition': `attachment; filename="${base}.${format}"`,
      },
    });
  } catch (error: any) {
    console.error('API /api/chatgpt/export error:', error);
    const code = error instanceof ChatGptLinkError ? error.code : 'error';
    return NextResponse.json(
      {
        success: false,
        code,
        error: error.message || 'An unexpected error occurred while exporting the ChatGPT chat.',
      },
      { status: 502 }
    );
  }
}
