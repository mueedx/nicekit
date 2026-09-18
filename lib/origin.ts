import { classifyOrgType } from "./org-type";
import { displayProvider } from "./provider-brand";
import { asBoolean, asNumber, asString, isRecord } from "./parse";
import type { OriginRecord } from "./types";

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(2500),
  });
  if (!response.ok) return null;
  return response.json();
}

function emptyOrigin(): OriginRecord {
  return {
    source: "ipwho.is",
    city: null,
    postcode: null,
    region: null,
    country: null,
    countryCode: null,
    timezone: null,
    network: null,
    asn: null,
    provider: null,
    orgType: null,
    latitude: null,
    longitude: null,
    accuracyKm: null,
  };
}

function parseIpwho(body: unknown): OriginRecord {
  const origin = emptyOrigin();
  if (!isRecord(body) || body.success !== true) return origin;

  origin.city = asString(body.city);
  origin.region = asString(body.region);
  origin.country = asString(body.country);
  origin.countryCode = asString(body.country_code);
  origin.latitude = asNumber(body.latitude);
  origin.longitude = asNumber(body.longitude);

  if (isRecord(body.timezone)) {
    origin.timezone = asString(body.timezone.id);
  }

  if (isRecord(body.connection)) {
    const asn = asNumber(body.connection.asn);
    const org = asString(body.connection.org);
    const isp = asString(body.connection.isp);
    origin.provider = org ?? isp;
    if (asn !== null) {
      const label = isp && isp !== org ? isp : org;
      origin.asn = label ? `AS${asn} ${label}` : `AS${asn}`;
    }
  }

  return origin;
}

function parseRipePrefix(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.data)) return null;
  return asString(body.data.prefix);
}

function parseCountryCode(value: string | null): string | null {
  if (!value || !/^[A-Za-z]{2}$/.test(value)) return null;
  return value.toUpperCase();
}

function parseIpinfoFallback(body: unknown): {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  postcode: string | null;
} {
  if (!isRecord(body)) {
    return {
      country: null,
      countryCode: null,
      city: null,
      region: null,
      postcode: null,
    };
  }
  return {
    country: null,
    countryCode: parseCountryCode(asString(body.country)),
    city: asString(body.city),
    region: asString(body.region),
    postcode: asString(body.postal),
  };
}

function parseIpapiLocation(body: unknown): {
  country: string | null;
  countryCode: string | null;
} {
  if (!isRecord(body)) return { country: null, countryCode: null };
  return {
    country: asString(body.country),
    countryCode: parseCountryCode(
      asString(body.country_code) ?? asString(body.countryCode),
    ),
  };
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryNameFromCode(countryCode: string): string | null {
  try {
    return regionNames.of(countryCode.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

function fillOriginGaps(
  origin: OriginRecord,
  info: ReturnType<typeof parseIpinfoFallback>,
  api: ReturnType<typeof parseIpapiLocation>,
): void {
  if (origin.postcode === null) origin.postcode = info.postcode;
  if (origin.city === null) origin.city = info.city;
  if (origin.region === null) origin.region = info.region;
  if (origin.countryCode === null) {
    origin.countryCode = info.countryCode ?? api.countryCode;
  }
  if (origin.country === null) {
    origin.country = api.country;
  }
  if (origin.country === null && origin.countryCode !== null) {
    origin.country = countryNameFromCode(origin.countryCode);
  }
}

function parseIpapiOrg(body: unknown): {
  datacenter: boolean;
  names: (string | null)[];
} {
  if (!isRecord(body)) return { datacenter: false, names: [] };
  return {
    datacenter: asBoolean(body.is_datacenter) === true,
    names: [asString(body.company_name), asString(body.asn_org)],
  };
}

export async function lookupOrigin(ip: string): Promise<OriginRecord> {
  const encoded = encodeURIComponent(ip);
  const [who, ripe, info, api] = await Promise.all([
    fetchJson(`https://ipwho.is/${encoded}`).catch(() => null),
    fetchJson(
      `https://stat.ripe.net/data/network-info/data.json?resource=${encoded}`,
    ).catch(() => null),
    fetchJson(`https://ipinfo.io/${encoded}/json`).catch(() => null),
    fetchJson(`https://api.ipapi.is/?q=${encoded}`).catch(() => null),
  ]);

  const origin = parseIpwho(who);
  origin.network = parseRipePrefix(ripe);
  const infoFields = parseIpinfoFallback(info);
  origin.postcode = origin.postcode ?? infoFields.postcode;
  const apiLocation = parseIpapiLocation(api);
  fillOriginGaps(origin, infoFields, apiLocation);
  const ipapi = parseIpapiOrg(api);
  origin.provider = displayProvider({
    provider: origin.provider,
    asn: origin.asn,
    names: ipapi.names,
  });
  origin.orgType = classifyOrgType({
    datacenter: ipapi.datacenter,
    names: [...ipapi.names, origin.provider, origin.asn],
  });
  return origin;
}

export function flagEmoji(countryCode: string | null): string {
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode)) return "";
  const cc = countryCode.toUpperCase();
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + (cc.charCodeAt(0) - 65),
    base + (cc.charCodeAt(1) - 65),
  );
}

export function countryLabel(origin: OriginRecord): string | null {
  const flag = flagEmoji(origin.countryCode);
  const name =
    origin.country ??
    (origin.countryCode ? countryNameFromCode(origin.countryCode) : null);
  if (name) return `${flag ? `${flag} ` : ""}${name}`;
  if (origin.countryCode) {
    return `${flag ? `${flag} ` : ""}${origin.countryCode}`;
  }
  return null;
}

export function mapsUrl(origin: OriginRecord): string | null {
  if (origin.latitude === null || origin.longitude === null) return null;
  const q = `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
