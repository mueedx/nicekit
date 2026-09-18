"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-blur sticky top-0 z-50 h-14 border-b border-border">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-6 px-5 lg:gap-8 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 ui-transition hover:text-accent"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={18}
            height={18}
            aria-hidden
            className="size-[18px] opacity-90"
          />
          <span className="label-mono text-foreground">Nicekit</span>
        </Link>
        <div className="flex flex-1 items-center gap-6">
          {links.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : href === "/about"
                  ? pathname === "/about"
                  : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`label-mono ui-transition hover:text-accent ${
                  active
                    ? "border-b border-accent pb-0.5 text-accent"
                    : "text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
