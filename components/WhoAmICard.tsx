"use client";

import { countryLabel, flagEmoji, mapsUrl } from "@/lib/origin";
import { orgTypeLabel } from "@/lib/org-type";
import type {
  OriginRecord,
  RequestFacts,
  VisitorPage,
  WeatherRecord,
} from "@/lib/types";
import { zoneTimeAt } from "@/lib/zone-time";
import { AdvancedFacts } from "./AdvancedFacts";
import { BrowserSection } from "./BrowserSection";
import { ClientHintFacts } from "./ClientHintFacts";
import { DnsFacts } from "./DnsFacts";
import { dash, FactBox, FactGrid } from "./FactRow";
import { HostnameLine } from "./HostnameLine";
import { Panel } from "./Panel";
import { SectionKicker } from "./SectionKicker";
import {
  AdvancedSpeedFacts,
  SpeedTest,
  SpeedTestProvider,
} from "./SpeedTest";
import { ScrollReveal } from "./ScrollReveal";
import { VpnFacts } from "./VpnFacts";

const sectionClass = "border-t border-border px-5 py-6";

const PRIVACY =
  "No user trace and no identifying info is saved.";
const PRIVACY_SHORT = "Nothing identifying is saved.";

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="link-muted hover:text-accent"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}

function OriginBoxes({
  origin,
  serverNow,
}: {
  origin: OriginRecord;
  serverNow: number;
}) {
  const map = mapsUrl(origin);
  const city = origin.city ?? dash;
  const country = countryLabel(origin) ?? dash;

  return (
    <>
      <FactBox label="City">
        {map && origin.city ? (
          <a
            className="underline decoration-accent underline-offset-2"
            href={map}
            target="_blank"
            rel="noreferrer"
            title={
              origin.latitude !== null && origin.longitude !== null
                ? `${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}`
                : undefined
            }
          >
            {city}
          </a>
        ) : (
          city
        )}
      </FactBox>
      <FactBox label="Postcode">{origin.postcode ?? dash}</FactBox>
      <FactBox label="Region">{origin.region ?? dash}</FactBox>
      <FactBox label="Country">{country}</FactBox>
      <FactBox label="Timezone">
        {origin.timezone ? (
          <span
            className="cursor-help underline decoration-accent decoration-dashed underline-offset-2"
            title={zoneTimeAt(origin.timezone, serverNow)}
          >
            {origin.timezone}
          </span>
        ) : (
          dash
        )}
      </FactBox>
      <FactBox label="Network">{origin.network ?? dash}</FactBox>
      <FactBox label="Provider">{origin.provider ?? dash}</FactBox>
      <DnsFacts />
    </>
  );
}

function WeatherSection({ weather }: { weather: WeatherRecord }) {
  const temperature =
    weather.temperatureC === null
      ? dash
      : `${weather.temperatureC.toFixed(1)} °C`;
  const humidity =
    weather.humidity === null ? dash : `${Math.round(weather.humidity)}%`;
  const wind =
    weather.windKmh === null ? dash : `${weather.windKmh.toFixed(1)} km/h`;

  return (
    <section className={sectionClass}>
      <div className="flex items-center justify-between gap-3">
        <SectionKicker number="02" title="Weather" />
        <SourceLink href="https://open-meteo.com/" label={weather.source} />
      </div>
      <FactGrid>
        <FactBox label="Condition">{weather.condition ?? dash}</FactBox>
        <FactBox label="Temperature">{temperature}</FactBox>
        <FactBox label="Humidity">{humidity}</FactBox>
        <FactBox label="Wind">{wind}</FactBox>
      </FactGrid>
    </section>
  );
}

function RequestBoxes({ request }: { request: RequestFacts }) {
  return (
    <>
      {request.browser ? (
        <FactBox label="Browser">{request.browser}</FactBox>
      ) : null}
      {request.os ? <FactBox label="OS">{request.os}</FactBox> : null}
      {request.device ? (
        <FactBox label="Device">{request.device}</FactBox>
      ) : null}
      <ClientHintFacts
        arch={request.arch}
        bitness={request.bitness}
        model={request.model}
      />
    </>
  );
}

