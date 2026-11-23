import type { Exercise, TrackingMode } from "@/core/types";

const RESISTANCE_DEFAULT = ["weight", "sets", "reps"] as const;
const BODYWEIGHT_DEFAULT = ["sets", "reps"] as const;
const DURATION_DEFAULT = ["time"] as const;
const DISTANCE_DEFAULT = ["distance", "time"] as const;

export const CANONICAL_LOG_FIELDS = new Set([
  "weight",
  "sets",
  "reps",
  "distance",
  "time",
  "added_weight",
]);

export function isPwaMachineExercise(exercise: Exercise): boolean {
  const pwa = exercise.extensions?.pwa;
  if (!pwa || typeof pwa !== "object") return false;
  return (pwa as { type?: unknown }).type === "machine";
}

export function defaultLoggedFields(mode: TrackingMode): string[] {
  switch (mode) {
    case "resistance":
      return [...RESISTANCE_DEFAULT];
    case "bodyweight":
      return [...BODYWEIGHT_DEFAULT];
    case "duration":
      return [...DURATION_DEFAULT];
    case "distance":
      return [...DISTANCE_DEFAULT];
  }
}

/** Form fields shown when logging this exercise. */
export function resolveLoggedFields(exercise: Exercise): string[] {
  if (isPwaMachineExercise(exercise)) {
    return [...RESISTANCE_DEFAULT];
  }
  if (exercise.logged_fields.length > 0) {
    return exercise.logged_fields;
  }
  return defaultLoggedFields(exercise.tracking_mode);
}

export function heroFieldName(fields: string[], exercise: Exercise): string | null {
  if (isPwaMachineExercise(exercise)) return "weight";
  return fields[0] ?? null;
}

/** Turns a stored key into a label. `seat_position` reads as "Seat position". */
export function formatFieldLabel(field: string): string {
  if (!field) return field;
  const words = field.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}