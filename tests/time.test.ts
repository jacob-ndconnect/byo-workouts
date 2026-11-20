import { describe, expect, it } from "@jest/globals";

import { isIsoUtc, nowIso } from "@/core/time";

describe("nowIso", () => {
  it("formats a UTC timestamp", () => {
    const value = nowIso(new Date("2026-01-01T00:00:00.000Z"));
    expect(value).toBe("2026-01-01T00:00:00.000Z");
    expect(isIsoUtc(value)).toBe(true);
    expect(isIsoUtc("2026-01-01")).toBe(false);
  });
});
