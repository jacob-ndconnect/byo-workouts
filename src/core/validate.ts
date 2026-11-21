import { isIsoUtc } from "@/core/time";
import type {
  Collection,
  NewRecord,
  RecordBase,
  RecordPatch,
  Records,
  SetKind,
  TrackingMode,
} from "@/core/types";

type SystemKey = "id" | "created_at" | "updated_at" | "deleted_at";

export class InvalidRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRecordError";
  }
}

function asObject(input: unknown): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new InvalidRecordError("Record must be an object");
  }
  return input as Record<string, unknown>;
}

function present(input: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key) && input[key] !== undefined;
}

function readRequired(input: Record<string, unknown>, key: string): unknown {
  if (!present(input, key)) {
    throw new InvalidRecordError(`${key} is required`);
  }
  return input[key];
}

function readName(value: unknown, key: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new InvalidRecordError(`${key} must be a non-empty string`);
  }
  return value.trim();
}

function readId(value: unknown, key: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new InvalidRecordError(`${key} must be a non-empty string`);
  }
  return value;
}

function readNullableId(value: unknown, key: string): string | null {
  if (value === null) return null;
  return readId(value, key);
}

function readBoolean(value: unknown, key: string): boolean {
  if (typeof value !== "boolean") {
    throw new InvalidRecordError(`${key} must be a boolean`);
  }
  return value;
}

function readInteger(value: unknown, key: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InvalidRecordError(`${key} must be a non-negative integer`);
  }
  return value;
}

function readNullableInteger(value: unknown, key: string): number | null {
  if (value === null) return null;
  return readInteger(value, key);
}

function readNullableNumber(value: unknown, key: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new InvalidRecordError(`${key} must be a non-negative number or null`);
  }
  return value;
}

function readNote(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new InvalidRecordError("note must be a string or null");
  }
  return value;
}

function readTimestamp(value: unknown, key: string): string {
  if (typeof value !== "string" || !isIsoUtc(value)) {
    throw new InvalidRecordError(`${key} must be an ISO 8601 UTC timestamp`);
  }
  return value;
}

function readNullableTimestamp(value: unknown, key: string): string | null {
  if (value === null) return null;
  return readTimestamp(value, key);
}

function readTrackingMode(value: unknown): TrackingMode {
  if (
    value === "resistance" ||
    value === "bodyweight" ||
    value === "duration" ||
    value === "distance"
  ) {
    return value;
  }
  throw new InvalidRecordError(
    "tracking_mode must be resistance, bodyweight, duration, or distance",
  );
}

function readSetKind(value: unknown): SetKind | null {
  if (value === null) return null;
  if (
    value === "warmup" ||
    value === "work" ||
    value === "drop" ||
    value === "failure"
  ) {
    return value;
  }
  throw new InvalidRecordError("kind must be warmup, work, drop, failure, or null");
}

function readStringArray(value: unknown, key: string): string[] {
  if (!Array.isArray(value)) {
    throw new InvalidRecordError(`${key} must be an array of strings`);
  }
  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || entry.trim() === "") {
      throw new InvalidRecordError(`${key} entries must be non-empty strings`);
    }
    result.push(entry.trim());
  }
  return result;
}

function readExtraValues(value: unknown): Record<string, number | string> | null {
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidRecordError("extra_values must be an object or null");
  }
  const result: Record<string, number | string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      result[key] = entry;
      continue;
    }
    if (typeof entry === "string") {
      result[key] = entry;
      continue;
    }
    throw new InvalidRecordError(`extra_values.${key} must be a number or string`);
  }
  return Object.keys(result).length === 0 ? null : result;
}

function readSettings(value: unknown): Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidRecordError("settings_fields must be an object of strings");
  }
  const settings: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") {
      throw new InvalidRecordError(`settings_fields.${key} must be a string`);
    }
    settings[key] = entry;
  }
  return settings;
}

function readExtensions(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidRecordError("extensions must be an object or null");
  }
  try {
    return structuredClone(value) as Record<string, unknown>;
  } catch {
    throw new InvalidRecordError("extensions must be JSON data");
  }
}

function exerciseFields(input: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, unknown> = {};
  if (!partial || present(input, "name")) {
    fields.name = readName(partial ? input.name : readRequired(input, "name"), "name");
  }
  if (!partial || present(input, "tracking_mode")) {
    fields.tracking_mode = readTrackingMode(
      partial ? input.tracking_mode : readRequired(input, "tracking_mode"),
    );
  }
  if (!partial || present(input, "archived")) {
    fields.archived = readBoolean(
      partial ? input.archived : readRequired(input, "archived"),
      "archived",
    );
  }
  if (!partial || present(input, "logged_fields")) {
    fields.logged_fields = readStringArray(
      partial ? input.logged_fields : readRequired(input, "logged_fields"),
      "logged_fields",
    );
  }
  if (!partial || present(input, "settings_fields")) {
    fields.settings_fields = readSettings(
      partial ? input.settings_fields : readRequired(input, "settings_fields"),
    );
  }
  return fields;
}

function routineFields(input: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, unknown> = {};
  if (!partial || present(input, "name")) {
    fields.name = readName(partial ? input.name : readRequired(input, "name"), "name");
  }
  if (!partial || present(input, "active")) {
    fields.active = readBoolean(
      partial ? input.active : readRequired(input, "active"),
      "active",
    );
  }
  if (!partial || present(input, "archived")) {
    fields.archived = readBoolean(
      partial ? input.archived : readRequired(input, "archived"),
      "archived",
    );
  }
  return fields;
}

