# Nicekit

A whoami-class network diagnostic and a browser-only tools hub. Nothing identifying is stored.

**Live:** [nicekit.vercel.app](https://nicekit.vercel.app)

Open `/` in a browser for the card: your public IP, a Cloudflare speed test, your origin, the weather there, a best-guess VPN flag, the DNS resolver your browser used, and your browser/OS. Open `/tools` for eight file and web tools. `curl` the same URL and you get just the IP. Files processed by the tools never leave your machine.

## The card (`/`)

Every row is a live measurement or lookup against your actual exit path, not a cached sample.

| Fact | How |
| --- | --- |
| Public IP (IPv4/IPv6) | `x-real-ip`, then `x-vercel-forwarded-for`, then the **rightmost** `X-Forwarded-For` hop (the leftmost is spoofable). Loopback or missing → egress lookup via ipify. |
| Origin | City, region, country, postal, coordinates, timezone, ASN, ISP from **ipwho.is**, plus the covering BGP prefix from **RIPE Stat**, plus postcode and gap-fills from **ipinfo** / **ipapi.is**. |
| Weather | Current conditions from **Open-Meteo** at the origin coordinates. |
| Local time | Origin timezone from the geo lookup. |
| DNS resolver | The browser's own resolver, probed client-side via an **ip-api EDNS** lookup of a random hostname. Reports your device's stub resolver, not the server's. |
| Speed | **Cloudflare** `speed.cloudflare.com` engine (`@cloudflare/speedtest`) run in your tab: download, upload, latency, plus advanced jitter/lag details. |
| VPN / proxy / Tor / hosting | Heuristic from **ipapi.is**, probed from the browser, with an honest disclaimer: lists miss many commercial and almost all residential VPNs; the network name is the org on the exit address, not a guaranteed product. |
| Browser / OS | User-Agent plus Client Hints (architecture, bitness, platform, model) requested via `Accept-CH` / `Critical-CH`. |
| Advanced facts | Languages, screen size, CPU cores, device memory, network type (Network Information API), clock skew vs the server, timezone match, reduced-motion, color scheme, bot flag. All client-side, never sent anywhere. |
| Reverse DNS | On demand at `/hostname` (1.5 s timeout, text/plain). |
| Visits | Anonymous total visit count and the set of country codes seen, via Upstash Redis. No IPs, no fingerprints. |
| Backdrop | Three.js earth horizon on desktop, light/dark theme toggle everywhere. |

## Tools (`/tools`)

Eight tools in two families. File tools run entirely in the browser — bytes never leave the tab. Web tools fetch public URLs through small server routes.

### File tools (client-side, 200 MB per file)

| Tool | What it does | Engine |
| --- | --- | --- |
| Merge PDF | Combine multiple PDFs into one. | `pdf-lib` |
| Split PDF | Extract each page into its own PDF. | `pdf-lib` |
| Rotate PDF | Rotate all pages by 90°, 180°, or 270°. | `pdf-lib` |
| Images to PDF | JPG, PNG, or WebP images into a single PDF. | `pdf-lib` |
| MP4 to MP3 | Extract audio from an MP4 video as MP3. | `ffmpeg.wasm` |

The four PDF tools share one tab at [`/tools/pdf`](https://nicekit.vercel.app/tools/pdf). Each tool page has a dropzone, a batch queue (one file at a time, live status per file), and a privacy banner. MP4→MP3 needs the `COOP`/`COEP` headers on `/tools/*` so ffmpeg.wasm can use `SharedArrayBuffer`.

### Web tools (fetchers)

| Tool | What it does |
| --- | --- |
| Loom Downloader | From any `loom.com/share/` link: HD MP4 video, transcript as TXT, SRT, VTT, or JSON, and preview assets. |
| Claude Chat Export | Read a public `claude.ai/share` conversation and export it as Markdown, TXT, DOCX, or PDF. |
| Vercel Domain Checker | Check whether a `*.vercel.app` subdomain is available for your next deployment. |

## Machine interfaces

The card is not only a web page. `proxy.ts` (Next 16's middleware) routes by client:

| You are | Try this |
| --- | --- |
| A browser | Open `/` for the card; `/tools` for the hub; `/about` for the story. |
| `curl` / `wget` / `httpie` | `curl -sS -A curl https://nicekit.vercel.app` → your IP as `text/plain`. |
| A JSON client | `curl -sS -H 'Accept: application/json' https://nicekit.vercel.app` → JSON with `ip`, `origin`, `weather`, `request`. Speed, DNS, and VPN stay in the browser and are not in the JSON. |
| Reverse DNS | `curl -sS https://nicekit.vercel.app/hostname` → PTR name, or empty. |
| An agent | Read [`/llms.txt`](https://nicekit.vercel.app/llms.txt) for the machine index. |

One API route takes writes: `POST /api/tools/stats` — the anonymous conversion beacon. It returns 400 on bad JSON, 403 on a cross-origin `Origin`, and 429 past 30 requests per minute per IP. The web tools use their own routes under `/api/loom/*`, `/api/claude*`, and `/api/vercel-domain`.

## Why it runs in the browser

- **It would measure the wrong thing.** A server-side speed test measures Vercel's network, not the visitor's. Same for the DNS probe: it must resolve from your device to report your resolver.
- **Body-size cap.** Vercel Hobby caps request bodies at 4.5 MB. PDF and video conversions would hit that limit server-side, so they run client-side and files never transit a server.
- **Privacy.** User files and derived facts stay in the tab.

The server side is deliberately small: the home page is an async server component (`loadVisitor` → IP, origin, weather; `recordPageVisit` → counters), `proxy.ts` handles the CLI/JSON routing and Client Hints, plus `/json`, `/hostname`, and the tool fetcher routes. There is no BFF layer — it was sketched (`/api/me`) and deleted because it would duplicate `loadVisitor` without hiding the client-only probes.

## Data and privacy

Nothing identifying about a visitor is stored. The only persisted state lives in Upstash Redis:

- `visits:total` — incremented on HTML loads of `/` only (curl and `/json` don't count).
- `visits:countries` — which two-letter country codes have shown up.
- `cache:origin:{ip}` / `cache:weather:{lat,lon}` — 10-minute caches so repeat visits don't re-hit ipwho.is / Open-Meteo.
- `tools:conversions` — anonymous per-category count of successful conversions.
- `ratelimit:tools-stats:{ip}` — short-lived, auto-expiring rate-limit key for the stats beacon.

No analytics, no cookies, no accounts. If Redis is down, counters show a dash and the site still works.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, `proxy.ts`) on Vercel |
| UI | React 19, Tailwind CSS v4, TypeScript, client + server components |
| 3D | Three.js + `@react-three/fiber` (desktop earth backdrop) |
| Files | `pdf-lib`, `@ffmpeg/ffmpeg` (WASM) |
| Speed | `@cloudflare/speedtest` |
| Persistence | `@upstash/redis` over REST, every module marked `server-only` |
| Tests | Vitest |

## Run locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Then:

```bash
curl -sS -A curl http://localhost:3000/
curl -sS -H 'Accept: application/json' http://localhost:3000/
curl -sS http://localhost:3000/hostname
```

```bash
npm test        # vitest run
npm run lint    # eslint
npm run build   # production build
```

## Deploy

Import this repository into Vercel; leave the root directory as `.`. No environment variables are required — the only runtime secret is optional:

- `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Upstash REST). Without them, visit counts and conversion tallies degrade to dashes; everything else works.

The production slug is `nicekit`.

## Lookup sources

Origin and ISP: [ipwho.is](https://ipwho.is/) and [RIPE Stat](https://stat.ripe.net/), with [ipinfo](https://ipinfo.io/) and [ipapi.is](https://ipapi.is/) filling gaps. Weather: [Open-Meteo](https://open-meteo.com/). DNS resolver: [ip-api EDNS](https://ip-api.com/docs/dns). VPN/proxy flags: [ipapi.is](https://ipapi.is/) (heuristic). Speed test: [Cloudflare speedtest](https://developers.cloudflare.com/speed/) (`@cloudflare/speedtest` against `speed.cloudflare.com`). The page names each source inline next to the fact it produces.

## Why open source

This repo is a working instrument and a proving ground: modern Next.js, edge deployment, client-only measurement, WASM file processing, and honest privacy limits. Read [`/about`](https://nicekit.vercel.app/about) for the full account of why it exists and what it exercises, or start with [`docs/architecture.md`](docs/architecture.md).

