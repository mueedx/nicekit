"use client";

import { useEffect, useState } from "react";
import { dash, FactBox, Pulse } from "./FactRow";

type NerdyFacts = {
  family: string;
  languages: string;
  screen: string;
  cores: string;
  memory: string | null;
  link: string | null;
  skew: string;
  tzMatch: string;
  motion: string;
  scheme: string;
  bot: string;
};

function ipFamily(ip: string): string {
  return ip.includes(":") ? "IPv6" : "IPv4";
}

function readLink(): string | null {
  if (!("connection" in navigator)) return null;
  const connection = navigator.connection;
  if (typeof connection !== "object" || connection === null) return null;

  const parts: string[] = [];
  if (
    "effectiveType" in connection &&
    typeof connection.effectiveType === "string"
  ) {
    parts.push(connection.effectiveType);
  }
  if ("downlink" in connection && typeof connection.downlink === "number") {
    parts.push(`${connection.downlink} Mbps`);
  }
  if ("rtt" in connection && typeof connection.rtt === "number") {
    parts.push(`${connection.rtt} ms`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function deviceMemoryGb(): string | null {
  if (!("deviceMemory" in navigator)) return null;
  const value = navigator.deviceMemory;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${value} GB`;
}

function formatSkew(serverNow: number): string {
  const delta = Date.now() - serverNow;
  const sign = delta >= 0 ? "+" : "-";
  const abs = Math.abs(delta);
  if (abs < 1000) return `${sign}${Math.round(abs)} ms`;
  return `${sign}${(abs / 1000).toFixed(1)} s`;
}

function tzMatchLabel(originTimezone: string | null): string {
  if (!originTimezone) return dash;
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return local === originTimezone ? "Match" : "Drift";
}

function readNerdy(input: {
  ip: string;
  originTimezone: string | null;
  serverNow: number;
}): NerdyFacts {
  const cores = navigator.hardwareConcurrency;
  return {
    family: ipFamily(input.ip),
    languages: navigator.languages.join(", "),
    screen: `${screen.width}x${screen.height} @ ${devicePixelRatio}`,
    cores: typeof cores === "number" ? String(cores) : dash,
    memory: deviceMemoryGb(),
    link: readLink(),
    skew: formatSkew(input.serverNow),
    tzMatch: tzMatchLabel(input.originTimezone),
    motion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "Reduce"
      : "No preference",
    scheme: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "Dark"
      : "Light",
    bot: navigator.webdriver ? "Yes" : "No",
  };
}

function Box({
  label,
  ready,
  children,
}: {
  label: string;
  ready: boolean;
  children: string;
}) {
  return (
    <FactBox label={label}>
      {ready ? children : <Pulse className="h-4 w-[8ch]" />}
    </FactBox>
  );
}

export function AdvancedFacts({
  ip,
  originTimezone,
  serverNow,
}: {
  ip: string;
  originTimezone: string | null;
  serverNow: number;
}) {
  const [facts, setFacts] = useState<NerdyFacts | null>(null);

  useEffect(() => {
    // rAF keeps the setState out of the synchronous effect body, which the
    // react-hooks/set-state-in-effect rule (correctly) discourages.
    const raf = requestAnimationFrame(() => {
      setFacts(readNerdy({ ip, originTimezone, serverNow }));
    });
    return () => cancelAnimationFrame(raf);
  }, [ip, originTimezone, serverNow]);

  const ready = facts !== null;

  return (
    <>
      <Box label="Family" ready={ready}>
        {facts?.family ?? dash}
      </Box>
      <Box label="Languages" ready={ready}>
        {facts?.languages ?? dash}
      </Box>
      <Box label="Screen" ready={ready}>
        {facts?.screen ?? dash}
      </Box>
      <Box label="Cores" ready={ready}>
        {facts?.cores ?? dash}
      </Box>
      <Box label="Memory" ready={ready}>
        {facts?.memory ?? dash}
      </Box>
      <Box label="Link" ready={ready}>
        {facts?.link ?? dash}
      </Box>
      <Box label="Skew" ready={ready}>
        {facts?.skew ?? dash}
      </Box>
      <Box label="TZ match" ready={ready}>
        {facts?.tzMatch ?? dash}
      </Box>
      <Box label="Motion" ready={ready}>
        {facts?.motion ?? dash}
      </Box>
      <Box label="Scheme" ready={ready}>
        {facts?.scheme ?? dash}
      </Box>
      <Box label="Bot" ready={ready}>
        {facts?.bot ?? dash}
      </Box>
    </>
  );
}
