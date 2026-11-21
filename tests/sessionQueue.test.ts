import { describe, expect, it } from "@jest/globals";

import {
  buildInitialQueue,
  buildWorkoutSections,
  completedExerciseIds,
  isCompletedForSession,
  requeueExercise,
  type SessionExercise,
} from "@/core/logic/sessionQueue";

const dayExercises: SessionExercise[] = [
  { exerciseId: "a", name: "A", routineDayExerciseId: "1" },
  { exerciseId: "b", name: "B", routineDayExerciseId: "2" },
];

describe("sessionQueue", () => {
  it("builds queue from planned exercises", () => {
    expect(buildInitialQueue(dayExercises, new Set())).toEqual(["a", "b"]);
    expect(buildInitialQueue(dayExercises, new Set(["a"]))).toEqual(["b"]);
  });

  it("re-queues at the front", () => {
    expect(requeueExercise(["b"], "a")).toEqual(["a", "b"]);
  });

  it("marks completion unless re-queued", () => {
    const done = completedExerciseIds([
      { id: "1", exerciseId: "a", name: "A", loggedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(isCompletedForSession("a", done, [])).toBe(true);
    expect(isCompletedForSession("a", done, ["a"])).toBe(false);
  });

  it("splits sections", () => {
    const done = completedExerciseIds([
      { id: "1", exerciseId: "a", name: "A", loggedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const sections = buildWorkoutSections(
      {
        dayId: "day",
        dayExercises,
        routineExercises: [
          { exerciseId: "c", name: "C", routineDayExerciseId: null },
        ],
        otherExercises: [{ exerciseId: "d", name: "D", routineDayExerciseId: null }],
        sessionLogs: [
          { id: "1", exerciseId: "a", name: "A", loggedAt: "2026-01-01T00:00:00.000Z" },
        ],
      },
      buildInitialQueue(dayExercises, done),
      done,
    );
    expect(sections.thisDay.map((e) => e.exerciseId)).toEqual(["b"]);
    expect(sections.completed).toHaveLength(1);
  });
});