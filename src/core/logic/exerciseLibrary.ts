import type { Exercise, TrackingMode } from "@/core/types";

export type PwaExerciseType = "machine" | "other" | "cardio";

export const MACHINE_LOGGED_FIELDS = ["weight", "sets", "reps"] as const;
export const CARDIO_LOGGED_FIELDS = ["distance", "time"] as const;

export type ExerciseFormInput = {
  name: string;
  type: PwaExerciseType;
  loggedFieldDefs: string[];
  settingsFields: Record<string, string>;
};

/** Human-meaningful fields — PWA JSON shape. */
export type ExerciseJson = {
  name: string;
  type: PwaExerciseType;
  logged_field_defs: string[];
  settings_fields: Record<string, string>;
  archived: boolean;
};

export function isPwaExerciseType(value: unknown): value is PwaExerciseType {
  return value === "machine" || value === "other" || value === "cardio";
}

export function pwaTypeFromExercise(exercise: Exercise): PwaExerciseType {
  const pwa = exercise.extensions?.pwa;
  if (pwa && typeof pwa === "object" && "type" in pwa) {
    const type = (pwa as { type?: unknown }).type;
    if (isPwaExerciseType(type)) return type;
  }
  if (exercise.tracking_mode === "distance" || exercise.tracking_mode === "duration") {
    return "cardio";
  }
  if (exercise.tracking_mode === "resistance" && exercise.logged_fields.length === 3) {
    return "machine";
  }
  return "other";
}

export function exerciseKindLabel(type?: PwaExerciseType | null, capitalize = false): string {
  if (type === "machine") return capitalize ? "Machine" : "machine";
  if (type === "cardio") return capitalize ? "Cardio" : "cardio";
  return capitalize ? "Exercise" : "exercise";
}

export function resolveTrackingModeFromPwaType(
  type: PwaExerciseType,
  loggedFieldDefs: string[],
): TrackingMode {
  const fields = loggedFieldDefs.map((f) => f.toLowerCase());
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

export function toExerciseJson(exercise: Exercise): ExerciseJson {
  const type = pwaTypeFromExercise(exercise);
  return {
    name: exercise.name,
    type,
    logged_field_defs:
      type === "machine" ? [...MACHINE_LOGGED_FIELDS] : [...exercise.logged_fields],
    settings_fields: { ...exercise.settings_fields },
    archived: exercise.archived,
  };
}

export function mergePwaExtensions(
  existing: Exercise["extensions"],
  type: PwaExerciseType,
  loggedFieldDefs: string[],
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...existing }
      : {};
  return {
    ...base,
    pwa: {
      type,
      logged_field_defs: loggedFieldDefs,
    },
  };
}

export type NormalizedExerciseForm = {
  name: string;
  type: PwaExerciseType;
  loggedFieldDefs: string[];
  settingsFields: Record<string, string>;
};

export function normalizeExerciseForm(input: ExerciseFormInput): NormalizedExerciseForm {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  const settingsFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.settingsFields)) {
    const trimmedKey = key.trim();
    if (trimmedKey) settingsFields[trimmedKey] = value;
  }

  if (input.type === "machine") {
    return {
      name,
      type: "machine",
      loggedFieldDefs: [...MACHINE_LOGGED_FIELDS],
      settingsFields,
    };
  }

  if (!isPwaExerciseType(input.type)) {
    throw new Error("Type must be machine, other, or cardio");
  }

  const loggedFieldDefs = input.loggedFieldDefs.map((field) => field.trim()).filter(Boolean);
  if (loggedFieldDefs.length === 0) {
    throw new Error("At least one logged field is required for custom exercises");
  }

  return { name, type: input.type, loggedFieldDefs, settingsFields };
}

export function exerciseRecordFieldsFromForm(
  normalized: NormalizedExerciseForm,
  archived: boolean,
  existingExtensions: Exercise["extensions"],
): Pick<Exercise, "name" | "tracking_mode" | "archived" | "logged_fields" | "settings_fields" | "extensions"> {
  return {
    name: normalized.name,
    tracking_mode: resolveTrackingModeFromPwaType(normalized.type, normalized.loggedFieldDefs),
    archived,
    logged_fields: normalized.loggedFieldDefs,
    settings_fields: normalized.settingsFields,
    extensions: mergePwaExtensions(existingExtensions, normalized.type, normalized.loggedFieldDefs),
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toSettingsFields(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "string") out[key] = val;
  }
  return out;
}

