# Exitcard architecture

How Exitcard is built: request flow, lookups, persistence, and what we chose not to do.

For visual rules see [theme-ui-handover.md](./theme-ui-handover.md).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 App Router on Vercel |
| UI | React 19, Tailwind CSS v4, client + server components |
| Persistence | Upstash Redis via `@upstash/redis` (REST) |
| IP / origin | ipwho.is, ipinfo.io, RIPE Stat, ipapi.is |
| Weather | Open-Meteo |
| Speed | `@cloudflare/speedtest` (browser only) |
| DNS resolver | ip-api edns probe (browser only) |
| VPN guess | ipapi.is (browser only) |
| Globe | Three.js + `@react-three/fiber` (desktop backdrop) |

## Request flow (no BFF)

Exitcard does **not** use a Backend-for-Frontend API layer. The home page is a **server component** that loads everything in one server render.

```
Browser GET /
  → middleware.ts (CLI plain IP, JSON rewrite, client hints)
  → app/page.tsx (RSC)
       loadVisitor(headers)     // IP, origin, weather, UA facts
       recordPageVisit(code)    // Upstash incr + country hash
  → WhoAmICard (client component)
       client probes: DNS, VPN, speedtest, fingerprint
```

We considered a BFF (`GET /api/me`) so the browser Network tab would only show first-party calls. That was dropped because:

- Origin, weather, and most facts already run on the server during RSC render.
- DNS and Cloudflare speedtest **must** run in the browser (resolver and last-mile path). Proxying them through Vercel would measure the datacenter, not the visitor.
- A thin `/api/me` would duplicate `loadVisitor` without hiding those probes.

If we add a BFF later, it would be for API shape or caching, not to hide client-only measurements.

### Dual interface (`middleware.ts`)

| Client | Response |
| --- | --- |
| curl / wget / httpie | `text/plain` public IP only |
| `Accept: application/json` (no HTML preference) | Rewritten to `/json` |
| Normal browser | HTML card + `Accept-CH` for UA client hints |

`/json` and curl do **not** increment visits or country flags.

## Origin lookup (`lib/origin.ts`)

Four upstream calls run in parallel per request IP:

| Source | Used for |
| --- | --- |
| ipwho.is | Primary: city, region, country, timezone, ASN, provider, coords |
| RIPE Stat | Network CIDR prefix |
| ipinfo.io | Postcode and **fallback** city / region / country code |
| ipapi.is | Fallback country, org type (hosting vs ISP), provider hints |

### Country fallback

ipwho is the source of truth when it returns data. VPN and datacenter IPs often come back with empty country fields.

`fillOriginGaps()` backfills only **missing** fields:

1. **ipinfo.io**: `country` (2-letter code), city, region, postal
2. **ipapi.is**: `country` name, `country_code`
3. **Intl.DisplayNames**: country name from ISO code when we have code but no name

Display uses `countryLabel()` so Origin shows flag + name whenever a code exists. Footer Redis recording uses the same merged `origin.countryCode`.

Postcode always prefers ipinfo over ipwho (ipwho returned wrong postcodes for some PK cities).

### Provider branding (`lib/provider-brand.ts`)

`displayProvider()` normalizes ISP strings before show:

- **PTCL**: matches Pakistan Telecommunication, AS17557, or "ptcl" across provider, ASN, and ipapi names
- **Pool names**: skips technical strings like "HSI Pool … BRAS" when a cleaner org name exists

### Org type (`lib/org-type.ts`)

Classified from ipapi datacenter flag plus name heuristics: **Hosting**, **ISP**, **Education**, **Government**. Shown as **Type** inside Advanced (not the company name).

## Weather (`lib/weather.ts`)

Open-Meteo forecast from origin latitude/longitude. If coords are missing, weather boxes stay empty.

## Client-only probes

These run after hydration in the browser. They never hit our server and are not stored.

