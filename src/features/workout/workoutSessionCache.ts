import { pickOpenWorkout } from "@/core/logic/openWorkout";
import { openRepository } from "@/data/openRepository";
import type { Repository } from "@/data/repository";

import {
  getWorkoutSessionData,
  readWorkoutSessionTables,
  sessionFromTables,
  type OpenWorkoutSessionData,
  type WorkoutSessionData,
} from "./getWorkoutSessionData";

const cache = new Map<string, WorkoutSessionData>();
const inflight = new Map<string, Promise<OpenWorkoutSessionData>>();

/** Bumped when cached sessions are no longer safe to paint. */
let generation = 0;

export function peekWorkoutSession(dayId: string): WorkoutSessionData | null {
  return cache.get(dayId) ?? null;
}

export function invalidateWorkoutSessionCache(): void {
  generation += 1;
  cache.clear();
}

/** Read every active day's list without creating a workout. */
export async function preloadWorkoutSessions(repo: Repository): Promise<void> {
  const started = generation;
  const tables = await readWorkoutSessionTables(repo);
  if (started !== generation) return;

  const active = tables.routines.find((routine) => routine.active && !routine.archived);
  if (!active) return;

  const days = tables.routineDays.filter((day) => day.routine_id === active.id);
  for (const day of days) {
    if (started !== generation) return;
    if (cache.has(day.id)) continue;
    const session = sessionFromTables(tables, day.id, pickOpenWorkout(tables.workouts, day.id));
    if (session) cache.set(day.id, session);
  }
}

/** Open or resume the workout, sharing one request per day. */
export function loadWorkoutSession(dayId: string): Promise<OpenWorkoutSessionData> {
  const pending = inflight.get(dayId);
  if (pending) return pending;

  const started = generation;
  const request = getWorkoutSessionData(openRepository(), dayId)
    .then((data) => {
      if (started === generation) cache.set(dayId, data);
      return data;
    })
    .finally(() => {
      if (inflight.get(dayId) === request) inflight.delete(dayId);
    });
  inflight.set(dayId, request);
  return request;
}
