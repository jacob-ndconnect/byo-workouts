import type { SetEntry, TrackingMode } from "@/core/types";

import { CANONICAL_LOG_FIELDS } from "./logFields";
import {
  kgToLb,
  lbToKg,
  metersToMiles,
  milesToMeters,
  minutesToSeconds,
  secondsToMinutes,
} from "./units";

export type GlobalLogDefaults = {
  defaultSets: number;
  defaultReps: number;
};

export const FALLBACK_LOG_DEFAULTS: GlobalLogDefaults = {
  defaultSets: 3,
  defaultReps: 10,
};

export function formatLogValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value;
  return String(value);
}

function displayValueForField(field: string, set: SetEntry): string | null {
  switch (field) {
    case "weight":
      return set.weight_kg === null ? null : String(kgToLb(set.weight_kg));
    case "reps":
      return set.reps === null ? null : String(set.reps);
    case "distance":
      return set.meters === null ? null : String(metersToMiles(set.meters));
    case "time":
      return set.seconds === null ? null : String(secondsToMinutes(set.seconds));
    case "added_weight":
      return set.added_weight_kg === null ? null : String(kgToLb(set.added_weight_kg));
    default:
      if (!set.extra_values) return null;
      return formatLogValue(set.extra_values[field]);
  }
}

export function setToFormValues(
  fields: string[],
  set: SetEntry | null,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of fields) {
    if (field === "sets") {
      continue;
    }
    const raw = set ? displayValueForField(field, set) : null;
    result[field] = raw ?? "";
  }
  return result;
}

export function buildLogFormValues(
  fields: string[],
  lastSet: SetEntry | null,
  defaults: GlobalLogDefaults,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const field of fields) {
    const fromLast = lastSet ? displayValueForField(field, lastSet) : null;
    if (fromLast !== null && fromLast !== "") {
      result[field] = fromLast;
      continue;
    }
    if (field === "sets") {
      result[field] = String(defaults.defaultSets);
      continue;
    }
    if (field === "reps") {
      result[field] = String(defaults.defaultReps);
      continue;
    }
    result[field] = "";
  }

  return result;
}

export function parseLogFormValues(
  fields: string[],
  raw: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const value = raw[field]?.trim();
    if (!value) continue;
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && value !== "") {
      result[field] = asNumber;
      continue;
    }
    result[field] = value;
  }
  return result;
}

type SetMeasures = Pick<
  SetEntry,
  "weight_kg" | "reps" | "added_weight_kg" | "seconds" | "meters" | "extra_values"
>;

export function measuresFromParsed(
  mode: TrackingMode,
  parsed: Record<string, unknown>,
): SetMeasures {
  const empty: SetMeasures = {
    weight_kg: null,
    reps: null,
    added_weight_kg: null,
    seconds: null,
    meters: null,
    extra_values: null,
  };

  const extras: Record<string, number | string> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (key === "sets") continue;
    if (CANONICAL_LOG_FIELDS.has(key)) {
      const num = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(num)) continue;
      switch (key) {
        case "weight":
          empty.weight_kg = lbToKg(num);
          break;
        case "reps":
          empty.reps = Math.trunc(num);
          break;
        case "added_weight":
          empty.added_weight_kg = lbToKg(num);
          break;
        case "distance":
          empty.meters = milesToMeters(num);
          break;
        case "time":
          empty.seconds = minutesToSeconds(num);
          break;
      }
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      extras[key] = value;
    } else if (typeof value === "string" && value.trim() !== "") {
      extras[key] = value.trim();
    }
  }

  empty.extra_values = Object.keys(extras).length > 0 ? extras : null;
  void mode;
  return empty;
}

export function repeatCount(parsed: Record<string, unknown>): number {
  const sets = parsed.sets;
  if (typeof sets === "number" && Number.isFinite(sets)) {
    const n = Math.trunc(sets);
    return n >= 1 ? n : 1;
  }
  return 1;
}

export function formatExerciseHeroValue(field: string, displayValue: string): string {
  if (displayValue === "Not logged yet" || displayValue === "—") {
    return displayValue;
  }
  if (field === "weight" || field === "added_weight") {
    return `${displayValue} lbs`;
  }
  if (field === "distance") {
    return `${displayValue} mi`;
  }
  if (field === "time") {
    return `${displayValue} min`;
  }
  return displayValue;
}

export function heroDisplayFromSet(
  heroField: string | null,
  set: SetEntry | null,
): string {
  if (!heroField || !set) return "Not logged yet";
  const value = displayValueForField(heroField, set);
  if (value === null || value === "") return "—";
  return formatExerciseHeroValue(heroField, value);
}