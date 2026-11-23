import type { SessionExercise } from "@/core/logic/sessionQueue";

const justAddedByWorkout = new Map<string, SessionExercise[]>();
const queueByWorkout = new Map<string, string[]>();
const requeuedByWorkout = new Map<string, Set<string>>();
const removedByWorkout = new Map<string, Set<string>>();
const initializedWorkouts = new Set<string>();

let queueRevision = 0;

export function getQueueRevision(): number {
  return queueRevision;
}

function bumpQueueRevision(): void {
  queueRevision += 1;
}

export function getJustAdded(workoutId: string): SessionExercise[] {
  return justAddedByWorkout.get(workoutId) ?? [];
}

export function addJustAdded(workoutId: string, exercise: SessionExercise): void {
  const current = justAddedByWorkout.get(workoutId) ?? [];
  if (current.some((entry) => entry.exerciseId === exercise.exerciseId)) return;
  justAddedByWorkout.set(workoutId, [exercise, ...current]);
  bumpQueueRevision();
}

export function isQueueInitialized(workoutId: string): boolean {
  return initializedWorkouts.has(workoutId);
}

export function getQueueState(workoutId: string): {
  queue: string[];
  requeued: Set<string>;
  removed: Set<string>;
} {
  return {
    queue: queueByWorkout.get(workoutId) ?? [],
    requeued: requeuedByWorkout.get(workoutId) ?? new Set(),
    removed: removedByWorkout.get(workoutId) ?? new Set(),
  };
}

export function setQueueState(
  workoutId: string,
  queue: string[],
  requeued: Set<string>,
  removed: Set<string> = removedByWorkout.get(workoutId) ?? new Set(),
): void {
  queueByWorkout.set(workoutId, queue);
  requeuedByWorkout.set(workoutId, new Set(requeued));
  removedByWorkout.set(workoutId, new Set(removed));
  initializedWorkouts.add(workoutId);
  bumpQueueRevision();
}