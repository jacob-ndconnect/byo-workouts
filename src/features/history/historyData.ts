import { historyFields, formatSetHistoryLine, formatHistoryDate } from "@/core/logic/history";
import { measuresFromParsed, parseLogFormValues, setToFormValues } from "@/core/logic/logForm";
import { deviceTimeZone, isIsoUtc, nowIso } from "@/core/time";
import type { Repository } from "@/data/repository";

export type HistoryEntry = {
  id: string;
  loggedAt: string;
  exerciseName: string;
  valuesDisplay: string;
  dateLabel: string;
};

export async function listHistoryEntries(
  repo: Repository,
  timeZone = deviceTimeZone(),
): Promise<HistoryEntry[]> {
  const [sets, exercises] = await Promise.all([repo.list("sets"), repo.list("exercises")]);
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  return sets.map((set) => {
    const exercise = exerciseById.get(set.exercise_id) ?? null;
    return {
      id: set.id,
      loggedAt: set.logged_at,
      exerciseName: exercise?.name ?? "Unknown",
      valuesDisplay: formatSetHistoryLine(exercise, set),
      dateLabel: formatHistoryDate(set.logged_at, timeZone),
    };
  });
}

export type LoggedSetEditor = {
  exerciseName: string;
  fields: string[];
  values: Record<string, string>;
  loggedAt: Date;
};

export async function getLoggedSetEditor(
  repo: Repository,
  setId: string,
): Promise<LoggedSetEditor | null> {
  const set = await repo.get("sets", setId);
  if (!set) return null;
  const exercise = await repo.get("exercises", set.exercise_id);
  const fields = historyFields(exercise, set.tracking_mode);
  return {
    exerciseName: exercise?.name ?? "Unknown",
    fields,
    values: setToFormValues(fields, set),
    loggedAt: new Date(set.logged_at),
  };
}

export async function updateLoggedSet(
  repo: Repository,
  input: {
    setId: string;
    rawValues: Record<string, string>;
    loggedAt: Date;
  },
): Promise<void> {
  const set = await repo.get("sets", input.setId);
  if (!set) throw new Error("Set not found");
  const exercise = await repo.get("exercises", set.exercise_id);

  const fields = historyFields(exercise, set.tracking_mode);
  const parsed = parseLogFormValues(fields, input.rawValues);
  if (Object.keys(parsed).length === 0) {
    throw new Error("Enter at least one value");
  }

  const loggedAt = nowIso(input.loggedAt);
  if (!isIsoUtc(loggedAt)) {
    throw new Error("Enter a valid date and time");
  }

  const measures = measuresFromParsed(set.tracking_mode, parsed);
  await repo.update("sets", input.setId, {
    ...measures,
    logged_at: loggedAt,
  });
}