| Feature | Module | Why client-side |
| --- | --- | --- |
| DNS resolver | `lib/dns-probe.ts` | Must use the visitor's resolver (`edns.ip-api.com`) |
| VPN guess | `lib/vpn-probe.ts` | ipapi.is from the visitor's egress IP |
| Speedtest | `components/SpeedTest.tsx` | Cloudflare engine must run from the browser |
| Fingerprint | `components/BrowserSection.tsx` | SHA-256 in browser; not sent to server |

### Speedtest state sharing

`SpeedTestProvider` (React context) shares the Cloudflare snapshot between:

- Header: Download + Latency (user clicks Start)
- Advanced: upload, jitter, loaded latency, duration

`onResultsChange` updates context so Advanced fills as the test runs.

## Upstash Redis (`lib/visits.ts`)

Connected through the Vercel Marketplace Upstash integration. Env vars:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Client: `@upstash/redis` with `new Redis({ url, token })`. We do **not** use `@vercel/kv`, `UPSTASH_*` via `Redis.fromEnv()`, or TCP `REDIS_URL`.

### Keys

| Key | Type | Purpose |
| --- | --- | --- |
| `visits:total` | string (INCR) | Anonymous page view counter |
| `visits:countries` | hash | ISO codes that have visited, e.g. `PK` → `yes` |

`recordPageVisit(countryCode)` runs only from `app/page.tsx` on HTML `/`:

1. `INCR visits:total`
2. If valid 2-letter code: `HSET visits:countries {code} yes`
3. `HGETALL visits:countries` for the flag row

Commands are pipelined for one Upstash round trip. No IP, hostname, UA, or per-visitor id is written.

If env vars are missing (local dev without Redis), visits show `—` and no flags.

### Footer UI

Below `N visits`, sorted flag emojis from hash keys. `flagEmoji()` in `lib/origin.ts` builds regional-indicator pairs; `font-sans text-xl` ensures the Twemoji country-flag webfont in `globals.css` renders them.

## Privacy

**In memory for one response:** IP, origin lookup, weather, parsed User-Agent, client hints.

**Never stored:** IP, fingerprint, hostname, lookup payloads, cookies.

**Stored in Upstash:** one global visit integer and a set of country codes (not names). Coarse aggregation only.

Copy on the card: no user trace and no identifying info is saved.

## Hydration

Server and client must match on first paint.

- **`serverNow`**: passed from `app/page.tsx` into Advanced clock-skew and Origin timezone tooltips (`zoneTimeAt()` in `lib/zone-time.ts`). Avoids `new Date()` drift between SSR and hydration.
- **WhoAmICard** is a client component so speed context and interactive sections share one tree.

## Page sections

| # | Section | Render |
| --- | --- | --- |
| Header | IP, hostname, speedtest | Mixed |
| 01 | Origin | Server |
| 02 | Weather | Server |
| 03 | VPN | Client |
| 04 | Browser | Client |
| 05 | Advanced | Closed `<details>`: ASN, Type, request facts, speed extras, nerdy metrics |

## File map

| Path | Role |
| --- | --- |
| `middleware.ts` | CLI IP, JSON rewrite, Accept-CH |
| `app/page.tsx` | RSC entry, visitor load, Redis record |
| `app/json/route.ts` | JSON API (no Redis) |
| `app/hostname/route.ts` | Reverse DNS for header |
| `lib/visitor.ts` | `loadVisitor` orchestration |
| `lib/origin.ts` | Geo lookup + fallbacks + flags |
| `lib/visits.ts` | Upstash visit + country hash |
| `lib/provider-brand.ts` | ISP display names (e.g. PTCL) |
| `lib/org-type.ts` | Hosting / ISP / education / government |
| `lib/zone-time.ts` | Timezone tooltip without hydration mismatch |
| `components/WhoAmICard.tsx` | Card layout and footer |
| `components/SpeedTest.tsx` | Cloudflare engine + context |

## Deployment

- Vercel project root: this repository
- `dynamic = "force-dynamic"` on `/` so every view gets a fresh IP lookup and visit record
- Do not commit `.env.local` or Redis tokens

## Related docs

- [theme-ui-handover.md](./theme-ui-handover.md): colors, type, layout tokens
- [.specify/memory/constitution.md](../.specify/memory/constitution.md): product principles
