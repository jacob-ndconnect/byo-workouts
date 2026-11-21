import { createId } from "@/core/ids";
import { measuresFromParsed } from "@/core/logic/logForm";
import { SCHEMA_VERSION } from "@/core/schemaVersion";
import type { Exercise, SetEntry, TrackingMode, Workout } from "@/core/types";
import { isIsoUtc, parseInstantToIsoUtc } from "@/core/time";

import { EXPORT_APP_NAME } from "./constants";
import { ExportFormatError } from "./errors";
import type { ExportDocument } from "./types";
import type {
  PwaDefaults,
  PwaExercise,
  PwaExport,
  PwaRoutine,
  PwaRoutineDay,
  PwaRoutineDayExercise,
  PwaWorkoutLog,
} from "./pwaTypes";

export type ConvertFromPwaOptions = {
  timeZone: string;
  exportedAt: string;
  /** Used when there are no workout logs (catalog row timestamps). */
  catalogTimestamp?: string;
};

export { lbToKg, milesToMeters, minutesToSeconds } from "@/core/logic/units";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toSettingsFields(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

function toValuesRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toPositiveInt(value: unknown): number | null {
  const n = toFiniteNumber(value);
  if (n === null || !Number.isInteger(n) || n < 1) return null;
  return n;
}

const PWA_COLLECTIONS = [
  "exercises",
  "routines",
  "routine_days",
  "routine_day_exercises",
  "workout_logs",
  "defaults",
] as const;

/** JSON from the old app's Settings → Export all data (no `schema_version`). */
export function isPwaExport(raw: unknown): boolean {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return false;
  const obj = raw as Record<string, unknown>;
  const schema = obj.schema_version;
  if (typeof schema === "string" && schema.trim() !== "") return false;
  return Array.isArray(obj.workout_logs) && Array.isArray(obj.exercises);
}

function assertPwaExport(raw: unknown): PwaExport {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ExportFormatError("PWA export must be a JSON object");
  }
  const obj = raw as Record<string, unknown>;
  for (const key of PWA_COLLECTIONS) {
    if (!Array.isArray(obj[key])) {
      throw new ExportFormatError(`PWA export.${key} must be an array`);
    }
  }
  return obj as unknown as PwaExport;
}

function assertTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    throw new ExportFormatError(`Invalid time zone: ${timeZone}`);
  }
}

function normalizeLoggedAt(value: string, logId: string): string {
  const iso = parseInstantToIsoUtc(value);
  if (!iso) {
    throw new ExportFormatError(
      `workout log ${logId}: logged_at is not a valid timestamp (${value})`,
    );
  }
  return iso;
}

