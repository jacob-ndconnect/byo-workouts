import { describe, expect, it } from "@jest/globals";

import {
  pickHighlightedRoutineDay,
  pickNextRoutineDay,
  type RoutineDayRef,
} from "@/core/logic/nextRoutineDay";

const dayA: RoutineDayRef = { id: "day-a", name: "A", sort_order: 0 };
const dayB: RoutineDayRef = { id: "day-b", name: "B", sort_order: 1 };
const dayC: RoutineDayRef = { id: "day-c", name: "C", sort_order: 2 };

const twoDayRoutine = [dayA, dayB];
const threeDayRoutine = [dayA, dayB, dayC];

describe("pickNextRoutineDay", () => {
  it("returns the first day when there are no logs yet", () => {
    expect(pickNextRoutineDay(twoDayRoutine, null)).toEqual(dayA);
  });

  it("advances and wraps", () => {
    expect(pickNextRoutineDay(twoDayRoutine, dayA.id)).toEqual(dayB);
    expect(pickNextRoutineDay(twoDayRoutine, dayB.id)).toEqual(dayA);
    expect(pickNextRoutineDay(threeDayRoutine, dayC.id)).toEqual(dayA);
  });

  it("returns null for an empty routine", () => {
    expect(pickNextRoutineDay([], null)).toBeNull();
  });
});

describe("pickHighlightedRoutineDay", () => {
  it("prefers today's session day", () => {
    expect(pickHighlightedRoutineDay(twoDayRoutine, dayB.id, dayA.id)).toEqual(dayA);
  });
});