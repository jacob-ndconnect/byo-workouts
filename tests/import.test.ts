import { describe, expect, it } from "@jest/globals";

import { parseImportJson } from "@/export/document";
import type { PwaExport } from "@/export/pwaTypes";

describe("parseImportJson", () => {
  it("converts a PWA export without schema_version", () => {
    const pwa: PwaExport = {
      exercises: [
        {
          id: "ex-1",
          name: "Press",
          type: "machine",
          archived: false,
          logged_field_defs: ["weight", "sets", "reps"],
          settings_fields: {},
        },
      ],
      routines: [],
      routine_days: [],
      routine_day_exercises: [],
      workout_logs: [
        {
          id: "log-1",
          exercise_id: "ex-1",
          logged_at: "2026-06-15T18:00:00+00:00",
          values: { weight: 100, sets: 1, reps: 5 },
          routine_day_exercise_id: null,
        },
      ],
      defaults: [{ id: "def-1", default_sets: 3, default_reps: 10 }],
    };

    const doc = parseImportJson(JSON.stringify(pwa), {
      timeZone: "UTC",
      exportedAt: "2026-06-20T12:00:00.000Z",
    });
    expect(doc.schema_version).toBe("1.2");
    expect(doc.workouts).toHaveLength(1);
    expect(doc.sets).toHaveLength(1);
  });
});