export function normalizeExerciseJsonEntry(entry: unknown): ExerciseJson {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error("Each exercise must be a JSON object");
  }

  const record = entry as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) throw new Error("Each exercise must have a name");

  const type = record.type;
  if (!isPwaExerciseType(type)) {
    throw new Error(`"${name}": type must be "machine", "other", or "cardio"`);
  }

  if (typeof record.archived !== "boolean") {
    throw new Error(`"${name}": archived must be true or false`);
  }

  const settingsFields = toSettingsFields(record.settings_fields);
  const loggedFieldDefs = toStringArray(record.logged_field_defs).map((f) => f.trim());

  if (type === "machine") {
    return {
      name,
      type: "machine",
      logged_field_defs: [...MACHINE_LOGGED_FIELDS],
      settings_fields: settingsFields,
      archived: record.archived,
    };
  }

  const customFields = loggedFieldDefs.filter(Boolean);
  if (customFields.length === 0) {
    if (type === "cardio") {
      return {
        name,
        type: "cardio",
        logged_field_defs: [...CARDIO_LOGGED_FIELDS],
        settings_fields: settingsFields,
        archived: record.archived,
      };
    }
    throw new Error(`"${name}": at least one logged field is required`);
  }

  return {
    name,
    type,
    logged_field_defs: customFields,
    settings_fields: settingsFields,
    archived: record.archived,
  };
}

export function parseExercisesJsonText(jsonText: string): ExerciseJson[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("JSON must be an array of exercises");
  }
  return parsed.map((item) => normalizeExerciseJsonEntry(item));
}

export type ExerciseJsonMutation =
  | { action: "create"; entry: ExerciseJson }
  | { action: "update"; id: string; entry: ExerciseJson };

export type PlanExercisesJsonSaveResult = {
  mutations: ExerciseJsonMutation[];
  warnings: string[];
};

/** Match PWA saveExercisesFromJson: by name within scoped list; omit → warning only. */
export function planExercisesJsonSave(
  entries: ExerciseJson[],
  scopedExercises: Exercise[],
  viewArchived: boolean,
): PlanExercisesJsonSaveResult {
  const byName = new Map<string, Exercise[]>();
  for (const exercise of scopedExercises) {
    const list = byName.get(exercise.name) ?? [];
    list.push(exercise);
    byName.set(exercise.name, list);
  }

  const usedIds = new Set<string>();
  const warnings: string[] = [];
  const mutations: ExerciseJsonMutation[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.archived !== viewArchived) {
      warnings.push(
        `"${entry.name}" has archived=${entry.archived} but you're editing the ${viewArchived ? "archived" : "active"} list — saved with archived=${entry.archived}.`,
      );
    }

    const candidates = (byName.get(entry.name) ?? []).filter((ex) => !usedIds.has(ex.id));
    let match: Exercise | undefined;

    if (candidates.length === 1) {
      match = candidates[0];
    } else if (candidates.length > 1) {
      const sameNameIndices = entries
        .map((e, idx) => ({ e, idx }))
        .filter(({ e }) => e.name === entry.name)
        .map(({ idx }) => idx);
      const position = sameNameIndices.indexOf(i);
      match = candidates[position];
      warnings.push(
        `Ambiguous name "${entry.name}" — matched by position (${position + 1} of ${candidates.length}).`,
      );
    }

    if (match) {
      usedIds.add(match.id);
      mutations.push({ action: "update", id: match.id, entry });
    } else {
      mutations.push({ action: "create", entry });
    }
  }

  for (const exercise of scopedExercises) {
    if (!usedIds.has(exercise.id)) {
      warnings.push(`"${exercise.name}" was not included in the JSON and was not modified.`);
    }
  }

  return { mutations, warnings };
}

export function exercisePatchFromJsonEntry(
  entry: ExerciseJson,
  existingExtensions: Exercise["extensions"] | null,
): Pick<Exercise, "name" | "tracking_mode" | "archived" | "logged_fields" | "settings_fields" | "extensions"> {
  const normalized = normalizeExerciseJsonEntry(entry);
  return exerciseRecordFieldsFromForm(
    {
      name: normalized.name,
      type: normalized.type,
      loggedFieldDefs: normalized.logged_field_defs,
      settingsFields: normalized.settings_fields,
    },
    normalized.archived,
    existingExtensions,
  );
}