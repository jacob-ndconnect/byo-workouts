import { describe, expect, it } from "@jest/globals";

import { formatSetHistoryLine, sortHistoryEntries } from "@/core/logic/history";
import { kgToLb, lbToKg } from "@/core/logic/units";
import type { Exercise, SetEntry } from "@/core/types";
import { createMemoryRepository } from "@/data/adapters/memory";
import { updateLoggedSet } from "@/features/history/historyData";

const LOGGED_AT = "2026-01-01T00:00:00.000Z";

function exercise(): Exercise {
  return {
    id: "exercise-1",
    created_at: LOGGED_AT,
    updated_at: LOGGED_AT,
    deleted_at: null,
    extensions: null,
    name: "Bench",
    tracking_mode: "resistance",
    archived: false,
    logged_fields: ["weight", "sets", "reps"],
    settings_fields: {},
  };
}

function set(partial: Partial<SetEntry> & Pick<SetEntry, "id" | "logged_at">): SetEntry {
  return {
    created_at: LOGGED_AT,
    updated_at: LOGGED_AT,
    deleted_at: null,
    extensions: null,
    workout_id: "workout-1",
    exercise_id: "exercise-1",
    routine_day_exercise_id: null,
    sort_order: 0,
    tracking_mode: "resistance",
    weight_kg: lbToKg(100),
    reps: 8,
    added_weight_kg: null,
    seconds: null,
    meters: null,
    kind: null,
    note: null,
    extra_values: null,
    ...partial,
  };
}

describe("history list", () => {
  it("formats a set in display units and skips the sets count", () => {
    const line = formatSetHistoryLine(exercise(), set({ id: "a", logged_at: LOGGED_AT }));
    expect(line).toBe(`Weight ${kgToLb(lbToKg(100))} lbs · Reps 8`);
  });

  it("sorts by date and by exercise name", () => {
    const entries = [
      { loggedAt: "2026-02-01T00:00:00.000Z", exerciseName: "Squat" },
      { loggedAt: "2026-03-01T00:00:00.000Z", exerciseName: "Bench" },
      { loggedAt: "2026-01-01T00:00:00.000Z", exerciseName: "Bench" },
    ];

    expect(sortHistoryEntries(entries, "date-desc").map((entry) => entry.loggedAt)).toEqual([
      "2026-03-01T00:00:00.000Z",
      "2026-02-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    ]);
    expect(sortHistoryEntries(entries, "exercise-asc").map((entry) => entry.exerciseName)).toEqual([
      "Bench",
      "Bench",
      "Squat",
    ]);
    expect(sortHistoryEntries(entries, "exercise-asc")[0]?.loggedAt).toBe(
      "2026-03-01T00:00:00.000Z",
    );
  });

  it("updates logged_at and measures and leaves created_at alone", async () => {
    const repo = createMemoryRepository({ now: () => LOGGED_AT });
    const createdExercise = await repo.create("exercises", {
      name: "Bench",
      tracking_mode: "resistance",
      archived: false,
      logged_fields: ["weight", "sets", "reps"],
      settings_fields: {},
    });
    const workout = await repo.create("workouts", {
      started_at: LOGGED_AT,
      ended_at: null,
      routine_day_id: null,
      note: null,
    });
    const created = await repo.create("sets", {
      workout_id: workout.id,
      exercise_id: createdExercise.id,
      logged_at: LOGGED_AT,
      routine_day_exercise_id: null,
      sort_order: 0,
      tracking_mode: "resistance",
      weight_kg: lbToKg(100),
      reps: 8,
      added_weight_kg: null,
      seconds: null,
      meters: null,
      kind: null,
      note: null,
      extra_values: null,
    });

    await updateLoggedSet(repo, {
      setId: created.id,
      rawValues: { weight: "110", reps: "6" },
      loggedAt: new Date("2026-02-02T15:04:00.000Z"),
    });

    const next = await repo.get("sets", created.id);
    expect(next?.created_at).toBe(created.created_at);
    expect(next?.logged_at).toBe("2026-02-02T15:04:00.000Z");
    expect(next?.reps).toBe(6);
    expect(next?.weight_kg).toBe(lbToKg(110));
  });
});
