let exercisesDirty = false;
let routinesDirty = false;

export function markExercisesDirty() {
  exercisesDirty = true;
}

/** True once, then cleared. The list reloads only after a real save. */
export function takeExercisesDirty() {
  const dirty = exercisesDirty;
  exercisesDirty = false;
  return dirty;
}

export function markRoutinesDirty() {
  routinesDirty = true;
}

export function takeRoutinesDirty() {
  const dirty = routinesDirty;
  routinesDirty = false;
  return dirty;
}