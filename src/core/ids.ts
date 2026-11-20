const HEX = "0123456789abcdef";

/**
 * UUIDv7 (time-ordered). Ids minted in the same millisecond are not ordered
 * against each other; a later millisecond always sorts after an earlier one.
 */
export function createId(nowMs: number = Date.now()): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const timestamp = Math.max(0, Math.floor(nowMs));
  bytes[0] = Math.floor(timestamp / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(timestamp / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(timestamp / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(timestamp / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(timestamp / 2 ** 8) & 0xff;
  bytes[5] = timestamp & 0xff;
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => HEX[byte >> 4] + HEX[byte & 0x0f]).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isUuidV7(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
    id,
  );
}
