"use client";

import { useEffect, useState } from "react";
import { Pulse } from "./FactRow";

export function HostnameLine() {
  const [hostname, setHostname] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/hostname", { cache: "no-store" })
      .then((response) => response.text())
      .then((text) => {
        if (cancelled) return;
        setHostname(text.trim() || null);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHostname(null);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return (
      <p className="mt-4 break-words text-center font-mono text-[13px] text-muted">
        <Pulse className="h-3.5 w-[24ch]" />
      </p>
    );
  }

  if (!hostname) return null;

  return (
    <p className="mt-4 break-words text-center font-mono text-[13px] text-muted">
      {hostname}
    </p>
  );
}
