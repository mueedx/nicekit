import type { ReactNode } from "react";

export type Brand =
  | "vercel"
  | "loom"
  | "claude"
  | "chatgpt"
  | "deepseek"
  | "qwen"
  | "grok"
  | "whoami"
  | "pdf"
  | "vlc"
  | "file";

/**
 * Official logo geometry, lifted from the published brand SVGs so the tiles
 * show the real marks rather than approximations.
 * Sources: Wikimedia Commons "DeepSeek logo", "Qwen logo", "Grok-feb-2025 logo".
 */

/** DeepSeek whale (left half of the horizontal lockup, viewBox 195x41). */
const DEEPSEEK_WHALE =
  "M55.6128,3.4712c-.5953-.2917-.8517.2642-1.1998.5466-.1191.0911-.2198.2095-.3206.3188-.8701.9292-1.8867,1.5398-3.2148,1.4668-1.9417-.1094-3.5995.5012-5.065,1.9863-.3114-1.8313-1.3463-2.9248-2.9217-3.6262-.8242-.3645-1.6577-.729-2.2348-1.5217-.403-.5647-.5129-1.1934-.7144-1.813-.1283-.3735-.2565-.7563-.687-.8201-.4671-.0728-.6503.3188-.8335.647-.7327,1.3394-1.0166,2.8154-.9892,4.3096.0641,3.3621,1.4838,6.0406,4.3047,7.9449.3206.2187.403.4372.3023.7563-.1924.656-.4214,1.2937-.6228,1.9497-.1283.4192-.3207.5103-.7694.3279-1.5479-.6467-2.8852-1.6035-4.0667-2.7605-2.0058-1.9407-3.8193-4.0818-6.0815-5.7583-.5312-.3918-1.0625-.7561-1.6121-1.1025-2.3081-2.2412.3023-4.0818.9068-4.3003.6319-.2278.2198-1.0115-1.8227-1.0022-2.0425.009-3.9109.6924-6.2922,1.6035-.348.1367-.7145.2368-1.09.3188-2.1615-.4099-4.4055-.5012-6.7502-.2368-4.4147.4919-7.9408,2.5784-10.5328,6.1409C.1914,13.1289-.5413,17.9941.3563,23.0691c.9434,5.3481,3.6727,9.7761,7.8676,13.2385,4.3506,3.5896,9.3606,5.3481,15.0758,5.011,3.4713-.2004,7.3364-.665,11.6961-4.355,1.099.5467,2.2531.7652,4.1674.9292,1.4746.1367,2.8943-.0728,3.9933-.3005,1.7219-.3645,1.6029-1.959.9801-2.2505-5.0466-2.3506-3.9385-1.394-4.9459-2.1685,2.5645-3.0339,6.4297-6.1865,7.9409-16.4001.119-.8108.0183-1.3211,0-1.9771-.0092-.4008.0824-.5556.5404-.6013,1.2639-.1458,2.4912-.4919,3.6178-1.1115,3.2698-1.7857,4.5886-4.7195,4.9-8.2364.0459-.5376-.0091-1.0935-.577-1.3757ZM27.119,35.123c-4.8909-3.8447-7.263-5.1113-8.2431-5.0566-.9159.0547-.751,1.1025-.5496,1.7859.2107.6741.4855,1.1389.8701,1.731.2656.3918.4489.9748-.2655,1.4123-1.5754.9749-4.314-.3281-4.4423-.3918-3.1872-1.877-5.8525-4.3553-7.7302-7.7444-1.8135-3.262-2.8667-6.7605-3.0408-10.4961-.0458-.9019.2198-1.221,1.1174-1.3848,1.1815-.2187,2.3997-.2644,3.5812-.0913,4.9918.729,9.2415,2.9612,12.8043,6.4963,2.0333,2.0135,3.572,4.419,5.1566,6.7696,1.6852,2.4963,3.4987,4.8745,5.8068,6.8242.8151.6833,1.4654,1.2026,2.0882,1.5854-1.8775.2095-5.01.2552-7.1532-1.4397ZM29.4637,20.0442c0-.4009.3206-.7197.7237-.7197.0916,0,.174.018.2473.0453.1008.0366.1924.0913.2656.1731.1283.1277.2015.3098.2015.5012,0,.4009-.3205.7197-.7234.7197s-.7145-.3188-.7145-.7197ZM36.7452,23.7798c-.4671.1914-.9342.3552-1.383.3735-.6961.0364-1.4563-.2461-1.8684-.5923-.6411-.5376-1.0991-.8381-1.2914-1.7766-.0825-.4009-.0367-1.0205.0367-1.3757.1648-.7654-.0184-1.2573-.5587-1.7039-.4397-.3645-.9984-.4646-1.6121-.4646-.229,0-.4395-.1003-.5953-.1823-.2565-.1275-.467-.4464-.2656-.8382.0641-.1274.3756-.4373.4489-.4919.8335-.4739,1.7952-.3189,2.6836.0364.8244.3371,1.4472.9567,2.3447,1.8313.9159,1.0568,1.0807,1.3486,1.6028,2.1411.4123.6196.7878,1.2573,1.0442,1.9863.1557.4556-.0458.8291-.5862,1.0569Z";

