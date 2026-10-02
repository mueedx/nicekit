import type { Metadata } from "next";
import { headers } from "next/headers";
import { WhoAmICard } from "@/components/WhoAmICard";
import { loadVisitor } from "@/lib/visitor";
import { recordPageVisit } from "@/lib/visits";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Who am I? · Nicekit",
  description:
    "Your public IP, a Cloudflare speed test, origin, weather, VPN guess, DNS resolver and browser — a live diagnostic card. Nothing identifying is stored.",
  alternates: { canonical: "/whoami" },
};

export default async function WhoAmIPage() {
  const visitor = await loadVisitor(await headers());
  const { visits, countryCodes } = await recordPageVisit(
    visitor.origin.countryCode,
  );
  // Server components may read the clock; the skew box measures the client
  // against this value. react-hooks/purity is render-purity for client
  // components and can't tell this is an async server component.
  // eslint-disable-next-line react-hooks/purity -- server component; the clock read is per-request by design
  const serverNow = Date.now();
  return (
    <WhoAmICard
      visitor={visitor}
      serverNow={serverNow}
      visits={visits}
      countryCodes={countryCodes}
    />
  );
}
