import type { Collection, RecordBase, Records } from "@/core/types";

function encodeJson(value: Record<string, unknown> | null): string | null {
  return value === null ? null : JSON.stringify(value);
}

function decodeJson(value: string | null): Record<string, unknown> | null {
  if (value === null) return null;
  return JSON.parse(value) as Record<string, unknown>;
}

function encodeBool(value: boolean): number {
  return value ? 1 : 0;
}

function decodeBool(value: number): boolean {
  return value !== 0;
}

type Row = Record<string, unknown>;

function baseFromRow(row: Row): RecordBase {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: (row.deleted_at as string | null) ?? null,
    extensions: decodeJson((row.extensions as string | null) ?? null),
  };
}

export function rowToRecord<C extends Collection>(
  collection: C,
  row: Row,
): Records[C] {
  const base = baseFromRow(row);
  switch (collection) {
    case "exercises":
      return {
        ...base,
        name: row.name as string,
        tracking_mode: row.tracking_mode as Records["exercises"]["tracking_mode"],
        archived: decodeBool(row.archived as number),
        logged_fields: JSON.parse(row.logged_fields as string) as string[],
        settings_fields: JSON.parse(row.settings_fields as string) as Record<string, string>,
      } as Records[C];
    case "routines":
      return {
        ...base,
        name: row.name as string,
        active: decodeBool(row.active as number),
        archived: decodeBool(row.archived as number),
      } as Records[C];
    case "routine_days":
      return {
        ...base,
        routine_id: row.routine_id as string,
        name: row.name as string,
        sort_order: row.sort_order as number,
      } as Records[C];
    case "routine_day_exercises":
      return {
        ...base,
        routine_day_id: row.routine_day_id as string,
        exercise_id: row.exercise_id as string,
        sort_order: row.sort_order as number,
      } as Records[C];
    case "workouts":
      return {
        ...base,
        started_at: row.started_at as string,
        ended_at: (row.ended_at as string | null) ?? null,
        routine_day_id: (row.routine_day_id as string | null) ?? null,
        note: (row.note as string | null) ?? null,
      } as Records[C];
    case "sets":
      return {
        ...base,
        workout_id: row.workout_id as string,
        exercise_id: row.exercise_id as string,
        logged_at: row.logged_at as string,
        routine_day_exercise_id: (row.routine_day_exercise_id as string | null) ?? null,
        sort_order: row.sort_order as number,
        tracking_mode: row.tracking_mode as Records["sets"]["tracking_mode"],
        weight_kg: (row.weight_kg as number | null) ?? null,
        reps: (row.reps as number | null) ?? null,
        added_weight_kg: (row.added_weight_kg as number | null) ?? null,
        seconds: (row.seconds as number | null) ?? null,
        meters: (row.meters as number | null) ?? null,
        kind: (row.kind as Records["sets"]["kind"]) ?? null,
        note: (row.note as string | null) ?? null,
        extra_values: decodeJson((row.extra_values as string | null) ?? null) as Record<
          string,
          number | string
        > | null,
      } as Records[C];
    case "defaults":
      return {
        ...base,
        default_sets: row.default_sets as number,
        default_reps: row.default_reps as number,
      } as Records[C];
  }
}

export function recordToRow<C extends Collection>(collection: C, record: Records[C]): Row {
  const base = {
    id: record.id,
    created_at: record.created_at,
    updated_at: record.updated_at,
    deleted_at: record.deleted_at,
    extensions: encodeJson(record.extensions),
  };
  switch (collection) {
    case "exercises": {
      const r = record as Records["exercises"];
      return {
        ...base,
        name: r.name,
        tracking_mode: r.tracking_mode,
        archived: encodeBool(r.archived),
        logged_fields: JSON.stringify(r.logged_fields),
        settings_fields: JSON.stringify(r.settings_fields),
      };
    }
    case "routines": {
      const r = record as Records["routines"];
      return {
        ...base,
        name: r.name,
        active: encodeBool(r.active),
        archived: encodeBool(r.archived),
      };
    }
    case "routine_days": {
      const r = record as Records["routine_days"];
      return {
        ...base,
        routine_id: r.routine_id,
        name: r.name,
        sort_order: r.sort_order,
      };
    }
    case "routine_day_exercises": {
      const r = record as Records["routine_day_exercises"];
      return {
        ...base,
        routine_day_id: r.routine_day_id,
        exercise_id: r.exercise_id,
        sort_order: r.sort_order,
      };
    }
    case "workouts": {
      const r = record as Records["workouts"];
      return {
        ...base,
        started_at: r.started_at,
        ended_at: r.ended_at,
        routine_day_id: r.routine_day_id,
        note: r.note,
      };
    }
    case "sets": {
      const r = record as Records["sets"];
      return {
        ...base,
        workout_id: r.workout_id,
        exercise_id: r.exercise_id,
        logged_at: r.logged_at,
        routine_day_exercise_id: r.routine_day_exercise_id,
        sort_order: r.sort_order,
        tracking_mode: r.tracking_mode,
        weight_kg: r.weight_kg,
        reps: r.reps,
        added_weight_kg: r.added_weight_kg,
        seconds: r.seconds,
        meters: r.meters,
        kind: r.kind,
        note: r.note,
        extra_values: encodeJson(r.extra_values),
      };
    }
    case "defaults": {
      const r = record as Records["defaults"];
      return {
        ...base,
        default_sets: r.default_sets,
        default_reps: r.default_reps,
      };
    }
  }
}