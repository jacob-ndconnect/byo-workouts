import { pickOpenWorkout } from "@/core/logic/openWorkout";
import type { SessionExercise, SessionSetLog } from "@/core/logic/sessionQueue";
import type {
  Exercise,
  Routine,
  RoutineDay,
  RoutineDayExercise,
  SetEntry,
  Workout,
} from "@/core/types";
import type { Repository } from "@/data/repository";

import { ensureOpenWorkout } from "./ensureOpenWorkout";

export type WorkoutSessionData = {
  /** Null until this day has an open workout. The exercise lists are still complete. */
  workout: Workout | null;
  dayId: string;
  dayName: string;
  routineName: string;
  dayExercises: SessionExercise[];
  routineExercises: SessionExercise[];
  otherExercises: SessionExercise[];
  sessionLogs: SessionSetLog[];
};

export type OpenWorkoutSessionData = WorkoutSessionData & { workout: Workout };

export type WorkoutSessionTables = {
  routines: Routine[];
  routineDays: RoutineDay[];
  slots: RoutineDayExercise[];
  exercises: Exercise[];
  sets: SetEntry[];
  workouts: Workout[];
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

export async function readWorkoutSessionTables(repo: Repository): Promise<WorkoutSessionTables> {
  const [routines, routineDays, slots, exercises, sets, workouts] = await Promise.all([
    repo.list("routines"),
    repo.list("routine_days"),
    repo.list("routine_day_exercises"),
    repo.list("exercises"),
    repo.list("sets"),
    repo.list("workouts"),
  ]);
  return { routines, routineDays, slots, exercises, sets, workouts };
}

/** Build one day's session from tables already in memory. Null when the day is not active. */
export function sessionFromTables(
  tables: WorkoutSessionTables,
  dayId: string,
  workout: Workout | null,
): WorkoutSessionData | null {
  const day = tables.routineDays.find((row) => row.id === dayId);
  if (!day) return null;
  const routine = tables.routines.find((row) => row.id === day.routine_id);
  if (!routine?.active || routine.archived) return null;

  const exerciseById = new Map(tables.exercises.map((row) => [row.id, row]));
  const routineDayIds = new Set(
    tables.routineDays.filter((row) => row.routine_id === routine.id).map((row) => row.id),
  );

  const dayExercises = tables.slots
    .filter((slot) => slot.routine_day_id === dayId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((slot) => toSessionExercise(slot, exerciseById))
    .filter((entry): entry is SessionExercise => entry !== null);

  const routineSlots = tables.slots
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

  const otherExercises: SessionExercise[] = tables.exercises
    .filter((exercise) => !exercise.archived && !plannedIds.has(exercise.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((exercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      routineDayExerciseId: null,
    }));

  const workoutSets = workout
    ? tables.sets.filter((set) => set.workout_id === workout.id)
    : [];

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

export async function getWorkoutSessionData(
  repo: Repository,
  dayId: string,
): Promise<OpenWorkoutSessionData> {
  const tables = await readWorkoutSessionTables(repo);
  const day = tables.routineDays.find((row) => row.id === dayId);
  if (!day) throw new Error("Workout day not found");
  const routine = tables.routines.find((row) => row.id === day.routine_id);
  if (!routine?.active || routine.archived) {
    throw new Error("Workout day is not part of the active routine");
  }

  const existing = pickOpenWorkout(tables.workouts, dayId);
  const workout = existing ?? (await ensureOpenWorkout(repo, dayId));
  const session = sessionFromTables(tables, dayId, workout);
  if (!session?.workout) throw new Error("Workout day not found");
  return session as OpenWorkoutSessionData;
}