export function calendarDayKey(isoUtc: string, timeZone: string): string {
  const iso = parseInstantToIsoUtc(isoUtc);
  if (!iso) {
    throw new ExportFormatError(`logged_at is not a valid ISO timestamp: ${isoUtc}`);
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function resolveTrackingMode(exercise: PwaExercise): TrackingMode {
  const type = exercise.type;
  const fields = toStringArray(exercise.logged_field_defs).map((f) => f.toLowerCase());
  const has = (name: string) => fields.includes(name);

  if (type === "machine") return "resistance";

  if (type === "cardio") {
    return has("distance") ? "distance" : "duration";
  }

  if (has("weight")) return "resistance";
  if (has("distance")) return "distance";
  if (has("time")) return "duration";
  if (has("reps")) return "bodyweight";
  return "resistance";
}

function earliestLogIso(logs: PwaWorkoutLog[]): string | null {
  let earliest: string | null = null;
  for (const log of logs) {
    const at = parseInstantToIsoUtc(log.logged_at);
    if (!at) continue;
    if (earliest === null || at < earliest) {
      earliest = at;
    }
  }
  return earliest;
}

function mapExercise(row: PwaExercise, timestamp: string): Exercise {
  return {
    id: row.id,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    extensions: {
      pwa: {
        type: row.type,
        logged_field_defs: toStringArray(row.logged_field_defs),
      },
    },
    name: row.name.trim(),
    tracking_mode: resolveTrackingMode(row),
    archived: row.archived,
    logged_fields: toStringArray(row.logged_field_defs),
    settings_fields: toSettingsFields(row.settings_fields),
  };
}

function mapRoutine(row: PwaRoutine, timestamp: string) {
  return {
    id: row.id,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    extensions: null,
    name: row.name.trim(),
    active: row.active,
    archived: row.archived,
  };
}

function mapRoutineDay(row: PwaRoutineDay, timestamp: string) {
  return {
    id: row.id,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    extensions: null,
    routine_id: row.routine_id,
    name: row.name.trim(),
    sort_order: row.sort_order,
  };
}

function mapRoutineDayExercise(row: PwaRoutineDayExercise, timestamp: string) {
  return {
    id: row.id,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    extensions: null,
    routine_day_id: row.routine_day_id,
    exercise_id: row.exercise_id,
    sort_order: row.sort_order,
  };
}

function mapDefaults(row: PwaDefaults, timestamp: string) {
  return {
    id: row.id,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    extensions: null,
    default_sets: row.default_sets,
    default_reps: row.default_reps,
  };
}

function measuresForLog(mode: TrackingMode, values: Record<string, unknown>): Pick<
  SetEntry,
  "weight_kg" | "reps" | "added_weight_kg" | "seconds" | "meters" | "extra_values"
> {
  return measuresFromParsed(mode, values);
}

function routineDayIdForLogs(
  logs: PwaWorkoutLog[],
  routineDayBySlot: Map<string, string>,
): string | null {
  let dayId: string | null = null;
  for (const log of logs) {
    if (!log.routine_day_exercise_id) return null;
    const mapped = routineDayBySlot.get(log.routine_day_exercise_id);
    if (!mapped) return null;
    if (dayId === null) {
      dayId = mapped;
      continue;
    }
    if (dayId !== mapped) return null;
  }
  return dayId;
}

function buildSetsForLog(
  log: PwaWorkoutLog,
  workoutId: string,
  exercise: PwaExercise,
  sortStart: number,
): { sets: SetEntry[]; nextSort: number } {
  const mode = resolveTrackingMode(exercise);
  const values = toValuesRecord(log.values);
  const measures = measuresForLog(mode, values);
  const repeat = toPositiveInt(values.sets) ?? 1;
  const loggedAt = log.logged_at;
  const sets: SetEntry[] = [];

  for (let i = 0; i < repeat; i++) {
    const id = createId(Date.parse(loggedAt) + i);
    sets.push({
      id,
      created_at: loggedAt,
      updated_at: loggedAt,
      deleted_at: null,
      extensions: {
        pwa: {
          log_id: log.id,
          logged_at: loggedAt,
          values,
        },
      },
      workout_id: workoutId,
      exercise_id: log.exercise_id,
      logged_at: loggedAt,
      routine_day_exercise_id: log.routine_day_exercise_id,
      sort_order: sortStart + i,
      tracking_mode: mode,
      ...measures,
      kind: null,
      note: null,
    });
  }

  return { sets, nextSort: sortStart + repeat };
}

export function convertFromPwa(raw: unknown, options: ConvertFromPwaOptions): ExportDocument {
  const pwa = assertPwaExport(raw);
  assertTimeZone(options.timeZone);

  if (!isIsoUtc(options.exportedAt)) {
    throw new ExportFormatError("exportedAt must be ISO 8601 UTC");
  }

  const catalogTimestamp =
    options.catalogTimestamp ??
    earliestLogIso(pwa.workout_logs) ??
    options.exportedAt;

  const workoutLogs = pwa.workout_logs.map((log) => ({
    ...log,
    logged_at: normalizeLoggedAt(log.logged_at, log.id),
  }));

  const exerciseById = new Map(pwa.exercises.map((row) => [row.id, row]));
  const routineDayBySlot = new Map(
    pwa.routine_day_exercises.map((row) => [row.id, row.routine_day_id]),
  );

  const exercises = pwa.exercises.map((row) => mapExercise(row, catalogTimestamp));
  const routines = pwa.routines.map((row) => mapRoutine(row, catalogTimestamp));
  const routine_days = pwa.routine_days.map((row) => mapRoutineDay(row, catalogTimestamp));
  const routine_day_exercises = pwa.routine_day_exercises.map((row) =>
    mapRoutineDayExercise(row, catalogTimestamp),
  );
  const defaults = pwa.defaults.map((row) => mapDefaults(row, catalogTimestamp));

  const logsByDay = new Map<string, PwaWorkoutLog[]>();
  for (const log of workoutLogs) {
    const day = calendarDayKey(log.logged_at, options.timeZone);
    const bucket = logsByDay.get(day) ?? [];
    bucket.push(log);
    logsByDay.set(day, bucket);
  }

  const workouts: Workout[] = [];
  const sets: SetEntry[] = [];

  const dayKeys = [...logsByDay.keys()].sort();
  for (const dayKey of dayKeys) {
    const dayLogs = [...(logsByDay.get(dayKey) ?? [])].sort(
      (a, b) => a.logged_at.localeCompare(b.logged_at) || a.id.localeCompare(b.id),
    );
    const startedAt = dayLogs[0]!.logged_at;
    const endedAt = dayLogs[dayLogs.length - 1]!.logged_at;
    const workoutId = createId(Date.parse(startedAt));
    const routineDayId = routineDayIdForLogs(dayLogs, routineDayBySlot);

    workouts.push({
      id: workoutId,
      created_at: startedAt,
      updated_at: endedAt,
      deleted_at: null,
      extensions: null,
      started_at: startedAt,
      ended_at: endedAt,
      routine_day_id: routineDayId,
      note: null,
    });

    let sortOrder = 0;
    for (const log of dayLogs) {
      const exercise = exerciseById.get(log.exercise_id);
      if (!exercise) {
        throw new ExportFormatError(`workout log references unknown exercise ${log.exercise_id}`);
      }
      const built = buildSetsForLog(log, workoutId, exercise, sortOrder);
      sets.push(...built.sets);
      sortOrder = built.nextSort;
    }
  }

  return {
    schema_version: SCHEMA_VERSION,
    app: EXPORT_APP_NAME,
    exported_at: options.exportedAt,
    exercises,
    routines,
    routine_days,
    routine_day_exercises,
    workouts,
    sets,
    defaults,
  };
}