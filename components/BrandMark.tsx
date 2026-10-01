import type { ReactNode } from "react";

export type Brand = "vercel" | "loom" | "claude" | "chatgpt" | "pdf" | "vlc" | "file";

/** Brand marks for tool cards — inline SVG so they stay crisp in light/dark. */
export function BrandMark({
  brand,
  size = 28,
  className = "",
}: {
  brand: Brand;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
    className: `shrink-0 ${className}`.trim(),
  };

  if (brand === "vercel") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12 2.5 23 21.5H1z" />
      </svg>
    );
  }

  if (brand === "loom") {
    // Eight rounded petals around a center point
    return (
      <svg {...common} fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect
            key={deg}
            x="10.6"
            y="1.6"
            width="2.8"
            height="9.4"
            rx="1.4"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="4.1" fill="var(--background)" />
      </svg>
    );
  }

  if (brand === "claude") {
    // Starburst / asterisk glyph
    return (
      <svg {...common} fill="none" stroke="#D97757" strokeWidth="2.2" strokeLinecap="round">
        {[0, 30, 60, 90, 120, 150].map((deg) => (
          <line
            key={deg}
            x1="12"
            y1="3.2"
            x2="12"
            y2="20.8"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
      </svg>
    );
  }

  if (brand === "chatgpt") {
    // OpenAI blossom. Monochrome so it reads in both themes.
    return (
      <svg {...common} fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.142-.08 4.778-2.759a.795.795 0 0 0 .393-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.495 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.354-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zM8.307 12.863l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    );
  }

  if (brand === "pdf") {
    // Red sheet with the letters every PDF viewer shows in its icon.
    return (
      <svg {...common}>
        <path
          d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5z"
          fill="#E2574C"
        />
        <path d="M14 2.5v5.1h4.9z" fill="#C0433A" />
        <text
          x="12"
          y="17.1"
          textAnchor="middle"
          fontSize="6"
          fontWeight="700"
          fill="#ffffff"
        >
          PDF
        </text>
      </svg>
    );
  }

  if (brand === "vlc") {
    // Traffic cone: the VLC mark, band and base included.
    return (
      <svg {...common}>
        <path d="M12 2.4 17.6 18H6.4z" fill="#FF8800" />
        <path d="M8.9 11.4h6.2l1 2.9H7.9z" fill="#ffffff" />
        <rect
          x="5.6"
          y="18.3"
          width="12.8"
          height="3.2"
          rx="0.7"
          fill="#E0791A"
        />
      </svg>
    );
  }

  return (
    <svg
      {...common}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5z" />
      <path d="M14 2.5V8h5" />
    </svg>
  );
}

/** Small wrapper that adds the offset tile treatment used in tool cards. */
export function BrandTile({
  brand,
  children,
}: {
  brand: Brand;
  children?: ReactNode;
}) {
  const tone =
    brand === "claude"
      ? "text-foreground"
      : brand === "loom"
        ? "text-accent"
        : brand === "vercel"
          ? "text-foreground"
          : brand === "chatgpt"
            ? "text-foreground"
            : brand === "pdf"
              ? "text-[#e2574c]"
              : brand === "vlc"
                ? "text-[#ff8800]"
                : "text-muted";

  return (
    <span
      className={`inline-flex size-11 items-center justify-center rounded-[2px] border border-border bg-background ui-transition group-hover:border-accent ${tone}`}
    >
      {children ?? <BrandMark brand={brand} />}
    </span>
  );
}