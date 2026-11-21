import { measuresFromParsed, parseLogFormValues, repeatCount } from "@/core/logic/logForm";
import { resolveLoggedFields } from "@/core/logic/logFields";
import { nowIso } from "@/core/time";
import type { Exercise } from "@/core/types";
import type { Repository } from "@/data/repository";

type LogExerciseInput = {
  workoutId: string;
  exercise: Exercise;
  routineDayExerciseId: string | null;
  rawValues: Record<string, string>;
  nextSortOrder: number;
};

export async function logExercise(
  repo: Repository,
  input: LogExerciseInput,
): Promise<void> {
  const fields = resolveLoggedFields(input.exercise);
  const parsed = parseLogFormValues(fields, input.rawValues);
  if (Object.keys(parsed).length === 0) {
    throw new Error("Enter at least one value to log");
  }

  const repeat = repeatCount(parsed);
  const measures = measuresFromParsed(input.exercise.tracking_mode, parsed);
  const loggedAt = nowIso();

  for (let i = 0; i < repeat; i++) {
    await repo.create("sets", {
      workout_id: input.workoutId,
      exercise_id: input.exercise.id,
      logged_at: loggedAt,
      routine_day_exercise_id: input.routineDayExerciseId,
      sort_order: input.nextSortOrder + i,
      tracking_mode: input.exercise.tracking_mode,
      weight_kg: measures.weight_kg,
      reps: measures.reps,
      added_weight_kg: measures.added_weight_kg,
      seconds: measures.seconds,
      meters: measures.meters,
      kind: null,
      note: null,
      extra_values: measures.extra_values,
    });
  }
}

export async function nextSetSortOrder(
  repo: Repository,
  workoutId: string,
): Promise<number> {
  const sets = await repo.list("sets");
  const inWorkout = sets.filter((set) => set.workout_id === workoutId);
  if (inWorkout.length === 0) return 0;
  return Math.max(...inWorkout.map((set) => set.sort_order)) + 1;
}
