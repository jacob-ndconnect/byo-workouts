/** Fields every stored record has. Deletes are soft so sync can see them. */
export type RecordBase = {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  /** Namespaced bag for fields this schema does not know. Null when empty. */
  extensions: Record<string, unknown> | null;
};

/** What a set for this exercise records. Copied onto each set at log time. */
export type TrackingMode =
  | "resistance"
  | "bodyweight"
  | "duration"
  | "distance";

/** Why a set was done. Null when the logger did not mark it. */
export type SetKind = "warmup" | "work" | "drop" | "failure";

export type Exercise = RecordBase & {
  name: string;
  tracking_mode: TrackingMode;
  archived: boolean;
  /**
   * Ordered log form fields. Empty means the default fields for `tracking_mode`.
   * Imported PWA defs are copied here from `extensions.pwa.logged_field_defs`.
   */
  logged_fields: string[];
  /** Machine setup that does not change set to set, such as seat or pin. */
  settings_fields: Record<string, string>;
};

export type Routine = RecordBase & {
  name: string;
  active: boolean;
  archived: boolean;
};

export type RoutineDay = RecordBase & {
  routine_id: string;
  name: string;
  sort_order: number;
};

export type RoutineDayExercise = RecordBase & {
  routine_day_id: string;
  exercise_id: string;
  sort_order: number;
};

/** One training session. Exercise work is stored as sets that point here. */
export type Workout = RecordBase & {
  started_at: string;
  ended_at: string | null;
  routine_day_id: string | null;
  note: string | null;
};

/**
 * One performed effort inside a workout. Measures that do not apply to
 * `tracking_mode` are null. The mode is stored here so editing the exercise
 * later does not rewrite history.
 */
export type SetEntry = RecordBase & {
  workout_id: string;
  exercise_id: string;
  routine_day_exercise_id: string | null;
  sort_order: number;
  tracking_mode: TrackingMode;
  weight_kg: number | null;
  reps: number | null;
  added_weight_kg: number | null;
  seconds: number | null;
  meters: number | null;
  kind: SetKind | null;
  note: string | null;
  /** Custom log fields such as incline. Null when there are none. */
  extra_values: Record<string, number | string> | null;
};

/** Prefill for a new resistance set. One row is enough; the id is still a normal record. */
export type Defaults = RecordBase & {
  default_sets: number;
  default_reps: number;
};

export type Records = {
  exercises: Exercise;
  routines: Routine;
  routine_days: RoutineDay;
  routine_day_exercises: RoutineDayExercise;
  workouts: Workout;
  sets: SetEntry;
  defaults: Defaults;
};

export type Collection = keyof Records;

export const COLLECTIONS: Collection[] = [
  "exercises",
  "routines",
  "routine_days",
  "routine_day_exercises",
  "workouts",
  "sets",
  "defaults",
];

type SystemKey = "id" | "created_at" | "updated_at" | "deleted_at";

/** Caller-supplied fields for a new record. The repository assigns id and timestamps. */
export type NewRecord<T extends RecordBase> = Omit<T, SystemKey | "extensions"> & {
  extensions?: Record<string, unknown> | null;
};

/** Fields a caller may change. Omitted keys stay as they are. */
export type RecordPatch<T extends RecordBase> = Partial<Omit<T, SystemKey>>;
