import type { Workout } from "@/core/types";

/** Resume the latest open workout for this routine day, or null to start a new one. */
export function pickOpenWorkout(workouts: Workout[], routineDayId: string): Workout | null {
  const open = workouts.filter(
    (w) => w.deleted_at === null && w.routine_day_id === routineDayId && w.ended_at === null,
  );
  if (open.length === 0) return null;
  return open.reduce((latest, row) =>
    row.started_at > latest.started_at ? row : latest,
  );
}