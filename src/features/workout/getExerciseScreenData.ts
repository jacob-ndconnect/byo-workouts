import {
  buildLogFormValues,
  FALLBACK_LOG_DEFAULTS,
  heroDisplayFromSet,
} from "@/core/logic/logForm";
import { heroFieldName, resolveLoggedFields } from "@/core/logic/logFields";
import type { Defaults, Exercise, SetEntry } from "@/core/types";
import type { Repository } from "@/data/repository";

export type ExerciseScreenData = {
  exercise: Exercise;
  fields: string[];
  heroField: string | null;
  heroDisplay: string;
  formDefaults: Record<string, string>;
  lastSet: SetEntry | null;
  routineDayExerciseId: string | null;
  globalDefaults: { defaultSets: number; defaultReps: number };
};

function readGlobalDefaults(rows: Defaults[]): { defaultSets: number; defaultReps: number } {
  const row = rows[0];
  if (!row) return { ...FALLBACK_LOG_DEFAULTS };
  return { defaultSets: row.default_sets, defaultReps: row.default_reps };
}

export async function getExerciseScreenData(
  repo: Repository,
  exerciseId: string,
  workoutId: string,
  routineDayExerciseId: string | null,
): Promise<ExerciseScreenData | null> {
  const exercise = await repo.get("exercises", exerciseId);
  if (!exercise) return null;

  const [sets, defaults] = await Promise.all([
    repo.list("sets"),
    repo.list("defaults"),
  ]);

  const workoutSets = sets
    .filter((set) => set.workout_id === workoutId && set.exercise_id === exerciseId)
    .sort((a, b) => b.sort_order - a.sort_order);

  const lastInWorkout = workoutSets[0] ?? null;

  const allForExercise = sets
    .filter((set) => set.exercise_id === exerciseId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const lastSet = lastInWorkout ?? allForExercise[0] ?? null;

  const fields = resolveLoggedFields(exercise);
  const heroField = heroFieldName(fields, exercise);
  const globalDefaults = readGlobalDefaults(defaults);

  return {
    exercise,
    fields,
    heroField,
    heroDisplay: heroDisplayFromSet(heroField, lastSet),
    formDefaults: buildLogFormValues(fields, lastSet, globalDefaults),
    lastSet,
    routineDayExerciseId,
    globalDefaults,
  };
}