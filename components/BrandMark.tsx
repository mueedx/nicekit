import type { ReactNode } from "react";

export type Brand = "vercel" | "loom" | "claude" | "pdf" | "vlc" | "file";

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