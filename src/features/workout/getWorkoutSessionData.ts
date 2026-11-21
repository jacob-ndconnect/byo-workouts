import type { SessionExercise, SessionSetLog } from "@/core/logic/sessionQueue";
import type { Exercise, RoutineDayExercise, SetEntry, Workout } from "@/core/types";
import type { Repository } from "@/data/repository";

import { ensureOpenWorkout } from "./ensureOpenWorkout";

export type WorkoutSessionData = {
  workout: Workout;
  dayId: string;
  dayName: string;
  routineName: string;
  dayExercises: SessionExercise[];
  routineExercises: SessionExercise[];
  otherExercises: SessionExercise[];
  sessionLogs: SessionSetLog[];
};

function toSessionExercise(
  slot: RoutineDayExercise,
  exerciseById: Map<string, Exercise>,
): SessionExercise | null {
  const exercise = exerciseById.get(slot.exercise_id);
  if (!exercise || exercise.archived) return null;
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    routineDayExerciseId: slot.id,
  };
}

function sessionLogsFromSets(
  sets: SetEntry[],
  exerciseById: Map<string, Exercise>,
): SessionSetLog[] {
  const latestByExercise = new Map<string, SetEntry>();
  for (const set of sets) {
    const prev = latestByExercise.get(set.exercise_id);
    if (!prev || set.sort_order > prev.sort_order) {
      latestByExercise.set(set.exercise_id, set);
    }
  }

  return [...latestByExercise.entries()].map(([exerciseId, set]) => ({
    id: set.id,
    exerciseId,
    name: exerciseById.get(exerciseId)?.name ?? "Unknown",
    loggedAt: set.created_at,
  }));
}

export async function getWorkoutSessionData(
  repo: Repository,
  dayId: string,
): Promise<WorkoutSessionData> {
  const day = await repo.get("routine_days", dayId);
  if (!day) {
    throw new Error("Workout day not found");
  }

  const routine = await repo.get("routines", day.routine_id);
  if (!routine?.active || routine.archived) {
    throw new Error("Workout day is not part of the active routine");
  }

  const [
    routineDays,
    daySlots,
    allSlots,
    exercises,
    allSets,
  ] = await Promise.all([
    repo.list("routine_days"),
    repo.list("routine_day_exercises"),
    repo.list("routine_day_exercises"),
    repo.list("exercises"),
    repo.list("sets"),
  ]);

  const exerciseById = new Map(exercises.map((row) => [row.id, row]));
  const routineDayIds = new Set(
    routineDays.filter((row) => row.routine_id === routine.id).map((row) => row.id),
  );

  const workout = await ensureOpenWorkout(repo, dayId);
  const workoutSets = allSets.filter((set) => set.workout_id === workout.id);

  const dayExercises = daySlots
    .filter((slot) => slot.routine_day_id === dayId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((slot) => toSessionExercise(slot, exerciseById))
    .filter((entry): entry is SessionExercise => entry !== null);

  const routineSlots = allSlots
    .filter((slot) => routineDayIds.has(slot.routine_day_id) && slot.routine_day_id !== dayId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const routineExerciseIds = new Set<string>();
  const routineExercises: SessionExercise[] = [];
  for (const slot of routineSlots) {
    if (routineExerciseIds.has(slot.exercise_id)) continue;
    const entry = toSessionExercise(slot, exerciseById);
    if (!entry) continue;
    routineExerciseIds.add(slot.exercise_id);
    routineExercises.push({
      ...entry,
      routineDayExerciseId: null,
    });
  }

  const plannedIds = new Set([
    ...dayExercises.map((entry) => entry.exerciseId),
    ...routineExercises.map((entry) => entry.exerciseId),
  ]);

  const otherExercises: SessionExercise[] = exercises
    .filter((exercise) => !exercise.archived && !plannedIds.has(exercise.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((exercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      routineDayExerciseId: null,
    }));

  return {
    workout,
    dayId,
    dayName: day.name,
    routineName: routine.name,
    dayExercises,
    routineExercises,
    otherExercises,
    sessionLogs: sessionLogsFromSets(workoutSets, exerciseById),
  };
}