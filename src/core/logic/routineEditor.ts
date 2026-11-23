import type { Exercise, RoutineDay, RoutineDayExercise } from "@/core/types";

export type RoutineDayFormInput = {
  id?: string;
  name: string;
  exercises: { id?: string; exerciseId: string }[];
};

export type RoutineFormInput = {
  name: string;
  days: RoutineDayFormInput[];
};

export type RoutineJson = {
  name: string;
  days: { name: string; exercises: string[] }[];
};

export type AssembledRoutineDay = {
  id: string;
  name: string;
  sort_order: number;
  exercises: {
    id: string;
    exercise_id: string;
    exerciseName: string;
    sort_order: number;
  }[];
};

/** Default day labels: A, B, C, … Z, then Day 27, … */
export function defaultDayName(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  return `Day ${index + 1}`;
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function normalizeRoutineForm(input: RoutineFormInput): {
  name: string;
  days: {
    id?: string;
    name: string;
    exercises: { id?: string; exerciseId: string }[];
  }[];
} {
  const name = input.name.trim();
  if (!name) throw new Error("Routine name is required");

  const days = input.days.map((day, dayIndex) => {
    const dayName = day.name.trim() || defaultDayName(dayIndex);
    const seen = new Set<string>();
    const exercises = day.exercises.filter((entry) => {
      if (!entry.exerciseId || seen.has(entry.exerciseId)) return false;
      seen.add(entry.exerciseId);
      return true;
    });
    return { id: day.id, name: dayName, exercises };
  });

  return { name, days };
}

export function normalizeRoutineJsonEntry(entry: unknown): RoutineJson {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error("Routine JSON must be an object");
  }

  const record = entry as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) throw new Error("Routine must have a name");

  if (!Array.isArray(record.days)) {
    throw new Error("Routine must have a days array");
  }

  const days = record.days.map((dayEntry, index) => {
    if (!dayEntry || typeof dayEntry !== "object" || Array.isArray(dayEntry)) {
      throw new Error(`Day ${index + 1} must be an object`);
    }
    const day = dayEntry as Record<string, unknown>;
    const dayName = typeof day.name === "string" ? day.name.trim() : "";
    if (!dayName) throw new Error(`Day ${index + 1} must have a name`);

    if (!Array.isArray(day.exercises)) {
      throw new Error("Day must have an exercises array");
    }

    const exercises = day.exercises
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);

    return { name: dayName, exercises };
  });

  return { name, days };
}

export function parseRoutineJsonText(jsonText: string): RoutineJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON");
  }
  return normalizeRoutineJsonEntry(parsed);
}