function routineDayFields(input: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, unknown> = {};
  if (!partial || present(input, "routine_id")) {
    fields.routine_id = readId(
      partial ? input.routine_id : readRequired(input, "routine_id"),
      "routine_id",
    );
  }
  if (!partial || present(input, "name")) {
    fields.name = readName(partial ? input.name : readRequired(input, "name"), "name");
  }
  if (!partial || present(input, "sort_order")) {
    fields.sort_order = readInteger(
      partial ? input.sort_order : readRequired(input, "sort_order"),
      "sort_order",
    );
  }
  return fields;
}

function routineDayExerciseFields(input: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, unknown> = {};
  if (!partial || present(input, "routine_day_id")) {
    fields.routine_day_id = readId(
      partial ? input.routine_day_id : readRequired(input, "routine_day_id"),
      "routine_day_id",
    );
  }
  if (!partial || present(input, "exercise_id")) {
    fields.exercise_id = readId(
      partial ? input.exercise_id : readRequired(input, "exercise_id"),
      "exercise_id",
    );
  }
  if (!partial || present(input, "sort_order")) {
    fields.sort_order = readInteger(
      partial ? input.sort_order : readRequired(input, "sort_order"),
      "sort_order",
    );
  }
  return fields;
}

function workoutFields(input: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, unknown> = {};
  if (!partial || present(input, "started_at")) {
    fields.started_at = readTimestamp(
      partial ? input.started_at : readRequired(input, "started_at"),
      "started_at",
    );
  }
  if (!partial || present(input, "ended_at")) {
    fields.ended_at = readNullableTimestamp(
      partial ? input.ended_at : readRequired(input, "ended_at"),
      "ended_at",
    );
  }
  if (!partial || present(input, "routine_day_id")) {
    fields.routine_day_id = readNullableId(
      partial ? input.routine_day_id : readRequired(input, "routine_day_id"),
      "routine_day_id",
    );
  }
  if (!partial || present(input, "note")) {
    fields.note = readNote(partial ? input.note : readRequired(input, "note"));
  }
  return fields;
}

function setFields(input: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, unknown> = {};
  const take = (key: string, read: (value: unknown) => unknown) => {
    if (!partial || present(input, key)) {
      fields[key] = read(partial ? input[key] : readRequired(input, key));
    }
  };
  take("workout_id", (value) => readId(value, "workout_id"));
  take("exercise_id", (value) => readId(value, "exercise_id"));
  take("routine_day_exercise_id", (value) =>
    readNullableId(value, "routine_day_exercise_id"),
  );
  take("sort_order", (value) => readInteger(value, "sort_order"));
  take("tracking_mode", readTrackingMode);
  take("weight_kg", (value) => readNullableNumber(value, "weight_kg"));
  take("reps", (value) => readNullableInteger(value, "reps"));
  take("added_weight_kg", (value) => readNullableNumber(value, "added_weight_kg"));
  take("seconds", (value) => readNullableNumber(value, "seconds"));
  take("meters", (value) => readNullableNumber(value, "meters"));
  take("kind", readSetKind);
  take("note", readNote);
  take("extra_values", readExtraValues);
  return fields;
}

function defaultsFields(input: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, unknown> = {};
  if (!partial || present(input, "default_sets")) {
    fields.default_sets = readInteger(
      partial ? input.default_sets : readRequired(input, "default_sets"),
      "default_sets",
    );
  }
  if (!partial || present(input, "default_reps")) {
    fields.default_reps = readInteger(
      partial ? input.default_reps : readRequired(input, "default_reps"),
      "default_reps",
    );
  }
  return fields;
}

function domainFields(
  collection: Collection,
  input: Record<string, unknown>,
  partial: boolean,
): Record<string, unknown> {
  switch (collection) {
    case "exercises":
      return exerciseFields(input, partial);
    case "routines":
      return routineFields(input, partial);
    case "routine_days":
      return routineDayFields(input, partial);
    case "routine_day_exercises":
      return routineDayExerciseFields(input, partial);
    case "workouts":
      return workoutFields(input, partial);
    case "sets":
      return setFields(input, partial);
    case "defaults":
      return defaultsFields(input, partial);
  }
}

export function sanitizeCreate<C extends Collection>(
  collection: C,
  input: NewRecord<Records[C]>,
): Omit<Records[C], SystemKey> {
  const raw = asObject(input);
  return {
    ...domainFields(collection, raw, false),
    extensions: readExtensions(present(raw, "extensions") ? raw.extensions : null),
  } as Omit<Records[C], SystemKey>;
}

export function sanitizePatch<C extends Collection>(
  collection: C,
  patch: RecordPatch<Records[C]>,
): RecordPatch<Records[C]> {
  const raw = asObject(patch);
  const fields = domainFields(collection, raw, true);
  if (present(raw, "extensions")) {
    fields.extensions = readExtensions(raw.extensions);
  }
  return fields as RecordPatch<Records[C]>;
}

export function cloneRecord<T extends RecordBase>(record: T): T {
  return structuredClone(record);
}

/** Validates a stored row including id and timestamps (import / replaceAll). */
export function sanitizeStoredRecord<C extends Collection>(
  collection: C,
  input: unknown,
): Records[C] {
  const raw = asObject(input);
  return {
    id: readId(readRequired(raw, "id"), "id"),
    created_at: readTimestamp(readRequired(raw, "created_at"), "created_at"),
    updated_at: readTimestamp(readRequired(raw, "updated_at"), "updated_at"),
    deleted_at: readNullableTimestamp(readRequired(raw, "deleted_at"), "deleted_at"),
    ...domainFields(collection, raw, false),
    extensions: readExtensions(present(raw, "extensions") ? raw.extensions : null),
  } as Records[C];
}
