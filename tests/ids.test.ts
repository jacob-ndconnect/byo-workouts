import { describe, expect, it } from "@jest/globals";

import { createId, isUuidV7 } from "@/core/ids";

describe("createId", () => {
  it("mints a version-7 uuid that sorts by time", () => {
    const earlier = createId(Date.parse("2026-01-01T00:00:00.000Z"));
    const later = createId(Date.parse("2026-01-01T00:00:01.000Z"));

    expect(isUuidV7(earlier)).toBe(true);
    expect(isUuidV7(later)).toBe(true);
    expect(earlier < later).toBe(true);
  });
});
