export type SessionExercise = {
  exerciseId: string;
  name: string;
  routineDayExerciseId: string | null;
};

export type SessionSetLog = {
  id: string;
  exerciseId: string;
  name: string;
  loggedAt: string;
};

export function completedExerciseIds(logs: SessionSetLog[]): Set<string> {
  return new Set(logs.map((log) => log.exerciseId));
}

export function buildInitialQueue(
  dayExercises: SessionExercise[],
  done: Set<string>,
): string[] {
  return dayExercises
    .map((entry) => entry.exerciseId)
    .filter((id) => !done.has(id));
}

export function syncQueueWithDone(
  dayExercises: SessionExercise[],
  done: Set<string>,
  currentQueue: string[],
  requeuedIds: Set<string>,
): string[] {
  const pending = buildInitialQueue(dayExercises, done);
  const keptRequeued = currentQueue.filter((id) => requeuedIds.has(id) && done.has(id));
  return [...keptRequeued, ...pending.filter((id) => !keptRequeued.includes(id))];
}

export function requeueExercise(queue: string[], exerciseId: string): string[] {
  return [exerciseId, ...queue.filter((id) => id !== exerciseId)];
}

export function isCompletedForSession(
  exerciseId: string,
  done: Set<string>,
  queue: string[],
): boolean {
  return done.has(exerciseId) && !queue.includes(exerciseId);
}

export function sessionProgress(
  dayExercises: SessionExercise[],
  done: Set<string>,
  queue: string[],
): { completed: number; total: number } {
  const total = dayExercises.length;
  const completed = dayExercises.filter((entry) =>
    isCompletedForSession(entry.exerciseId, done, queue),
  ).length;
  return { completed, total };
}

export type WorkoutSections = {
  thisDay: SessionExercise[];
  thisRoutine: SessionExercise[];
  other: SessionExercise[];
  completed: SessionSetLog[];
};

export type WorkoutSessionLists = {
  dayId: string;
  dayExercises: SessionExercise[];
  routineExercises: SessionExercise[];
  otherExercises: SessionExercise[];
  sessionLogs: SessionSetLog[];
};

export function buildWorkoutSections(
  data: WorkoutSessionLists,
  queue: string[],
  done: Set<string>,
): WorkoutSections {
  const pending = (exerciseId: string) => !isCompletedForSession(exerciseId, done, queue);

  const dayExerciseIds = new Set(data.dayExercises.map((entry) => entry.exerciseId));
  const routineExerciseIds = new Set([
    ...data.dayExercises.map((entry) => entry.exerciseId),
    ...data.routineExercises.map((entry) => entry.exerciseId),
  ]);

  const thisDay = data.dayExercises.filter((entry) => pending(entry.exerciseId));

  const thisRoutine = data.routineExercises.filter(
    (entry) => pending(entry.exerciseId) && !dayExerciseIds.has(entry.exerciseId),
  );

  const other = data.otherExercises.filter(
    (entry) => pending(entry.exerciseId) && !routineExerciseIds.has(entry.exerciseId),
  );

  const seenCompleted = new Set<string>();
  const completed = data.sessionLogs.filter((log) => {
    if (!isCompletedForSession(log.exerciseId, done, queue)) return false;
    if (seenCompleted.has(log.exerciseId)) return false;
    seenCompleted.add(log.exerciseId);
    return true;
  });

  return { thisDay, thisRoutine, other, completed };
}