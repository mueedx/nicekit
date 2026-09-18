import type { OrgType } from "./types";

const ORG_LABEL = {
  hosting: "Hosting",
  isp: "ISP",
  education: "Education",
  government: "Government",
} as const satisfies Record<OrgType, string>;

export function orgTypeLabel(type: OrgType): string {
  return ORG_LABEL[type];
}

export function classifyOrgType(input: {
  datacenter: boolean;
  names: readonly (string | null)[];
}): OrgType | null {
  const blob = input.names
    .filter((name) => name !== null)
    .join(" ")
    .toLowerCase();
  if (
    /(university|universit[aà]|college|\.edu\b|institute of|school of)/.test(
      blob,
    )
  ) {
    return "education";
  }
  if (
    /(government|\.gov\b|gouv\.|ministry|municipal|federal agency)/.test(blob)
  ) {
    return "government";
  }
  if (input.datacenter) return "hosting";
  if (blob.length > 0) return "isp";
  return null;
}
