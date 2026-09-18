import { NextRequest, NextResponse } from 'next/server';
import {
  extractClaudeShareId,
  fetchClaudeChat,
  chatToMarkdown,
  chatToText,
  safeChatFileName,
  ClaudeLinkError,
} from '@/lib/claude';
import { chatToDocx, chatToPdf } from '@/lib/exporters';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url') || '';
    const format = (req.nextUrl.searchParams.get('format') || 'md').toLowerCase();
    const id = extractClaudeShareId(url);

    if (!id) {
      return NextResponse.json(
        { success: false, code: 'invalid_url', error: 'Expected a Claude share URL: https://claude.ai/share/[UUID]' },
        { status: 400 }
      );
    }

    if (!['md', 'txt', 'docx', 'pdf'].includes(format)) {
      return NextResponse.json(
        { success: false, code: 'invalid_url', error: 'Unsupported format. Use md, txt, docx or pdf.' },
        { status: 400 }
      );
    }

    const chat = await fetchClaudeChat(id);
    const base = safeChatFileName(chat.name);

    if (format === 'md') {
      return new NextResponse(chatToMarkdown(chat), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${base}.md"`,
        },
      });
    }

    if (format === 'txt') {
      return new NextResponse(chatToText(chat), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${base}.txt"`,
        },
      });
    }

    const bytes = format === 'docx' ? chatToDocx(chat) : chatToPdf(chat);
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
    console.error('API /api/claude/export error:', error);
    const code = error instanceof ClaudeLinkError ? error.code : 'error';
    return NextResponse.json(
      {
        success: false,
        code,
        error: error.message || 'An unexpected error occurred while exporting the Claude chat.',
      },
      { status: 502 }
    );
  }
}
