import { asBoolean, asString, isRecord } from "./parse";

export type VpnProbe = {
  isVpn: boolean | null;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  network: string | null;
};

function vpnServiceName(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return (
    asString(value.serviceName) ??
    asString(value.service) ??
    asString(value.name)
  );
}

export function parseVpnProbe(body: unknown): VpnProbe | null {
  if (!isRecord(body) || asString(body.error)) return null;

  const isVpn = asBoolean(body.is_vpn);
  if (isVpn === null) return null;

  return {
    isVpn,
    isProxy: asBoolean(body.is_proxy) === true,
    isTor: asBoolean(body.is_tor) === true,
    isDatacenter: asBoolean(body.is_datacenter) === true,
    network:
      vpnServiceName(body.vpn) ??
      asString(body.company_name) ??
      asString(body.asn_org),
  };
}

export async function probeVpn(signal: AbortSignal): Promise<VpnProbe | null> {
  const response = await fetch("https://api.ipapi.is/", {
    cache: "no-store",
    signal,
  });
  if (!response.ok) return null;
  const body: unknown = await response.json();
  return parseVpnProbe(body);
}