/** Grok glyph (the `#mark` of the current grok.com wordmark). */
const GROK_MARK_1 =
  "M13.2371 21.0407L24.3186 12.8506C24.8619 12.4491 25.6384 12.6057 25.8973 13.2294C27.2597 16.5185 26.651 20.4712 23.9403 23.1851C21.2297 25.8989 17.4581 26.4941 14.0108 25.1386L10.2449 26.8843C15.6463 30.5806 22.2053 29.6665 26.304 25.5601C29.5551 22.3051 30.562 17.8683 29.6205 13.8673L29.629 13.8758C28.2637 7.99809 29.9647 5.64871 33.449 0.844576C33.5314 0.730667 33.6139 0.616757 33.6964 0.5L29.1113 5.09055V5.07631L13.2343 21.0436";

const GROK_MARK_2 =
  "M10.9503 23.0313C7.07343 19.3235 7.74185 13.5853 11.0498 10.2763C13.4959 7.82722 17.5036 6.82767 21.0021 8.2971L24.7595 6.55998C24.0826 6.07017 23.215 5.54334 22.2195 5.17313C17.7198 3.31926 12.3326 4.24192 8.67479 7.90126C5.15635 11.4239 4.0499 16.8403 5.94992 21.4622C7.36924 24.9165 5.04257 27.3598 2.69884 29.826C1.86829 30.7002 1.0349 31.5745 0.36364 32.5L10.9474 23.0341";

/** Qwen mark: gradient body, white cut lines, gradient core (200x200). */
const QWEN_BODY =
  "M174.82 108.75L155.38 75L165.64 57.75C166.46 56.31 166.46 54.53 165.64 53.09L155.38 35.84C154.86 34.91 153.87 34.33 152.78 34.33H114.88L106.14 19.03C105.62 18.1 104.63 17.52 103.54 17.52H83.3C82.21 17.52 81.22 18.1 80.7 19.03L61.26 52.77H41.02C39.93 52.77 38.94 53.35 38.42 54.28L28.16 71.53C27.34 72.97 27.34 74.75 28.16 76.19L45.52 107.5L36.78 122.8C35.96 124.24 35.96 126.02 36.78 127.46L47.04 144.71C47.56 145.64 48.55 146.22 49.64 146.22H87.54L96.28 161.52C96.8 162.45 97.79 163.03 98.88 163.03H119.12C120.21 163.03 121.2 162.45 121.72 161.52L141.16 127.78H158.52C159.61 127.78 160.6 127.2 161.12 126.27L171.38 109.02C172.2 107.58 172.2 105.8 171.38 104.36L174.82 108.75Z";

const QWEN_LINES =
  "M119.12 163.03H98.88L87.54 144.71H49.64L61.26 126.39H80.7L38.42 55.29H61.26L83.3 19.03L93.56 37.35L83.3 55.29H161.58L151.32 72.54L170.76 106.28H151.32L141.16 88.34L101.18 163.03H119.12Z";

const QWEN_CORE = "M127.86 79.83H76.14L101.18 122.11L127.86 79.83Z";

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

  if (brand === "deepseek") {
    // Official whale — the left half of the 195x41 DeepSeek lockup.
    return (
      <svg {...common} viewBox="-1 -1 58.5 44" fill="#4d6bfe">
        <path d={DEEPSEEK_WHALE} />
      </svg>
    );
  }

  if (brand === "qwen") {
    // Official mark: gradient body, white cut lines, gradient core.
    return (
      <svg {...common} viewBox="0 0 200 200" fill="none">
        <path d={QWEN_BODY} fill="url(#qwen-mark-body)" />
        <path d={QWEN_LINES} fill="#ffffff" />
        <path d={QWEN_CORE} fill="url(#qwen-mark-core)" />
        <defs>
          <radialGradient
            id="qwen-mark-body"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(100 100) rotate(90) scale(100)"
          >
            <stop stopColor="#665CEE" />
            <stop offset="1" stopColor="#332E91" />
          </radialGradient>
          <radialGradient
            id="qwen-mark-core"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(100 100) rotate(90) scale(100)"
          >
            <stop stopColor="#665CEE" />
            <stop offset="1" stopColor="#332E91" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  if (brand === "grok") {
    // Official Grok glyph; currentColor so it flips between themes.
    return (
      <svg {...common} viewBox="0 0 34 33" fill="currentColor">
        <path d={GROK_MARK_1} />
        <path d={GROK_MARK_2} />
      </svg>
    );
  }

  if (brand === "whoami") {
    // Globe: "what is my connection?"
    return (
      <svg
        {...common}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21C9.5 18.4 8.2 15.3 8.2 12S9.5 5.6 12 3z" />
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
            : brand === "deepseek"
              ? "text-[#4d6bfe]"
              : brand === "qwen"
                ? "text-[#2e7cf6]"
                : brand === "grok"
                  ? "text-foreground"
                  : brand === "whoami"
                    ? "text-accent"
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