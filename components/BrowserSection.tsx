"use client";

import { useEffect, useState } from "react";
import { FactBox, FactGrid, Pulse } from "./FactRow";
import { SectionKicker } from "./SectionKicker";
import { zoneTimeAt } from "@/lib/zone-time";

type BrowserFacts = {
  fingerprint: string | null;
  timezone: string | null;
  zoneTime: string | null;
};

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canvasSignal(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 24;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.textBaseline = "top";
    ctx.font = "14px monospace";
    ctx.fillStyle = "#c44";
    ctx.fillRect(0, 0, 64, 24);
    ctx.fillStyle = "#fff";
    ctx.fillText("nicekit", 2, 4);
    return canvas.toDataURL();
  } catch {
    return "";
  }
}

export function BrowserSection() {
  const [facts, setFacts] = useState<BrowserFacts>({
    fingerprint: null,
    timezone: null,
    zoneTime: null,
  });

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const payload = JSON.stringify({
      ua: navigator.userAgent,
      lang: navigator.languages,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      cores: navigator.hardwareConcurrency ?? 0,
      timezone,
      canvas: canvasSignal(),
    });
    void sha256Hex(payload).then((fingerprint) => {
      setFacts({
        fingerprint,
        timezone,
        zoneTime: zoneTimeAt(timezone, Date.now()),
      });
    });
  }, []);

  return (
    <section id="browser" className="border-t border-border px-5 py-6">
      <SectionKicker number="04" title="Browser" />
      <FactGrid>
        <FactBox label="Fingerprint">
          {facts.fingerprint ? (
            <span
              title={facts.fingerprint}
              className="break-all font-mono text-[13px] text-muted"
            >
              {facts.fingerprint.slice(0, 12)}
            </span>
          ) : (
            <Pulse className="h-4 w-[8ch]" />
          )}
        </FactBox>
        <FactBox label="Timezone">
          {facts.timezone ? (
            <span
              className="cursor-help underline decoration-accent decoration-dashed underline-offset-2"
              title={facts.zoneTime ?? undefined}
            >
              {facts.timezone}
            </span>
          ) : (
            <Pulse className="h-4 w-[13ch]" />
          )}
        </FactBox>
      </FactGrid>
    </section>
  );
}
