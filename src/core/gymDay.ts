/** Local gym-day starts at 4:00. Before that counts as the previous calendar day. */
export const GYM_DAY_START_HOUR = 4;

type CivilDate = {
  year: number;
  month: number;
  day: number;
};

type CivilParts = CivilDate & {
  hour: number;
  minute: number;
  second: number;
};

function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function parseTimeZone(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!isValidTimeZone(trimmed)) return null;
  return trimmed;
}

function civilPartsInTimeZone(date: Date, timeZone: string): CivilParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = civilPartsInTimeZone(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

function zonedCivilTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstPass = wallAsUtc - timeZoneOffsetMs(new Date(wallAsUtc), timeZone);
  return new Date(wallAsUtc - timeZoneOffsetMs(new Date(firstPass), timeZone));
}

function addCivilDays(date: CivilDate, days: number): CivilDate {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function formatCivilDate(date: CivilDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

function sundayWeekday(date: CivilDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

function gymCivilDateInTimeZone(
  date: Date,
  timeZone: string,
  dayStartHour: number,
): CivilDate {
  const parts = civilPartsInTimeZone(date, timeZone);
  if (parts.hour < dayStartHour) {
    return addCivilDays(parts, -1);
  }
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function getGymDateKey(
  timeZone: string,
  date = new Date(),
  dayStartHour = GYM_DAY_START_HOUR,
): string {
  const zone = parseTimeZone(timeZone) ?? "UTC";
  return formatCivilDate(gymCivilDateInTimeZone(date, zone, dayStartHour));
}

export function getDayBoundsInTimeZone(
  timeZone: string,
  date = new Date(),
  dayStartHour = GYM_DAY_START_HOUR,
): { start: Date; end: Date } {
  const zone = parseTimeZone(timeZone) ?? "UTC";
  const gym = gymCivilDateInTimeZone(date, zone, dayStartHour);
  const next = addCivilDays(gym, 1);
  return {
    start: zonedCivilTimeToUtc(zone, gym.year, gym.month, gym.day, dayStartHour),
    end: zonedCivilTimeToUtc(zone, next.year, next.month, next.day, dayStartHour),
  };
}

export function getWeekBoundsInTimeZone(
  timeZone: string,
  date = new Date(),
  dayStartHour = GYM_DAY_START_HOUR,
): { start: Date; end: Date; dates: string[] } {
  const zone = parseTimeZone(timeZone) ?? "UTC";
  const gym = gymCivilDateInTimeZone(date, zone, dayStartHour);
  const sunday = addCivilDays(gym, -sundayWeekday(gym));
  const dates = Array.from({ length: 7 }, (_, index) =>
    formatCivilDate(addCivilDays(sunday, index)),
  );
  const nextSunday = addCivilDays(sunday, 7);
  return {
    start: zonedCivilTimeToUtc(zone, sunday.year, sunday.month, sunday.day, dayStartHour),
    end: zonedCivilTimeToUtc(
      zone,
      nextSunday.year,
      nextSunday.month,
      nextSunday.day,
      dayStartHour,
    ),
    dates,
  };
}