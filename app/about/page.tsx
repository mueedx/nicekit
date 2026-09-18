import type { Metadata } from "next";
import { Panel } from "@/components/Panel";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionKicker } from "@/components/SectionKicker";
import { ABOUT_INTRO, ABOUT_SECTIONS } from "@/lib/about-content";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Why I made this · ${SITE_NAME}`,
  description:
    "Why I built Nicekit: a public IP card, browser-only file tools, and the stack behind it.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `Why I made this · ${SITE_NAME}`,
    description:
      "Public IP diagnostics, client-side PDF tools, and what I learned shipping on Vercel Hobby.",
    url: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
      <ScrollReveal>
        <header className="mb-8">
          <SectionKicker number="—" title="About" />
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-foreground">
            {ABOUT_INTRO.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{ABOUT_INTRO.lead}</p>
        </header>
      </ScrollReveal>

      <div className="flex flex-col gap-8">
        {ABOUT_SECTIONS.map((section) => (
          <ScrollReveal key={section.kicker}>
            <Panel className="max-w-none">
              <div className="border-b border-border px-5 py-4">
                <SectionKicker number={section.kicker} title={section.title} />
              </div>
              <div className="px-5 py-5">
                <p className="text-sm leading-relaxed text-foreground">
                  {section.body}
                </p>
                {section.items && section.items.length > 0 ? (
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm text-muted"
                      >
                        <span
                          className="mt-1.5 size-1 shrink-0 rounded-full bg-accent"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Panel>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
