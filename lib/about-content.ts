export type AboutSection = {
  kicker: string;
  title: string;
  body: string;
  items?: string[];
};

export const ABOUT_INTRO = {
  title: "Why I made this",
  lead: "Nicekit is a proving ground: a real public product I built to test tech, AI-assisted craft, and my own skills. It is a whoami-class network diagnostic plus browser-only file tools, shipped on Vercel Hobby without storing identifying data.",
};

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    kicker: "00",
    title: "Thesis",
    body: "I wanted one project that forced me to ship something honest: show visitors what their connection already reveals, keep files on their machine, and still learn modern Next.js, edge deployment, Redis, security hardening, and agentic engineering. Nicekit is that sandbox, not a course site, not a SaaS pitch, just a working instrument.",
  },
  {
    kicker: "01",
    title: "How it was built",
    body: "Agents wrote most of this repo. There is no RAG, no embeddings, no chatbot in the app. I pinned 289 skills in skills-lock.json, ran Spec Kit for specs and tasks, and used tastemaker so the UI would not look like every other cyan SaaS template. Next.js never imports .agents; tsconfig excludes it. The skills shaped how the code got written, not what visitors download.",
    items: [
      "MengTo/Skills (132) for layout, Three.js, Tailwind, motion",
      "Owl-Listener/designer-skills (107) for forms, UX critique, IA",
      "mattpocock/skills (36) for TDD, code review, spec discipline",
      "emilkowalski/skills (12) for animation review",
      "codeswithroh/tastemaker (2) for palette checks and .tastemaker/style-lock.md",
      "Spec Kit speckit-* in .cursor/skills/ for specs/001-whoami-lookup, 002/003-tools-hub, constitution",
      "Day-to-day picks: tastemaker, editorial-tech, tailwindcss, animation-on-scroll, threejs, form-design, code-review, tdd",
      "/llms.txt is the only AI-facing surface in production",
    ],
  },
  {
    kicker: "02",
    title: "Network identity",
    body: "You learn more from loading the card once than from a slide deck on the OSI model. Every row is a live measurement or lookup against your actual exit path.",
    items: [
      "Public IPv4/IPv6 from x-real-ip, then x-vercel-forwarded-for, then the rightmost XFF hop (leftmost is spoofable)",
      "City, ASN, ISP, CIDR from ipwho.is, RIPE Stat, ipinfo, and ipapi",
      "Reverse DNS on demand at /hostname",
      "Browser-side EDNS probe to see which resolver you are actually using",
      "Same IP whether you open / in a browser, curl it, or send Accept: application/json",
      "Accept-CH and UA-CH for high-entropy browser facts",
      "Cloudflare Speedtest in the browser because server-side speed would measure Vercel, not you",
      "VPN/proxy/Tor/datacenter flags from ipapi.is (heuristic, not gospel)",
      "Network Information API, clock skew, fingerprint hash in the browser only, never sent or stored",
    ],
  },
  {
    kicker: "03",
    title: "Next.js and Vercel",
    body: "Vercel Hobby caps request bodies at 4.5 MB. That single limit is why PDF and video conversions run in the browser with pdf-lib and ffmpeg.wasm instead of uploading to a serverless function. Everything else is Next 16 App Router, React 19, Tailwind v4, deployed on Vercel Hobby.",
    items: [
      "Home is an async RSC: loadVisitor and recordPageVisit on /",
      "DNS, VPN, speedtest, fingerprint, and tools UI stay client-side",
      "Tool pages pre-rendered with generateStaticParams",
      "/ is force-dynamic so the IP is always current",
      "proxy.ts handles CLI plain-IP, JSON rewrite, and Client Hints (not middleware.ts)",
      "Inter and JetBrains Mono, 2px corners, light/dark toggle, Three.js earth on desktop",
    ],
  },
  {
    kicker: "04",
    title: "Architecture decisions",
    body: "I sketched GET /api/me as a BFF so the Network tab would look tidy. Then I realized origin and weather already load in the RSC pass, and DNS plus speedtest have to run in the browser anyway. Proxying those through Vercel would lie about your connection. I deleted the idea instead of duplicating lib/visitor.ts behind another route.",
    items: [
      "Browser gets the card, curl gets plaintext IP, JSON clients get /json",
      "/llms.txt for agents that want a summary without scraping HTML",
      "POST /api/tools/stats is the only API route, and it only accepts a category name",
    ],
  },
  {
    kicker: "05",
    title: "Redis",
    body: "Upstash over REST, every module marked server-only. If Redis is down, visits show a dash and the site still works. I use it for counts and short caches, nothing that identifies a visitor.",
    items: [
      "visits:total increments on HTML loads of / only",
      "visits:countries records which ISO codes have shown up",
      "cache:origin:{ip} saves repeat geo lookups for 10 minutes",
      "cache:weather:{lat,lon} does the same for Open-Meteo",
      "tools:conversions tracks anonymous category totals after a conversion",
      "ratelimit:tools-stats:{ip} caps the beacon at 30 requests per minute",
    ],
  },
  {
    kicker: "06",
    title: "Hardening",
    body: "The site is worthless if someone can spoof x-forwarded-for and get a fake IP on the card and in the visit counter. That bug is what triggered the hardening pass.",
    items: [
      "Trust x-real-ip and x-vercel-forwarded-for; take the rightmost XFF hop only",
      "Egress lookup via ipify only when the address is loopback or missing",
      "Stats route returns 400 on bad JSON, 403 on cross-origin Origin, 429 when rate limited",
      "@upstash/redis stays out of client bundles via server-only imports",
      "Global headers: nosniff, strict Referrer-Policy, X-Frame-Options DENY, HSTS",
      "COOP/COEP on /tools/* so ffmpeg.wasm can use SharedArrayBuffer",
      "Vitest strips Redis env in CI; ESLint via eslint-config-next; Next 16 cleared npm audit",
      "No CSP or Permissions-Policy yet",
    ],
  },
  {
    kicker: "07",
    title: "Client-side tools",
    body: "Merge PDF, split, rotate, images to PDF, MP4 to MP3. Pick a file, it processes locally. I only beacon which category succeeded so I can see if anyone uses the hub at all.",
    items: [
      "pdf-lib for merge, split, rotate, and images-to-PDF",
      "ffmpeg.wasm for MP4 to MP3 (needs the COOP/COEP headers on /tools)",
      "200 MB per file, one file at a time in batch mode",
      "Privacy banner on every tool page because the point is the files never leave",
    ],
  },
  {
    kicker: "08",
    title: "What I left out",
    body: "I stopped here on purpose.",
    items: [
      "BFF layer (sketched /api/me, did not ship it)",
      "In-app AI, RAG, or embeddings",
      "Logins, sessions, or a user database",
      "Stirling PDF or server-side PDF to DOCX",
      "CSP and Permissions-Policy headers",
      "Traceroute, packet capture, OSI labs",
      "Analytics that receive visitor IPs",
    ],
  },
];
