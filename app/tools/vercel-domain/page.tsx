import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionKicker } from "@/components/SectionKicker";
import { DomainChecker } from "@/components/tools/DomainChecker";

export const metadata: Metadata = {
  title: "Vercel Domain Checker · Tools · Nicekit",
  description:
    "Check whether a *.vercel.app subdomain is available for your next deployment.",
  alternates: { canonical: "/tools/vercel-domain" },
};

export default function VercelDomainPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <ScrollReveal>
        <header className="mb-8">
          <SectionKicker number="03" title="Tool · Vercel domain checker" />
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-[2px] border border-border bg-surface text-foreground">
              <BrandMark brand="vercel" size={26} />
            </span>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              Is that <span className="font-mono">*.vercel.app</span> name free?
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted">
            A live availability check based on how Vercel responds for the
            subdomain. Nothing is stored.
          </p>
        </header>
      </ScrollReveal>
      <DomainChecker />
    </div>
  );
}
