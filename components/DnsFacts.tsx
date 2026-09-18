"use client";

import { useEffect, useState } from "react";
import { dash, FactBox, Pulse } from "./FactRow";
import { probeBrowserDns, type DnsResolver } from "@/lib/dns-probe";

export function DnsFacts() {
  const [resolver, setResolver] = useState<DnsResolver | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const ac = new AbortController();
    probeBrowserDns(ac.signal)
      .then((result) => setResolver(result))
      .catch(() => setResolver(null));
    return () => ac.abort();
  }, []);

  return (
    <FactBox label="DNS">
      {resolver === undefined ? (
        <Pulse className="h-4 w-[18ch]" />
      ) : resolver ? (
        resolver.geo ? (
          <span>
            <span className="text-foreground/80">{resolver.geo}</span>
            <span className="mt-0.5 block font-mono text-[13px] text-muted">
              {resolver.ip}
            </span>
          </span>
        ) : (
          <span className="font-mono text-[13px] text-muted">{resolver.ip}</span>
        )
      ) : (
        dash
      )}
    </FactBox>
  );
}
