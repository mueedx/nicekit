import type { NextConfig } from "next";

const coopCoep = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@cloudflare/speedtest"],
  async redirects() {
    return [
      // The homepage is now the hub that lists every tool.
      { source: "/tools", destination: "/", permanent: true },
      // Claude and ChatGPT merged into one auto-detecting tool.
      { source: "/tools/claude-export", destination: "/tools/chat-export", permanent: true },
      { source: "/tools/chatgpt-export", destination: "/tools/chat-export", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/tools/:path*",
        headers: coopCoep,
      },
    ];
  },
};

export default nextConfig;
