import {
  assembleRoutineDays,
  planRoutineFormSave,
  planRoutineJsonSave,
  parseRoutineJsonText,
  toRoutineJson,
  type AssembledRoutineDay,
  type RoutineFormInput,
  type RoutineStructurePlan,
} from "@/core/logic/routineEditor";
import type { Exercise, Routine } from "@/core/types";
import type { Repository } from "@/data/repository";

export type RoutineSummary = Pick<Routine, "id" | "name" | "active" | "archived">;

export async function listRoutineSummaries(
  repo: Repository,
  archived: boolean,
): Promise<RoutineSummary[]> {
  const routines = await repo.list("routines");
  return routines
    .filter((r) => r.archived === archived)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((r) => ({ id: r.id, name: r.name, active: r.active, archived: r.archived }));
}

export async function createRoutine(repo: Repository, name: string): Promise<Routine> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");
  return repo.create("routines", {
    name: trimmed,
    active: false,
    archived: false,
  });
}

export async function setActiveRoutine(repo: Repository, routineId: string): Promise<void> {
  const target = await repo.get("routines", routineId);
  if (!target) throw new Error("Routine not found");
  if (target.archived) throw new Error("Cannot activate an archived routine");

  const routines = await repo.list("routines");
  await Promise.all(
    routines
      .filter((r) => r.active && r.id !== routineId)
      .map((r) => repo.update("routines", r.id, { active: false })),
  );
  await repo.update("routines", routineId, { active: true });
}

export async function setRoutineArchived(
  repo: Repository,
  id: string,
  archived: boolean,
): Promise<void> {
  if (archived) {
    await repo.update("routines", id, { archived: true, active: false });
    return;
  }
  await repo.update("routines", id, { archived: false });
}

export async function loadAssembledRoutineDays(
  repo: Repository,
  routineId: string,
): Promise<{ routineName: string; days: AssembledRoutineDay[] }> {
  const routine = await repo.get("routines", routineId);
  if (!routine) throw new Error("Routine not found");

  const [allDays, allSlots, exercises] = await Promise.all([
    repo.list("routine_days"),
    repo.list("routine_day_exercises"),
    repo.list("exercises"),
  ]);

  const days = allDays.filter((d) => d.routine_id === routineId);
  const dayIds = new Set(days.map((d) => d.id));
  const slots = allSlots.filter((s) => dayIds.has(s.routine_day_id));

  return {
    routineName: routine.name,
    days: assembleRoutineDays(days, slots, exercises),
  };
}

async function applyRoutineStructurePlan(
  repo: Repository,
  routineId: string,
  plan: RoutineStructurePlan,
): Promise<void> {
  await repo.update("routines", routineId, { name: plan.routineName });

  for (const slotId of plan.deleteSlotIds) {
    await repo.delete("routine_day_exercises", slotId);
  }
  for (const dayId of plan.deleteDayIds) {
    await repo.delete("routine_days", dayId);
  }

  for (const dayPlan of plan.days) {
    let dayId = dayPlan.dayId;
    if (dayId) {
      await repo.update("routine_days", dayId, {
        name: dayPlan.name,
        sort_order: dayPlan.sortOrder,
      });
    } else {
      const created = await repo.create("routine_days", {
        routine_id: routineId,
        name: dayPlan.name,
        sort_order: dayPlan.sortOrder,
      });
      dayId = created.id;
    }

    for (const exPlan of dayPlan.exercises) {
      if (exPlan.slotId) {
        await repo.update("routine_day_exercises", exPlan.slotId, {
          exercise_id: exPlan.exerciseId,
          sort_order: exPlan.sortOrder,
        });
      } else {
        await repo.create("routine_day_exercises", {
          routine_day_id: dayId,
          exercise_id: exPlan.exerciseId,
          sort_order: exPlan.sortOrder,
        });
      }
    }
  }
}

export async function saveRoutineFromForm(
  repo: Repository,
  routineId: string,
  input: RoutineFormInput,
): Promise<{ warnings: string[] }> {
  const { days } = await loadAssembledRoutineDays(repo, routineId);
  const plan = planRoutineFormSave(days, input);
  await applyRoutineStructurePlan(repo, routineId, plan);
  return { warnings: plan.warnings };
}

export async function routineJsonText(repo: Repository, routineId: string): Promise<string> {
  const { routineName, days } = await loadAssembledRoutineDays(repo, routineId);
  return JSON.stringify(toRoutineJson(routineName, days), null, 2);
}

export async function saveRoutineFromJson(
  repo: Repository,
  routineId: string,
  jsonText: string,
): Promise<{ warnings: string[] }> {
  const json = parseRoutineJsonText(jsonText);
  const { days } = await loadAssembledRoutineDays(repo, routineId);
  const exercises = (await repo.list("exercises")).filter((e) => !e.archived);
  const { plan } = planRoutineJsonSave(days, json, exercises);
  await applyRoutineStructurePlan(repo, routineId, plan);
  return { warnings: plan.warnings };
}

export async function listActiveExercises(repo: Repository): Promise<Exercise[]> {
  return listExercisesForSettings(repo, false);
}

async function listExercisesForSettings(repo: Repository, archived: boolean): Promise<Exercise[]> {
  const all = await repo.list("exercises");
  return all.filter((e) => e.archived === archived).sort((a, b) => a.name.localeCompare(b.name));
}