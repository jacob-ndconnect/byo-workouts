import { FALLBACK_LOG_DEFAULTS } from "@/core/logic/logForm";
import type { Defaults } from "@/core/types";
import type { Repository } from "@/data/repository";

export type LogDefaults = {
  id: string | null;
  defaultSets: number;
  defaultReps: number;
};

function parsePositiveInt(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a whole number of at least 1`);
  }
  if (value > 999) {
    throw new Error(`${label} must be 999 or less`);
  }
  return value;
}

export async function getLogDefaults(repo: Repository): Promise<LogDefaults> {
  const rows = await repo.list("defaults");
  const row = rows[0];
  if (!row) {
    return { id: null, ...FALLBACK_LOG_DEFAULTS };
  }
  return {
    id: row.id,
    defaultSets: row.default_sets,
    defaultReps: row.default_reps,
  };
}

export async function saveLogDefaults(
  repo: Repository,
  input: { defaultSets: number; defaultReps: number },
): Promise<LogDefaults> {
  const defaultSets = parsePositiveInt(input.defaultSets, "Sets");
  const defaultReps = parsePositiveInt(input.defaultReps, "Reps");

  const rows = await repo.list("defaults");
  const existing = rows[0];

  let saved: Defaults;
  if (existing) {
    saved = await repo.update("defaults", existing.id, {
      default_sets: defaultSets,
      default_reps: defaultReps,
    });
  } else {
    saved = await repo.create("defaults", {
      default_sets: defaultSets,
      default_reps: defaultReps,
    });
  }

  return {
    id: saved.id,
    defaultSets: saved.default_sets,
    defaultReps: saved.default_reps,
  };
}

export async function defaultsJsonText(repo: Repository): Promise<string> {
  const defaults = await getLogDefaults(repo);
  return JSON.stringify(
    { default_sets: defaults.defaultSets, default_reps: defaults.defaultReps },
    null,
    2,
  );
}

export async function saveDefaultsFromJson(repo: Repository, jsonText: string): Promise<LogDefaults> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Defaults JSON must be an object");
  }
  const record = parsed as Record<string, unknown>;
  const sets = Number(record.default_sets);
  const reps = Number(record.default_reps);
  return saveLogDefaults(repo, { defaultSets: sets, defaultReps: reps });
}