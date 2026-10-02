import type { Metadata } from "next";
import { BrandMark, type Brand } from "@/components/BrandMark";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionKicker } from "@/components/SectionKicker";
import { ChatExporter } from "@/components/tools/ChatExporter";
import { CHAT_PROVIDERS, supportedChatsLabel } from "@/lib/chat-providers";

export const metadata: Metadata = {
  title: "AI Chat Export · Tools · Nicekit",
  description:
    "Read a public Claude, ChatGPT, DeepSeek, Qwen or Grok share link and export it as Markdown, TXT, DOCX or PDF.",
  alternates: { canonical: "/tools/chat-export" },
};

function brandFor(id: string): Brand {
  return id as Brand;
}

const SUPPORTS = supportedChatsLabel();

export default function ChatExportPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <ScrollReveal>
        <header className="mb-8">
          <SectionKicker number="01" title="Tool · AI chat export" />
          <div className="mt-3 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              {CHAT_PROVIDERS.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex size-9 items-center justify-center rounded-[2px] border border-border bg-surface"
                  title={p.label}
                >
                  <BrandMark brand={brandFor(p.id)} size={20} />
                </span>
              ))}
            </span>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              Paste a share link. Export{" "}
              <span className="text-accent">the chat</span>.
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Reads a public share conversation and exports it as Markdown, plain
            text, Word or PDF — with speaker labels and code preserved. Nothing
            is stored.
          </p>

          <div className="mt-5">
            <p className="label-mono text-muted">Supported chats</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {CHAT_PROVIDERS.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="inline-flex size-7 items-center justify-center rounded-[2px] border border-border">
                    <BrandMark brand={brandFor(p.id)} size={16} />
                  </span>
                  <span>{p.label}</span>
                  <span className="label-mono-sm text-muted">{p.placeholder}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">
              One field, one exporter — paste any {SUPPORTS} link and this tool
              detects which chat it came from.
            </p>
          </div>
        </header>
      </ScrollReveal>
      <ChatExporter />
    </div>
  );
}
