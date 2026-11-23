import {
  exercisePatchFromJsonEntry,
  exerciseRecordFieldsFromForm,
  normalizeExerciseForm,
  parseExercisesJsonText,
  planExercisesJsonSave,
  toExerciseJson,
  type ExerciseFormInput,
} from "@/core/logic/exerciseLibrary";
import type { Exercise } from "@/core/types";
import type { Repository } from "@/data/repository";

export async function listExercisesForSettings(
  repo: Repository,
  archived: boolean,
): Promise<Exercise[]> {
  const all = await repo.list("exercises");
  return all.filter((e) => e.archived === archived).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createExerciseFromForm(repo: Repository, input: ExerciseFormInput): Promise<Exercise> {
  const normalized = normalizeExerciseForm(input);
  const fields = exerciseRecordFieldsFromForm(normalized, false, null);
  return repo.create("exercises", {
    ...fields,
    archived: false,
  });
}

export async function updateExerciseFromForm(
  repo: Repository,
  id: string,
  input: ExerciseFormInput,
): Promise<Exercise> {
  const existing = await repo.get("exercises", id);
  if (!existing) throw new Error("Exercise not found");
  const normalized = normalizeExerciseForm(input);
  const fields = exerciseRecordFieldsFromForm(normalized, existing.archived, existing.extensions);
  return repo.update("exercises", id, fields);
}

export async function setExerciseArchived(repo: Repository, id: string, archived: boolean): Promise<void> {
  await repo.update("exercises", id, { archived });
}

export async function exercisesJsonText(repo: Repository, archived: boolean): Promise<string> {
  const exercises = await listExercisesForSettings(repo, archived);
  return JSON.stringify(exercises.map(toExerciseJson), null, 2);
}

export async function saveExercisesJson(
  repo: Repository,
  jsonText: string,
  viewArchived: boolean,
): Promise<{ warnings: string[] }> {
  const entries = parseExercisesJsonText(jsonText);
  const scoped = await listExercisesForSettings(repo, viewArchived);
  const { mutations, warnings } = planExercisesJsonSave(entries, scoped, viewArchived);

  for (const mutation of mutations) {
    if (mutation.action === "create") {
      const patch = exercisePatchFromJsonEntry(mutation.entry, null);
      await repo.create("exercises", patch);
    } else {
      const existing = await repo.get("exercises", mutation.id);
      const patch = exercisePatchFromJsonEntry(
        mutation.entry,
        existing?.extensions ?? null,
      );
      await repo.update("exercises", mutation.id, patch);
    }
  }

  return { warnings };
}