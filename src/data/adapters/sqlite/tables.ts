import type { Collection } from "@/core/types";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

import * as schema from "./schema";

export const collectionTables: { [C in Collection]: SQLiteTable } = {
  exercises: schema.exercises,
  routines: schema.routines,
  routine_days: schema.routineDays,
  routine_day_exercises: schema.routineDayExercises,
  workouts: schema.workouts,
  sets: schema.sets,
  defaults: schema.defaults,
};