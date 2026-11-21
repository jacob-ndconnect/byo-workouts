import type { Collection, Records } from "@/core/types";

import type { ReplaceAllPayload } from "./repository";

/** Assign one collection without breaking correlated collection types. */
export function setReplaceAllCollection<C extends Collection>(
  payload: ReplaceAllPayload,
  collection: C,
  rows: Records[C][],
): void {
  switch (collection) {
    case "exercises":
      payload.exercises = rows as ReplaceAllPayload["exercises"];
      return;
    case "routines":
      payload.routines = rows as ReplaceAllPayload["routines"];
      return;
    case "routine_days":
      payload.routine_days = rows as ReplaceAllPayload["routine_days"];
      return;
    case "routine_day_exercises":
      payload.routine_day_exercises = rows as ReplaceAllPayload["routine_day_exercises"];
      return;
    case "workouts":
      payload.workouts = rows as ReplaceAllPayload["workouts"];
      return;
    case "sets":
      payload.sets = rows as ReplaceAllPayload["sets"];
      return;
    case "defaults":
      payload.defaults = rows as ReplaceAllPayload["defaults"];
      return;
  }
}