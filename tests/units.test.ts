import { describe, expect, it } from "@jest/globals";

import { kgToLb, lbToKg } from "@/core/logic/units";

describe("units", () => {
  it("round-trips pounds", () => {
    expect(kgToLb(lbToKg(135))).toBe(135);
  });
});