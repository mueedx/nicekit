import { NextRequest, NextResponse } from "next/server";
import { chatLinkErrorCode } from "@/lib/chat-errors";
import { getChatAdapter, isChatProviderId, safeChatFileName } from "@/lib/chat-registry";
import { docChatToMarkdown, docChatToText } from "@/lib/chat-export";
import { chatToDocx, chatToPdf } from "@/lib/exporters";

export const runtime = "nodejs";

type Params = { params: Promise<{ provider: string }> };

const FORMATS = ["md", "txt", "docx", "pdf"];

export async function GET(req: NextRequest, { params }: Params) {
  const { provider } = await params;
  if (!isChatProviderId(provider)) {
    return NextResponse.json(
      { success: false, code: "invalid_url", error: `Unknown chat provider: ${provider}` },
      { status: 404 },
    );
  }

  const adapter = getChatAdapter(provider);

  try {
    const url = req.nextUrl.searchParams.get("url") || "";
    const format = (req.nextUrl.searchParams.get("format") || "md").toLowerCase();

    const shareId = adapter.extractShareId(url);
    if (!shareId) {
      return NextResponse.json(
        { success: false, code: "invalid_url", error: "Expected a valid public share URL." },
        { status: 400 },
      );
    }

    if (!FORMATS.includes(format)) {
      return NextResponse.json(
        { success: false, code: "invalid_url", error: "Unsupported format. Use md, txt, docx or pdf." },
        { status: 400 },
      );
    }

    const doc = await adapter.fetchDocChat(shareId);
    const base = safeChatFileName(doc.name, `${provider}-chat`);

    if (format === "md") {
      return new NextResponse(docChatToMarkdown(doc), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${base}.md"`,
        },
      });
    }

    if (format === "txt") {
      return new NextResponse(docChatToText(doc), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${base}.txt"`,
        },
      });
    }

    const bytes = format === "docx" ? chatToDocx(doc) : chatToPdf(doc);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type":
          format === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/pdf",
        "Content-Disposition": `attachment; filename="${base}.${format}"`,
      },
    });
  } catch (error) {
    console.error(`API /api/chat/${provider}/export error:`, error);
    const code = chatLinkErrorCode(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "An unexpected error occurred while exporting this chat.";

    return NextResponse.json({ success: false, code, error: message }, { status: 502 });
  }
}
