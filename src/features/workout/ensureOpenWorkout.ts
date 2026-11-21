import { pickOpenWorkout } from "@/core/logic/openWorkout";
import { nowIso } from "@/core/time";
import type { Workout } from "@/core/types";
import type { Repository } from "@/data/repository";

export async function ensureOpenWorkout(
  repo: Repository,
  routineDayId: string,
): Promise<Workout> {
  const workouts = await repo.list("workouts");
  const existing = pickOpenWorkout(workouts, routineDayId);
  if (existing) return existing;

  return repo.create("workouts", {
    started_at: nowIso(),
    ended_at: null,
    routine_day_id: routineDayId,
    note: null,
  });
}

export async function finishWorkout(repo: Repository, workoutId: string): Promise<void> {
  await repo.update("workouts", workoutId, { ended_at: nowIso() });
}