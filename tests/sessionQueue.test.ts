import { describe, expect, it } from "@jest/globals";

import {
  addToTodayQueue,
  buildInitialQueue,
  buildWorkoutSections,
  completedExerciseIds,
  isCompletedForSession,
  moveQueueItem,
  reconcileSessionQueue,
  removeFromTodayQueue,
  requeueExercise,
  sessionExerciseLookup,
  sessionProgress,
  type SessionExercise,
} from "@/core/logic/sessionQueue";

const dayExercises: SessionExercise[] = [
  { exerciseId: "a", name: "A", routineDayExerciseId: "1" },
  { exerciseId: "b", name: "B", routineDayExerciseId: "2" },
  { exerciseId: "c", name: "C", routineDayExerciseId: "3" },
];

describe("sessionQueue", () => {
  it("builds queue from planned exercises", () => {
    expect(buildInitialQueue(dayExercises, new Set())).toEqual(["a", "b", "c"]);
    expect(buildInitialQueue(dayExercises, new Set(["a"]))).toEqual(["b", "c"]);
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

  it("reconcile keeps order and drops logged ids", () => {
    const done = new Set(["a"]);
    const queue = ["c", "b"];
    expect(
      reconcileSessionQueue(dayExercises, done, queue, new Set(), new Set()),
    ).toEqual(["c", "b"]);
  });

  it("reconcile keeps re-queued logged ids", () => {
    const done = new Set(["a"]);
    const queue = ["a", "b"];
    expect(
      reconcileSessionQueue(dayExercises, done, queue, new Set(["a"]), new Set()),
    ).toEqual(["a", "b", "c"]);
  });

  it("reconcile does not restore removed ids", () => {
    const queue = ["a", "c"];
    const removed = new Set(["b"]);
    expect(
      reconcileSessionQueue(dayExercises, new Set(), queue, new Set(), removed),
    ).toEqual(["a", "c"]);
  });

  it("reconcile appends new planned pending at the end", () => {
    const queue = ["c"];
    expect(
      reconcileSessionQueue(dayExercises, new Set(), queue, new Set(), new Set()),
    ).toEqual(["c", "a", "b"]);
  });

  it("add and remove from today queue", () => {
    const added = addToTodayQueue(["a"], new Set(), "d");
    expect(added.queue).toEqual(["a", "d"]);
    const removed = removeFromTodayQueue(added.queue, added.removed, "a");
    expect(removed.queue).toEqual(["d"]);
    expect(removed.removed.has("a")).toBe(true);
  });

  it("move queue item swaps neighbors", () => {
    expect(moveQueueItem(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveQueueItem(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
    expect(moveQueueItem(["a", "b"], "a", "up")).toEqual(["a", "b"]);
  });

  it("session progress uses scope not just plan length", () => {
    const done = completedExerciseIds([
      { id: "1", exerciseId: "a", name: "A", loggedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const removed = new Set(["b"]);
    const progress = sessionProgress(dayExercises, ["c"], done, removed);
    expect(progress).toEqual({ completed: 1, total: 2 });
  });

  it("splits sections with queue-ordered this day", () => {
    const done = completedExerciseIds([
      { id: "1", exerciseId: "a", name: "A", loggedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const lists = {
      dayId: "day",
      dayExercises,
      routineExercises: [
        { exerciseId: "r", name: "R", routineDayExerciseId: null },
      ],
      otherExercises: [{ exerciseId: "d", name: "D", routineDayExerciseId: null }],
      sessionLogs: [
        { id: "1", exerciseId: "a", name: "A", loggedAt: "2026-01-01T00:00:00.000Z" },
      ],
    };
    const lookup = sessionExerciseLookup(lists);
    const queue = ["c", "b"];
    const sections = buildWorkoutSections(lists, queue, done, lookup);
    expect(sections.thisDay.map((e) => e.exerciseId)).toEqual(["c", "b"]);
    expect(sections.thisRoutine.map((e) => e.exerciseId)).toEqual(["r"]);
    expect(sections.other.map((e) => e.exerciseId)).toEqual(["d"]);
    expect(sections.completed).toHaveLength(1);
  });
});