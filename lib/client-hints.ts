import { asString, isRecord } from "./parse";

export type ClientHints = {
  arch: string | null;
  bitness: string | null;
  model: string | null;
};

const HINT_HEADERS = {
  arch: "sec-ch-ua-arch",
  bitness: "sec-ch-ua-bitness",
  model: "sec-ch-ua-model",
} as const;

export const ACCEPT_CH =
  "Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Model";

function unquoteHint(value: string): string | null {
  const trimmed = value.trim().replace(/^"|"$/g, "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function headerHint(headers: Headers, name: string): string | null {
  const raw = headers.get(name);
  if (!raw) return null;
  return unquoteHint(raw);
}

export function parseClientHintHeaders(headers: Headers): ClientHints {
  return {
    arch: headerHint(headers, HINT_HEADERS.arch),
    bitness: headerHint(headers, HINT_HEADERS.bitness),
    model: headerHint(headers, HINT_HEADERS.model),
  };
}

export async function readHighEntropyHints(): Promise<ClientHints> {
  const empty: ClientHints = { arch: null, bitness: null, model: null };
  if (!("userAgentData" in navigator)) return empty;
  const data = navigator.userAgentData;
  if (typeof data !== "object" || data === null) return empty;
  if (!("getHighEntropyValues" in data)) return empty;
  const getter = data.getHighEntropyValues;
  if (typeof getter !== "function") return empty;

  try {
    const result: unknown = await getter.call(data, [
      "architecture",
      "bitness",
      "model",
    ]);
    if (!isRecord(result)) return empty;
    return {
      arch: asString(result.architecture),
      bitness: asString(result.bitness),
      model: asString(result.model),
    };
  } catch {
    return empty;
  }
}
