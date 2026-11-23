import { describe, expect, it } from "@jest/globals";

import { nextFreshIds } from "@/components/workout/freshListIds";

describe("nextFreshIds", () => {
  it("does not treat the first list as newly added", () => {
    const first = nextFreshIds(null, ["squat", "bench"]);
    expect([...first.fresh]).toEqual([]);
    expect(first.key).toBe("squat\0bench");
  });

  it("marks only ids that were not already shown", () => {
    const next = nextFreshIds("squat\0bench", ["squat", "bench", "row"]);
    expect([...next.fresh]).toEqual(["row"]);
  });

  it("animates the first add after an empty list was actually shown", () => {
    const next = nextFreshIds("", ["row"]);
    expect([...next.fresh]).toEqual(["row"]);
  });
});
