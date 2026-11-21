/** Shape of the JSON from the PWA Settings → Export all data. */
export type PwaExercise = {
  id: string;
  name: string;
  type: string;
  archived: boolean;
  logged_field_defs: unknown;
  settings_fields: unknown;
};

export type PwaRoutine = {
  id: string;
  name: string;
  active: boolean;
  archived: boolean;
};

export type PwaRoutineDay = {
  id: string;
  routine_id: string;
  name: string;
  sort_order: number;
};

export type PwaRoutineDayExercise = {
  id: string;
  routine_day_id: string;
  exercise_id: string;
  sort_order: number;
};

export type PwaWorkoutLog = {
  id: string;
  exercise_id: string;
  logged_at: string;
  values: unknown;
  routine_day_exercise_id: string | null;
};

export type PwaDefaults = {
  id: string;
  default_sets: number;
  default_reps: number;
};

export type PwaExport = {
  exercises: PwaExercise[];
  routines: PwaRoutine[];
  routine_days: PwaRoutineDay[];
  routine_day_exercises: PwaRoutineDayExercise[];
  workout_logs: PwaWorkoutLog[];
  defaults: PwaDefaults[];
};