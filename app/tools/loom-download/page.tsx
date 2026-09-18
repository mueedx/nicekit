import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionKicker } from "@/components/SectionKicker";
import { LoomDownloader } from "@/components/tools/LoomDownloader";

export const metadata: Metadata = {
  title: "Loom Downloader · Tools · Nicekit",
  description:
    "Download a Loom video (HD MP4), transcripts (SRT/TXT) and preview assets from any share link.",
  alternates: { canonical: "/tools/loom-download" },
};

export default function LoomDownloadPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <ScrollReveal>
        <header className="mb-8">
          <SectionKicker number="01" title="Tool · Loom downloader" />
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-[2px] border border-border bg-surface text-accent">
              <BrandMark brand="loom" size={26} />
            </span>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              Paste a Loom link. Download{" "}
              <span className="text-accent">the video</span>.
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Instant MP4 in high definition, transcripts (SRT &amp; TXT), and
            preview assets from any public Loom share link. Nothing is stored.
          </p>
        </header>
      </ScrollReveal>
      <LoomDownloader />
    </div>
  );
}
