import { describe, expect, it } from "@jest/globals";

import {
  planRoutineFormSave,
  planRoutineJsonSave,
  type AssembledRoutineDay,
} from "@/core/logic/routineEditor";
import type { Exercise } from "@/core/types";

const existingDays: AssembledRoutineDay[] = [
  {
    id: "day-a",
    name: "A",
    sort_order: 0,
    exercises: [
      {
        id: "slot-1",
        exercise_id: "ex-bench",
        exerciseName: "Bench",
        sort_order: 0,
      },
    ],
  },
];

const activeExercises: Exercise[] = [
  {
    id: "ex-bench",
    name: "Bench",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
    extensions: null,
    tracking_mode: "resistance",
    archived: false,
    logged_fields: [],
    settings_fields: {},
  },
];

describe("planRoutineFormSave", () => {
  it("soft-deletes removed days on form save", () => {
    const plan = planRoutineFormSave(existingDays, {
      name: "PPL",
      days: [],
    });
    expect(plan.deleteDayIds).toEqual(["day-a"]);
    expect(plan.deleteSlotIds).toContain("slot-1");
  });
});

describe("planRoutineJsonSave", () => {
  it("does not delete omitted days", () => {
    const { plan } = planRoutineJsonSave(
      existingDays,
      { name: "PPL", days: [] },
      activeExercises,
    );
    expect(plan.deleteDayIds).toHaveLength(0);
    expect(plan.warnings.some((w) => w.includes('Day "A"'))).toBe(true);
  });

  it("skips unknown exercise names with a warning", () => {
    const { plan } = planRoutineJsonSave(
      existingDays,
      {
        name: "PPL",
        days: [{ name: "A", exercises: ["Unknown lift", "Bench"] }],
      },
      activeExercises,
    );
    expect(plan.warnings.some((w) => w.includes("Unknown lift"))).toBe(true);
    expect(plan.days[0]?.exercises).toHaveLength(1);
    expect(plan.days[0]?.exercises[0]?.exerciseId).toBe("ex-bench");
  });
});