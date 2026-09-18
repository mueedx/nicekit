import { SITE_URL } from "@/lib/site";

export function SiteFooter() {
  const host = SITE_URL.replace(/^https?:\/\//, "");

  return (
    <footer className="relative z-10 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 font-mono text-[12px] tracking-[0.12em] text-muted lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>
          developed by{" "}
          <a
            className="link-muted hover:text-accent"
            href="https://mueedx.vercel.app/"
          >
            mueedx.vercel.app
          </a>
        </p>
        <p className="text-[11px] normal-case tracking-normal">
          No user trace and no identifying info is saved.
        </p>
        <p>
          <span className="select-none" aria-hidden="true">
            $
          </span>{" "}
          <span className="select-all">curl {host}</span>
          {" · "}
          <a className="link-muted hover:text-accent" href="/tools">
            tools
          </a>
          {" · "}
          <a className="link-muted hover:text-accent" href="/about">
            about
          </a>
        </p>
      </div>
    </footer>
  );
}
