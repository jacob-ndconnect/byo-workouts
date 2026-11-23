import { describe, expect, it } from "@jest/globals";

import {
  exerciseRecordFieldsFromForm,
  normalizeExerciseForm,
  planExercisesJsonSave,
  resolveTrackingModeFromPwaType,
} from "@/core/logic/exerciseLibrary";
import type { Exercise } from "@/core/types";

function stubExercise(overrides: Partial<Exercise> & { id: string; name: string }): Exercise {
  return {
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
    extensions: { pwa: { type: "other", logged_field_defs: ["time"] } },
    tracking_mode: "duration",
    archived: false,
    logged_fields: ["time"],
    settings_fields: {},
    ...overrides,
  };
}

describe("resolveTrackingModeFromPwaType", () => {
  it("maps machine to resistance", () => {
    expect(resolveTrackingModeFromPwaType("machine", ["weight", "sets", "reps"])).toBe("resistance");
  });

  it("maps cardio with distance to distance", () => {
    expect(resolveTrackingModeFromPwaType("cardio", ["distance", "time"])).toBe("distance");
  });
});

describe("normalizeExerciseForm", () => {
  it("locks machine logged fields", () => {
    const normalized = normalizeExerciseForm({
      name: "Leg press",
      type: "machine",
      loggedFieldDefs: ["time"],
      settingsFields: {},
    });
    const fields = exerciseRecordFieldsFromForm(normalized, false, null);
    expect(fields.tracking_mode).toBe("resistance");
    expect(fields.logged_fields).toEqual(["weight", "sets", "reps"]);
  });
});

describe("planExercisesJsonSave", () => {
  it("warns when an existing name is omitted", () => {
    const scoped = [stubExercise({ id: "a", name: "Plank" })];
    const { mutations, warnings } = planExercisesJsonSave([], scoped, false);
    expect(mutations).toHaveLength(0);
    expect(warnings.some((w) => w.includes("Plank"))).toBe(true);
  });

  it("plans create for new json names", () => {
    const { mutations } = planExercisesJsonSave(
      [
        {
          name: "New move",
          type: "other",
          logged_field_defs: ["reps"],
          settings_fields: {},
          archived: false,
        },
      ],
      [],
      false,
    );
    expect(mutations).toEqual([{ action: "create", entry: expect.objectContaining({ name: "New move" }) }]);
  });
});