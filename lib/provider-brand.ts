function isTechnicalPool(value: string): boolean {
  return /\b(pool|bras)\b/i.test(value);
}

function isPtcl(blob: string): boolean {
  return (
    /pakistan telecommunication/i.test(blob) ||
    /\bptcl\b/i.test(blob) ||
    /\bAS17557\b/i.test(blob)
  );
}

export function displayProvider(parts: {
  provider: string | null;
  asn: string | null;
  names: readonly (string | null)[];
}): string | null {
  const candidates = [parts.provider, ...parts.names, parts.asn].filter(
    (value): value is string => value !== null && value.length > 0,
  );

  const blob = candidates.join(" ");
  if (isPtcl(blob)) return "PTCL";

  const clean = candidates.find((value) => !isTechnicalPool(value));
  return clean ?? parts.provider;
}
