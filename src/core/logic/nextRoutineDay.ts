export type RoutineDayRef = {
  id: string;
  name: string;
  sort_order: number;
};

export function pickNextRoutineDay(
  days: RoutineDayRef[],
  lastRoutineDayId: string | null,
): RoutineDayRef | null {
  if (days.length === 0) return null;

  const ordered = [...days].sort((a, b) => a.sort_order - b.sort_order);
  if (!lastRoutineDayId) return ordered[0] ?? null;

  const index = ordered.findIndex((day) => day.id === lastRoutineDayId);
  if (index === -1) return ordered[0] ?? null;

  return ordered[(index + 1) % ordered.length] ?? null;
}

/** Stay on today's session day; otherwise advance past the last completed day. */
export function pickHighlightedRoutineDay(
  days: RoutineDayRef[],
  lastRoutineDayId: string | null,
  todaySessionDayId: string | null,
): RoutineDayRef | null {
  if (todaySessionDayId) {
    const current = days.find((day) => day.id === todaySessionDayId);
    if (current) return current;
  }

  return pickNextRoutineDay(days, lastRoutineDayId);
}