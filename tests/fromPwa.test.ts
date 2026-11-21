import { describe, expect, it } from "@jest/globals";

import { convertFromPwa, lbToKg, milesToMeters } from "@/export/fromPwa";
import type { PwaExport } from "@/export/pwaTypes";

const ZONE = "America/New_York";

describe("convertFromPwa", () => {
  it("groups same-day logs, converts units, and splits midnight", () => {
    const pwa: PwaExport = {
      exercises: [
        {
          id: "ex-machine",
          name: "Chest press",
          type: "machine",
          archived: false,
          logged_field_defs: ["weight", "sets", "reps"],
          settings_fields: {},
        },
        {
          id: "ex-cardio",
          name: "Treadmill",
          type: "cardio",
          archived: false,
          logged_field_defs: ["distance", "time"],
          settings_fields: {},
        },
      ],
      routines: [],
      routine_days: [],
      routine_day_exercises: [],
      workout_logs: [
        {
          id: "log-1",
          exercise_id: "ex-machine",
          logged_at: "2026-06-15T22:00:00.000Z",
          values: { weight: 60, sets: 4, reps: 10 },
          routine_day_exercise_id: null,
        },
        {
          id: "log-2",
          exercise_id: "ex-cardio",
          logged_at: "2026-06-15T23:00:00.000Z",
          values: { distance: 3.1, time: 28 },
          routine_day_exercise_id: null,
        },
        {
          id: "log-3",
          exercise_id: "ex-machine",
          logged_at: "2026-06-16T14:00:00.000Z",
          values: { weight: 65, sets: 1, reps: 8 },
          routine_day_exercise_id: null,
        },
      ],
      defaults: [{ id: "def-1", default_sets: 3, default_reps: 10 }],
    };

    const doc = convertFromPwa(pwa, {
      timeZone: ZONE,
      exportedAt: "2026-06-20T12:00:00.000Z",
    });

    expect(doc.workouts).toHaveLength(2);
    expect(doc.sets).toHaveLength(6);

    const dayOne = doc.workouts.find((w) => w.started_at === "2026-06-15T22:00:00.000Z");
    expect(dayOne?.ended_at).toBe("2026-06-15T23:00:00.000Z");

    const resistanceSets = doc.sets.filter((s) => s.tracking_mode === "resistance");
    expect(resistanceSets).toHaveLength(5);
    expect(resistanceSets.filter((s) => s.weight_kg === lbToKg(60))).toHaveLength(4);
    expect(resistanceSets.filter((s) => s.weight_kg === lbToKg(65))).toHaveLength(1);

    const cardio = doc.sets.find((s) => s.tracking_mode === "distance");
    expect(cardio?.meters).toBe(milesToMeters(3.1));
    expect(cardio?.seconds).toBe(1680);

    const nextDaySets = doc.sets.filter((s) => s.weight_kg === lbToKg(65));
    expect(nextDaySets).toHaveLength(1);
  });
});