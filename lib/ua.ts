import { parseClientHintHeaders } from "./client-hints";
import type { RequestFacts } from "./types";

const emptyRequest: RequestFacts = {
  browser: null,
  os: null,
  device: null,
  arch: null,
  bitness: null,
  model: null,
};

function browserName(ua: string): string | null {
  const edge = /Edg(?:e|A|iOS)?\/(\d+)/.exec(ua);
  if (edge) return `Edge ${edge[1]}`;
  const opera = /(?:OPR|Opera)\/(\d+)/.exec(ua);
  if (opera) return `Opera ${opera[1]}`;
  const firefox = /Firefox\/(\d+)/.exec(ua);
  if (firefox) return `Firefox ${firefox[1]}`;
  const chrome = /Chrome\/(\d+)/.exec(ua);
  if (chrome && !ua.includes("Chromium")) return `Chrome ${chrome[1]}`;
  const safari = /Version\/(\d+).*Safari\//.exec(ua);
  if (safari) return `Safari ${safari[1]}`;
  return null;
}

function osName(ua: string): string | null {
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  return null;
}

function deviceName(ua: string): string | null {
  if (/iPad/i.test(ua) || /Tablet/i.test(ua)) return "Tablet";
  if (/Mobi/i.test(ua) || /Android/i.test(ua)) return "Mobile";
  if (browserName(ua) || osName(ua)) return "Desktop";
  return null;
}

export function parseUserAgent(ua: string | null): RequestFacts {
  if (!ua) return { ...emptyRequest };
  return {
    ...emptyRequest,
    browser: browserName(ua),
    os: osName(ua),
    device: deviceName(ua),
  };
}

export function parseRequestFacts(headers: Headers): RequestFacts {
  const request = parseUserAgent(headers.get("user-agent"));
  const hints = parseClientHintHeaders(headers);
  return {
    ...request,
    arch: hints.arch,
    bitness: hints.bitness,
    model: hints.model,
  };
}

export function isCliUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  return /(?:^curl\b|\bcurl\/|wget\/|httpie\/)/i.test(ua);
}

export function wantsJson(accept: string | null): boolean {
  if (!accept) return false;
  const html = accept.indexOf("text/html");
  const json = accept.indexOf("application/json");
  if (json === -1) return false;
  if (html === -1) return true;
  return json < html;
}
