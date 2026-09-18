export function zoneTimeAt(timezone: string, atMs: number): string {
  try {
    return new Date(atMs).toLocaleString("en-GB", {
      timeZone: timezone,
      hour12: false,
    });
  } catch {
    return timezone;
  }
}
