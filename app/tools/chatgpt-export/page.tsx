import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionKicker } from "@/components/SectionKicker";
import { ChatGptExporter } from "@/components/tools/ChatGptExporter";

export const metadata: Metadata = {
  title: "ChatGPT Chat Export · Tools · Nicekit",
  description:
    "Read a public chatgpt.com/share conversation and export it as Markdown, TXT, DOCX or PDF.",
  alternates: { canonical: "/tools/chatgpt-export" },
};

export default function ChatGptExportPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <ScrollReveal>
        <header className="mb-8">
          <SectionKicker number="03" title="Tool · ChatGPT chat export" />
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-[2px] border border-border bg-surface text-foreground">
              <BrandMark brand="chatgpt" size={24} />
            </span>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              Paste a ChatGPT link. Export{" "}
              <span className="text-accent">the chat</span>.
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Reads a public chatgpt.com/share conversation and exports it as
            Markdown, plain text, Word or PDF — with speaker labels and code
            preserved. Nothing is stored.
          </p>
        </header>
      </ScrollReveal>
      <ChatGptExporter />
    </div>
  );
}