export function assembleRoutineDays(
  days: RoutineDay[],
  slots: RoutineDayExercise[],
  exercises: Exercise[],
): AssembledRoutineDay[] {
  const exerciseName = new Map(exercises.map((e) => [e.id, e.name]));
  const slotsByDay = new Map<string, RoutineDayExercise[]>();
  for (const slot of slots) {
    const list = slotsByDay.get(slot.routine_day_id) ?? [];
    list.push(slot);
    slotsByDay.set(slot.routine_day_id, list);
  }

  return days
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((day) => {
      const daySlots = (slotsByDay.get(day.id) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
      return {
        id: day.id,
        name: day.name,
        sort_order: day.sort_order,
        exercises: daySlots.map((slot) => ({
          id: slot.id,
          exercise_id: slot.exercise_id,
          exerciseName: exerciseName.get(slot.exercise_id) ?? "Unknown exercise",
          sort_order: slot.sort_order,
        })),
      };
    });
}

export function toRoutineJson(
  routineName: string,
  assembledDays: AssembledRoutineDay[],
): RoutineJson {
  return {
    name: routineName,
    days: assembledDays.map((day) => ({
      name: day.name,
      exercises: day.exercises.map((e) => e.exerciseName),
    })),
  };
}

export type RoutineStructureDayPlan = {
  dayId?: string;
  name: string;
  sortOrder: number;
  exercises: { slotId?: string; exerciseId: string; sortOrder: number }[];
};

export type RoutineStructurePlan = {
  routineName: string;
  days: RoutineStructureDayPlan[];
  deleteDayIds: string[];
  deleteSlotIds: string[];
  warnings: string[];
};

function planRoutineStructureInternal(
  existingDays: AssembledRoutineDay[],
  normalized: ReturnType<typeof normalizeRoutineForm>,
  destructive: boolean,
  activeExercises: Exercise[],
  exerciseNameById: Map<string, string>,
): RoutineStructurePlan {
  const warnings: string[] = [];
  const existingById = new Map(existingDays.map((day) => [day.id, day]));
  const keptDayIds = new Set<string>();
  const days: RoutineStructureDayPlan[] = [];

  for (let dayIndex = 0; dayIndex < normalized.days.length; dayIndex++) {
    const dayInput = normalized.days[dayIndex];
    const dayId = dayInput.id && existingById.has(dayInput.id) ? dayInput.id : undefined;
    if (dayId) keptDayIds.add(dayId);

    const existingDay = dayId ? existingById.get(dayId) : undefined;
    const existingExercises = existingDay?.exercises ?? [];
    const existingExerciseById = new Map(existingExercises.map((e) => [e.id, e]));
    const keptExerciseIds = new Set<string>();

    const exercises: RoutineStructureDayPlan["exercises"] = [];

    for (let exerciseIndex = 0; exerciseIndex < dayInput.exercises.length; exerciseIndex++) {
      const exerciseInput = dayInput.exercises[exerciseIndex];
      const slotId =
        exerciseInput.id && existingExerciseById.has(exerciseInput.id)
          ? exerciseInput.id
          : undefined;
      if (slotId) keptExerciseIds.add(slotId);
      exercises.push({
        slotId,
        exerciseId: exerciseInput.exerciseId,
        sortOrder: exerciseIndex,
      });
    }

    if (!destructive) {
      for (const exercise of existingExercises) {
        if (!keptExerciseIds.has(exercise.id)) {
          warnings.push(
            `"${exercise.exerciseName}" on day "${dayInput.name}" was not included in the JSON and was not modified.`,
          );
        }
      }
    }

    days.push({
      dayId,
      name: dayInput.name,
      sortOrder: dayIndex,
      exercises,
    });
  }

  const deleteDayIds: string[] = [];
  const deleteSlotIds: string[] = [];

  if (destructive) {
    for (const day of existingDays) {
      if (!keptDayIds.has(day.id)) {
        deleteDayIds.push(day.id);
        for (const ex of day.exercises) {
          deleteSlotIds.push(ex.id);
        }
      } else {
        const dayPlan = days.find((d) => d.dayId === day.id);
        const kept = new Set(dayPlan?.exercises.map((e) => e.slotId).filter(Boolean));
        for (const ex of day.exercises) {
          if (!kept.has(ex.id)) deleteSlotIds.push(ex.id);
        }
      }
    }
  } else {
    for (const day of existingDays) {
      if (!keptDayIds.has(day.id)) {
        warnings.push(`Day "${day.name}" was not included in the JSON and was not modified.`);
      }
    }
  }

  void activeExercises;
  void exerciseNameById;

  return {
    routineName: normalized.name,
    days,
    deleteDayIds,
    deleteSlotIds,
    warnings,
  };
}

export function planRoutineFormSave(
  existingDays: AssembledRoutineDay[],
  input: RoutineFormInput,
): RoutineStructurePlan {
  const normalized = normalizeRoutineForm(input);
  return planRoutineStructureInternal(existingDays, normalized, true, [], new Map());
}

export function planRoutineJsonSave(
  existingDays: AssembledRoutineDay[],
  json: RoutineJson,
  activeExercises: Exercise[],
): { formInput: RoutineFormInput; plan: RoutineStructurePlan } {
  const byName = new Map<string, Exercise[]>();
  for (const exercise of activeExercises) {
    const list = byName.get(exercise.name) ?? [];
    list.push(exercise);
    byName.set(exercise.name, list);
  }

  const existingByName = new Map<string, AssembledRoutineDay[]>();
  for (const day of existingDays) {
    const list = existingByName.get(day.name) ?? [];
    list.push(day);
    existingByName.set(day.name, list);
  }

  const usedDayIds = new Set<string>();
  const warnings: string[] = [];
  const formDays: RoutineDayFormInput[] = [];

  for (let dayIndex = 0; dayIndex < json.days.length; dayIndex++) {
    const dayEntry = json.days[dayIndex];
    const candidates = (existingByName.get(dayEntry.name) ?? []).filter((d) => !usedDayIds.has(d.id));

    let matchedDay: AssembledRoutineDay | undefined;
    if (candidates.length === 1) {
      matchedDay = candidates[0];
    } else if (candidates.length > 1) {
      const sameNameIndices = json.days
        .map((day, idx) => ({ day, idx }))
        .filter(({ day }) => day.name === dayEntry.name)
        .map(({ idx }) => idx);
      const position = sameNameIndices.indexOf(dayIndex);
      matchedDay = candidates[position];
      warnings.push(
        `Ambiguous day name "${dayEntry.name}" — matched by position (${position + 1} of ${candidates.length}).`,
      );
    }

    if (matchedDay) usedDayIds.add(matchedDay.id);

    const existingExercises = matchedDay?.exercises ?? [];
    const existingExerciseByName = new Map<string, typeof existingExercises>();
    for (const exercise of existingExercises) {
      const list = existingExerciseByName.get(exercise.exerciseName) ?? [];
      list.push(exercise);
      existingExerciseByName.set(exercise.exerciseName, list);
    }

    const usedAssignmentIds = new Set<string>();
    const formExercises: RoutineDayFormInput["exercises"] = [];

    for (let exerciseIndex = 0; exerciseIndex < dayEntry.exercises.length; exerciseIndex++) {
      const exerciseName = dayEntry.exercises[exerciseIndex];
      const nameMatches = byName.get(exerciseName) ?? [];

      let resolved: Exercise | undefined;
      if (nameMatches.length === 1) {
        resolved = nameMatches[0];
      } else if (nameMatches.length > 1) {
        const sameNameIndices = dayEntry.exercises
          .map((name, idx) => ({ name, idx }))
          .filter(({ name }) => name === exerciseName)
          .map(({ idx }) => idx);
        const position = sameNameIndices.indexOf(exerciseIndex);
        resolved = nameMatches[position];
        warnings.push(
          `Ambiguous exercise name "${exerciseName}" on day "${dayEntry.name}" — matched by position (${position + 1} of ${nameMatches.length}).`,
        );
      }

      if (!resolved) {
        warnings.push(
          `Unknown exercise "${exerciseName}" on day "${dayEntry.name}" — skipped (no matching active exercise).`,
        );
        continue;
      }

      const assignmentCandidates = (existingExerciseByName.get(exerciseName) ?? []).filter(
        (ex) => !usedAssignmentIds.has(ex.id),
      );

      let existingAssignment: (typeof existingExercises)[0] | undefined;
      if (assignmentCandidates.length === 1) {
        existingAssignment = assignmentCandidates[0];
      } else if (assignmentCandidates.length > 1) {
        const sameNameIndices = dayEntry.exercises
          .map((name, idx) => ({ name, idx }))
          .filter(({ name }) => name === exerciseName)
          .map(({ idx }) => idx);
        const position = sameNameIndices.indexOf(exerciseIndex);
        existingAssignment = assignmentCandidates[position];
      }

      if (existingAssignment) {
        usedAssignmentIds.add(existingAssignment.id);
      }

      formExercises.push({
        id: existingAssignment?.id,
        exerciseId: resolved.id,
      });
    }

    formDays.push({
      id: matchedDay?.id,
      name: dayEntry.name,
      exercises: formExercises,
    });
  }

  const formInput: RoutineFormInput = { name: json.name, days: formDays };
  const plan = planRoutineStructureInternal(existingDays, normalizeRoutineForm(formInput), false, activeExercises, new Map());
  plan.warnings = [...warnings, ...plan.warnings];

  return { formInput, plan };
}