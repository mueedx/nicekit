import { WhoAmICard } from "@/components/WhoAmICard";
import { loadVisitor } from "@/lib/visitor";
import { recordPageVisit } from "@/lib/visits";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
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
