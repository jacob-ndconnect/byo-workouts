import type { Exercise, SetEntry, TrackingMode } from "@/core/types";

import { defaultLoggedFields, formatFieldLabel, resolveLoggedFields } from "./logFields";
import { formatExerciseHeroValue, setToFormValues } from "./logForm";

export type HistorySortKey = "date-desc" | "date-asc" | "exercise-asc" | "exercise-desc";

export const HISTORY_SORT_OPTIONS: { value: HistorySortKey; label: string }[] = [
  { value: "date-desc", label: "Date (newest)" },
  { value: "date-asc", label: "Date (oldest)" },
  { value: "exercise-asc", label: "Exercise (A–Z)" },
  { value: "exercise-desc", label: "Exercise (Z–A)" },
];

/** Log form fields for a stored set. The sets count is only used when creating rows. */
export function historyFields(exercise: Exercise | null, mode: TrackingMode): string[] {
  const fields = exercise ? resolveLoggedFields(exercise) : defaultLoggedFields(mode);
  return fields.filter((field) => field !== "sets");
}

export function formatSetHistoryLine(exercise: Exercise | null, set: SetEntry): string {
  const fields = historyFields(exercise, set.tracking_mode);
  const values = setToFormValues(fields, set);
  const parts = fields
    .map((field) => {
      const raw = values[field]?.trim();
      if (!raw) return null;
      return `${formatFieldLabel(field)} ${formatExerciseHeroValue(field, raw)}`;
    })
    .filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function formatHistoryDate(loggedAt: string, timeZone?: string): string {
  const date = new Date(loggedAt);
  if (Number.isNaN(date.getTime())) return loggedAt;
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function sortHistoryEntries<T extends { loggedAt: string; exerciseName: string }>(
  entries: T[],
  sortKey: HistorySortKey,
): T[] {
  const sorted = [...entries];
  switch (sortKey) {
    case "date-desc":
      return sorted.sort(
        (a, b) =>
          b.loggedAt.localeCompare(a.loggedAt) || a.exerciseName.localeCompare(b.exerciseName),
      );
    case "date-asc":
      return sorted.sort(
        (a, b) =>
          a.loggedAt.localeCompare(b.loggedAt) || a.exerciseName.localeCompare(b.exerciseName),
      );
    case "exercise-asc":
      return sorted.sort(
        (a, b) =>
          a.exerciseName.localeCompare(b.exerciseName) || b.loggedAt.localeCompare(a.loggedAt),
      );
    case "exercise-desc":
      return sorted.sort(
        (a, b) =>
          b.exerciseName.localeCompare(a.exerciseName) || b.loggedAt.localeCompare(a.loggedAt),
      );
  }
}
