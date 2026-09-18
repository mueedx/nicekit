import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const graph = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
