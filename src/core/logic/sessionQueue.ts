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

/** Keeps queue order, drops logged slots unless re-queued, and appends new planned pending ids. */
export function reconcileSessionQueue(
  dayExercises: SessionExercise[],
  done: Set<string>,
  currentQueue: string[],
  requeuedIds: Set<string>,
  removedIds: Set<string>,
): string[] {
  const plannedPending = buildInitialQueue(dayExercises, done).filter(
    (id) => !removedIds.has(id),
  );

  const result: string[] = [];
  const seen = new Set<string>();

  for (const id of currentQueue) {
    if (removedIds.has(id)) continue;
    const logged = done.has(id);
    const keep = !logged || requeuedIds.has(id);
    if (!keep) continue;
    result.push(id);
    seen.add(id);
  }

  for (const id of plannedPending) {
    if (seen.has(id)) continue;
    result.push(id);
    seen.add(id);
  }

  return result;
}

/** @deprecated Use reconcileSessionQueue */
export function syncQueueWithDone(
  dayExercises: SessionExercise[],
  done: Set<string>,
  currentQueue: string[],
  requeuedIds: Set<string>,
): string[] {
  return reconcileSessionQueue(dayExercises, done, currentQueue, requeuedIds, new Set());
}

export function requeueExercise(queue: string[], exerciseId: string): string[] {
  return [exerciseId, ...queue.filter((id) => id !== exerciseId)];
}

export function addToTodayQueue(
  queue: string[],
  removed: Set<string>,
  exerciseId: string,
): { queue: string[]; removed: Set<string> } {
  const nextRemoved = new Set(removed);
  nextRemoved.delete(exerciseId);
  if (queue.includes(exerciseId)) {
    return { queue, removed: nextRemoved };
  }
  return { queue: [...queue, exerciseId], removed: nextRemoved };
}

export function removeFromTodayQueue(
  queue: string[],
  removed: Set<string>,
  exerciseId: string,
): { queue: string[]; removed: Set<string> } {
  return {
    queue: queue.filter((id) => id !== exerciseId),
    removed: new Set(removed).add(exerciseId),
  };
}

export function moveQueueItem(
  queue: string[],
  exerciseId: string,
  direction: "up" | "down",
): string[] {
  const index = queue.indexOf(exerciseId);
  if (index < 0) return queue;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= queue.length) return queue;
  const next = queue.slice();
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

export function reorderQueue(queue: string[], fromIndex: number, toIndex: number): string[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return queue;
  if (fromIndex >= queue.length || toIndex >= queue.length) return queue;
  const next = queue.slice();
  const [item] = next.splice(fromIndex, 1);
  if (!item) return queue;
  next.splice(toIndex, 0, item);
  return next;
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
  queue: string[],
  done: Set<string>,
  removed: Set<string>,
): { completed: number; total: number } {
  const scopeIds = new Set<string>(queue);
  for (const entry of dayExercises) {
    if (!removed.has(entry.exerciseId)) {
      scopeIds.add(entry.exerciseId);
    }
  }

  let completed = 0;
  for (const id of scopeIds) {
    if (isCompletedForSession(id, done, queue)) completed += 1;
  }
  return { completed, total: scopeIds.size };
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

export function sessionExerciseLookup(
  data: WorkoutSessionLists,
  extra: SessionExercise[] = [],
): Map<string, SessionExercise> {
  const map = new Map<string, SessionExercise>();
  for (const list of [
    data.dayExercises,
    data.routineExercises,
    data.otherExercises,
    extra,
  ]) {
    for (const entry of list) {
      if (!map.has(entry.exerciseId)) {
        map.set(entry.exerciseId, entry);
      }
    }
  }
  return map;
}

export function buildWorkoutSections(
  data: WorkoutSessionLists,
  queue: string[],
  done: Set<string>,
  lookup: Map<string, SessionExercise>,
): WorkoutSections {
  const pending = (exerciseId: string) => !isCompletedForSession(exerciseId, done, queue);
  const queueIdSet = new Set(queue);

  const thisDay = queue
    .map((id) => lookup.get(id))
    .filter((entry): entry is SessionExercise => entry !== undefined && pending(entry.exerciseId));

  const dayExerciseIds = new Set(data.dayExercises.map((entry) => entry.exerciseId));
  const routineExerciseIds = new Set([
    ...data.dayExercises.map((entry) => entry.exerciseId),
    ...data.routineExercises.map((entry) => entry.exerciseId),
  ]);

  const thisRoutine = data.routineExercises.filter(
    (entry) =>
      pending(entry.exerciseId) &&
      !dayExerciseIds.has(entry.exerciseId) &&
      !queueIdSet.has(entry.exerciseId),
  );

  const other = data.otherExercises.filter(
    (entry) =>
      pending(entry.exerciseId) &&
      !routineExerciseIds.has(entry.exerciseId) &&
      !queueIdSet.has(entry.exerciseId),
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