function visitLabel(visits: number | null): string {
  if (visits === null) return `${dash} visits`;
  const n = visits.toLocaleString("en-GB");
  return `${n} ${visits === 1 ? "visit" : "visits"}`;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function VisitorCountryFlags({ codes }: { codes: string[] }) {
  if (codes.length === 0) return null;

  return (
    <p
      className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start"
      aria-label="Countries that have visited"
    >
      {codes.map((code) => {
        const flag = flagEmoji(code);
        if (!flag) return null;
        return (
          <span
            key={code}
            title={regionNames.of(code) ?? code}
            className="font-sans text-xl leading-none"
          >
            {flag}
          </span>
        );
      })}
    </p>
  );
}

export function WhoAmICard({
  visitor,
  serverNow,
  visits,
  countryCodes,
}: {
  visitor: VisitorPage;
  serverNow: number;
  visits: number | null;
  countryCodes: string[];
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 lg:px-8">
      <div className="mx-auto mb-4 w-full max-w-2xl">
        <h1 className="label-mono text-muted">Who am I?</h1>
      </div>
      <SpeedTestProvider>
        <Panel>
          <div className="px-5 py-6">
            <p
              dir="ltr"
              className="break-words text-center font-medium tracking-tight text-[2.5rem] leading-none sm:text-[3rem]"
            >
              {visitor.ip}
            </p>
            <HostnameLine />
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-end">
                <SourceLink
                  href="https://speed.cloudflare.com/"
                  label="speed.cloudflare.com"
                />
              </div>
              <SpeedTest />
            </div>
          </div>
          <ScrollReveal>
            <section className={sectionClass}>
              <div className="flex items-center justify-between gap-3">
                <SectionKicker number="01" title="Origin" />
                <SourceLink
                  href="https://ipwho.is/"
                  label={visitor.origin.source}
                />
              </div>
              <FactGrid>
                <OriginBoxes origin={visitor.origin} serverNow={serverNow} />
              </FactGrid>
            </section>
          </ScrollReveal>
          <ScrollReveal>
            <WeatherSection weather={visitor.weather} />
          </ScrollReveal>
          <ScrollReveal>
            <VpnFacts />
          </ScrollReveal>
          <ScrollReveal>
            <BrowserSection />
          </ScrollReveal>
          <ScrollReveal>
            <details className={sectionClass}>
              <summary className="cursor-pointer [&_h2]:inline">
                <SectionKicker number="05" title="Advanced" />
              </summary>
              <FactGrid>
                <FactBox label="ASN">{visitor.origin.asn ?? dash}</FactBox>
                <FactBox label="Type">
                  {visitor.origin.orgType
                    ? orgTypeLabel(visitor.origin.orgType)
                    : dash}
                </FactBox>
                <RequestBoxes request={visitor.request} />
                <AdvancedSpeedFacts />
                <AdvancedFacts
                  ip={visitor.ip}
                  originTimezone={visitor.origin.timezone}
                  serverNow={serverNow}
                />
              </FactGrid>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                {PRIVACY_SHORT}
              </p>
            </details>
          </ScrollReveal>
          <footer className={`${sectionClass} text-[13px] text-muted`}>
            <div className="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 text-center sm:justify-between sm:text-start">
              <p className="font-mono tracking-[0.14em]">
                <span aria-hidden="true" className="select-none">
                  ${" "}
                </span>
                <span className="select-all">curl {visitor.host}</span>
              </p>
              <p className="font-mono tracking-[0.14em]">{visitLabel(visits)}</p>
            </div>
            <VisitorCountryFlags codes={countryCodes} />
            <p className="mt-3 text-center sm:text-start">{PRIVACY}</p>
          </footer>
        </Panel>
      </SpeedTestProvider>
    </main>
  );
}
