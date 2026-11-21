import { getGymDateKey } from "@/core/gymDay";

export type ThisWeekDay = {
  date: string;
  trained: boolean;
  cardio: boolean;
  isToday: boolean;
};

export type ThisWeekWorkouts = {
  days: ThisWeekDay[];
  trainedCount: number;
};

export type WeekLog = {
  loggedAt: Date;
  isCardio: boolean;
};

export type WeekBounds = {
  dates: string[];
};

export function thisWeekFromLogs(
  logs: WeekLog[],
  timeZone: string,
  week: WeekBounds,
): ThisWeekWorkouts {
  const today = getGymDateKey(timeZone);
  const trained = new Set<string>();
  const cardio = new Set<string>();

  for (const log of logs) {
    const date = getGymDateKey(timeZone, log.loggedAt);
    trained.add(date);
    if (log.isCardio) cardio.add(date);
  }

  const days = week.dates.map((date) => ({
    date,
    trained: trained.has(date),
    cardio: cardio.has(date),
    isToday: date === today,
  }));

  return {
    days,
    trainedCount: days.filter((day) => day.trained).length,
  };
}