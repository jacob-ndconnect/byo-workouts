const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** Current time as an ISO 8601 UTC string, the form stored on every record. */
export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

export function isIsoUtc(value: string): boolean {
  return ISO_UTC.test(value) && !Number.isNaN(Date.parse(value));
}
