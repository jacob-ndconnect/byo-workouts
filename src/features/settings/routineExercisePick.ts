export type RoutineExercisePick = { dayKey: string; exerciseId: string };

let pending: RoutineExercisePick | null = null;

export function queueRoutineExercisePick(pick: RoutineExercisePick) {
  pending = pick;
}

/** The pick from the add-exercise sheet, once. */
export function takeRoutineExercisePick(): RoutineExercisePick | null {
  const pick = pending;
  pending = null;
  return pick;
}
