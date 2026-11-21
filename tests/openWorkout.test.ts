import { describe, expect, it } from "@jest/globals";

import { pickOpenWorkout } from "@/core/logic/openWorkout";
import type { Workout } from "@/core/types";

function workout(partial: Partial<Workout> & Pick<Workout, "id" | "started_at">): Workout {
  return {
    id: partial.id,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
    extensions: null,
    started_at: partial.started_at,
    ended_at: partial.ended_at ?? null,
    routine_day_id: partial.routine_day_id ?? "day-1",
    note: null,
  };
}

describe("pickOpenWorkout", () => {
  it("returns the latest open workout for the day", () => {
    const rows = [
      workout({ id: "w1", started_at: "2026-01-01T10:00:00.000Z", ended_at: "2026-01-01T11:00:00.000Z" }),
      workout({ id: "w2", started_at: "2026-01-02T10:00:00.000Z" }),
      workout({ id: "w3", started_at: "2026-01-02T12:00:00.000Z" }),
    ];
    expect(pickOpenWorkout(rows, "day-1")?.id).toBe("w3");
  });
});