import { getDayBoundsInTimeZone, getWeekBoundsInTimeZone } from "@/core/gymDay";
import { isPwaCardioExercise } from "@/core/logic/pwaCardio";
import {
  pickHighlightedRoutineDay,
  type RoutineDayRef,
} from "@/core/logic/nextRoutineDay";
import { thisWeekFromLogs } from "@/core/logic/thisWeek";
import { deviceTimeZone } from "@/core/time";
import type { Exercise, RoutineDayExercise, SetEntry } from "@/core/types";
import type { Repository } from "@/data/repository";

export type HomeRoutineDayExercise = {
  id: string;
  exerciseName: string;
};

export type HomeRoutineDay = {
  id: string;
  name: string;
  sort_order: number;
  exercises: HomeRoutineDayExercise[];
};

export type HomeScreenData = {
  routine: { id: string; name: string; days: HomeRoutineDay[] } | null;
  nextDay: RoutineDayRef | null;
  thisWeek: ReturnType<typeof thisWeekFromLogs>;
};

function parseInstant(iso: string): Date {
  return new Date(iso);
}

function routineDayIdForSet(
  set: SetEntry,
  slotToDay: Map<string, string>,
): string | null {
  if (!set.routine_day_exercise_id) return null;
  return slotToDay.get(set.routine_day_exercise_id) ?? null;
}

function lastLoggedRoutineDayId(
  sets: SetEntry[],
  slotToDay: Map<string, string>,
): string | null {
  const withSlot = sets
    .filter((s) => s.routine_day_exercise_id)
    .sort((a, b) => b.logged_at.localeCompare(a.logged_at));

  for (const set of withSlot) {
    const dayId = routineDayIdForSet(set, slotToDay);
    if (dayId) return dayId;
  }
  return null;
}

function todaySessionRoutineDayId(
  sets: SetEntry[],
  slotToDay: Map<string, string>,
  timeZone: string,
): string | null {
  const { start, end } = getDayBoundsInTimeZone(timeZone);
  const inSession = sets
    .filter((s) => {
      if (!s.routine_day_exercise_id) return false;
      const at = parseInstant(s.logged_at);
      return at >= start && at < end;
    })
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at));

  for (const set of inSession) {
    const dayId = routineDayIdForSet(set, slotToDay);
    if (dayId) return dayId;
  }
  return null;
}

function weekLogsFromSets(
  sets: SetEntry[],
  exerciseById: Map<string, Exercise>,
  week: ReturnType<typeof getWeekBoundsInTimeZone>,
): { loggedAt: Date; isCardio: boolean }[] {
  return sets
    .filter((set) => {
      const at = parseInstant(set.logged_at);
      return at >= week.start && at < week.end;
    })
    .map((set) => {
      const exercise = exerciseById.get(set.exercise_id);
      return {
        loggedAt: parseInstant(set.logged_at),
        isCardio: exercise ? isPwaCardioExercise(exercise) : false,
      };
    });
}

export async function getHomeScreenData(
  repo: Repository,
  timeZone = deviceTimeZone(),
): Promise<HomeScreenData> {
  const [
    routines,
    routineDays,
    routineDayExercises,
    exercises,
    sets,
  ] = await Promise.all([
    repo.list("routines"),
    repo.list("routine_days"),
    repo.list("routine_day_exercises"),
    repo.list("exercises"),
    repo.list("sets"),
  ]);

  const week = getWeekBoundsInTimeZone(timeZone);
  const exerciseById = new Map(exercises.map((row) => [row.id, row]));
  const slotToDay = new Map(
    routineDayExercises.map((row) => [row.id, row.routine_day_id]),
  );

  const thisWeek = thisWeekFromLogs(
    weekLogsFromSets(sets, exerciseById, week),
    timeZone,
    week,
  );

  const activeRoutine = routines.find((r) => r.active && !r.archived) ?? null;
  if (!activeRoutine) {
    return { routine: null, nextDay: null, thisWeek };
  }

  const daysForRoutine = routineDays
    .filter((d) => d.routine_id === activeRoutine.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const slotsByDay = new Map<string, RoutineDayExercise[]>();
  for (const slot of routineDayExercises) {
    const list = slotsByDay.get(slot.routine_day_id) ?? [];
    list.push(slot);
    slotsByDay.set(slot.routine_day_id, list);
  }

  const homeDays: HomeRoutineDay[] = daysForRoutine.map((day) => {
    const slots = [...(slotsByDay.get(day.id) ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      id: day.id,
      name: day.name,
      sort_order: day.sort_order,
      exercises: slots.map((slot) => ({
        id: slot.id,
        exerciseName: exerciseById.get(slot.exercise_id)?.name ?? "Exercise",
      })),
    };
  });

  const dayRefs: RoutineDayRef[] = homeDays.map((d) => ({
    id: d.id,
    name: d.name,
    sort_order: d.sort_order,
  }));

  const lastDayId = lastLoggedRoutineDayId(sets, slotToDay);
  const todayDayId = todaySessionRoutineDayId(sets, slotToDay, timeZone);
  const nextDay = pickHighlightedRoutineDay(dayRefs, lastDayId, todayDayId);

  return {
    routine: { id: activeRoutine.id, name: activeRoutine.name, days: homeDays },
    nextDay,
    thisWeek,
  };
}