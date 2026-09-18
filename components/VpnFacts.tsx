"use client";

import { useEffect, useState } from "react";
import { dash, FactBox, FactGrid, Pulse } from "./FactRow";
import { probeVpn, type VpnProbe } from "@/lib/vpn-probe";
import { SectionKicker } from "./SectionKicker";

const DISCLAIMER =
  "VPN and proxy flags are a best guess. Lists miss many commercial VPNs and almost all residential ones, and hosting IPs get tagged by mistake. A network name is the organisation on the exit address, not a guaranteed product.";

function yesNo(value: boolean | null): string {
  if (value === null) return dash;
  return value ? "Yes" : "No";
}

export function VpnFacts() {
  const [probe, setProbe] = useState<VpnProbe | null | undefined>(undefined);

  useEffect(() => {
    const ac = new AbortController();
    probeVpn(ac.signal)
      .then((result) => setProbe(result))
      .catch(() => setProbe(null));
    return () => ac.abort();
  }, []);

  const loading = probe === undefined;
  const facts = probe ?? null;

  return (
    <section className="border-t border-border px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <SectionKicker number="03" title="VPN" />
        <a
          className="font-mono text-[13px] tracking-[0.14em] text-muted transition-colors duration-200 hover:text-accent"
          href="https://ipapi.is/"
          target="_blank"
          rel="noreferrer"
        >
          ipapi.is
        </a>
      </div>
      <FactGrid>
        <FactBox label="VPN">
          {loading ? <Pulse className="h-4 w-[4ch]" /> : yesNo(facts?.isVpn ?? null)}
        </FactBox>
        <FactBox label="Network">
          {loading ? <Pulse className="h-4 w-[16ch]" /> : (facts?.network ?? dash)}
        </FactBox>
        {facts?.isProxy ? <FactBox label="Proxy">Yes</FactBox> : null}
        {facts?.isTor ? <FactBox label="Tor">Yes</FactBox> : null}
        {facts?.isDatacenter ? <FactBox label="Datacenter">Yes</FactBox> : null}
      </FactGrid>
      <p className="mt-4 text-[13px] leading-relaxed text-muted">{DISCLAIMER}</p>
    </section>
  );
}
