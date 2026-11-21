const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** Current time as an ISO 8601 UTC string, the form stored on every record. */
export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

export function isIsoUtc(value: string): boolean {
  return ISO_UTC.test(value) && !Number.isNaN(Date.parse(value));
}

/** Accepts `Z` or offset forms (e.g. Supabase `+00:00`) and returns canonical UTC `…Z`. */
export function parseInstantToIsoUtc(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

/** IANA zone from the device, or UTC when unavailable. */
export function deviceTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone?.trim() ? zone : "UTC";
  } catch {
    return "UTC";
  }
}
