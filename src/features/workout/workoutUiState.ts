import type { SessionExercise } from "@/core/logic/sessionQueue";

const justAddedByWorkout = new Map<string, SessionExercise[]>();
const queueByWorkout = new Map<string, string[]>();
const requeuedByWorkout = new Map<string, Set<string>>();

export function getJustAdded(workoutId: string): SessionExercise[] {
  return justAddedByWorkout.get(workoutId) ?? [];
}

export function addJustAdded(workoutId: string, exercise: SessionExercise): void {
  const current = justAddedByWorkout.get(workoutId) ?? [];
  if (current.some((entry) => entry.exerciseId === exercise.exerciseId)) return;
  justAddedByWorkout.set(workoutId, [exercise, ...current]);
}

export function getQueueState(workoutId: string): {
  queue: string[];
  requeued: Set<string>;
} {
  return {
    queue: queueByWorkout.get(workoutId) ?? [],
    requeued: requeuedByWorkout.get(workoutId) ?? new Set(),
  };
}

export function setQueueState(
  workoutId: string,
  queue: string[],
  requeued: Set<string>,
): void {
  queueByWorkout.set(workoutId, queue);
  requeuedByWorkout.set(workoutId, new Set(requeued));
}