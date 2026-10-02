import { NextRequest, NextResponse } from "next/server";
import { chatLinkErrorCode } from "@/lib/chat-errors";
import { buildChatPreview, getChatAdapter, isChatProviderId } from "@/lib/chat-registry";
import { CHAT_PROVIDERS } from "@/lib/chat-providers";

export const runtime = "nodejs";

type Params = { params: Promise<{ provider: string }> };

function unsupported(provider: string) {
  return NextResponse.json(
    { success: false, code: "invalid_url", error: `Unknown chat provider: ${provider}` },
    { status: 404 },
  );
}

export async function POST(req: NextRequest, { params }: Params) {
  const { provider } = await params;
  if (!isChatProviderId(provider)) return unsupported(provider);

  const adapter = getChatAdapter(provider);
  const meta = CHAT_PROVIDERS.find((p) => p.id === provider)!;
  const expected = `That does not look like a ${meta.label} share link. Expected format: ${meta.placeholder}`;

  try {
    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, code: "invalid_url", error: `Please provide a valid ${meta.label} share URL.` },
        { status: 400 },
      );
    }

    const shareId = adapter.extractShareId(url);
    if (!shareId) {
      return NextResponse.json(
        { success: false, code: "invalid_url", error: expected },
        { status: 400 },
      );
    }

    const doc = await adapter.fetchDocChat(shareId);

    return NextResponse.json({
      success: true,
      data: {
        provider,
        uuid: shareId,
        shareUrl: doc.sourceUrl,
        name: doc.name,
        messageCount: doc.messageCount,
        preview: buildChatPreview(doc, meta.assistantLabel),
      },
    });
  } catch (error) {
    console.error(`API /api/chat/${provider} error:`, error);
    const code = chatLinkErrorCode(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : `An unexpected error occurred while reading the ${meta.label} chat.`;

    return NextResponse.json(
      { success: false, code, error: message },
      { status: code === "invalid_url" ? 400 : 502 },
    );
  }
}
