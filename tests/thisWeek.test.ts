import { describe, expect, it } from "@jest/globals";

import { getWeekBoundsInTimeZone } from "@/core/gymDay";
import { thisWeekFromLogs } from "@/core/logic/thisWeek";

describe("thisWeekFromLogs", () => {
  const timeZone = "UTC";
  const week = getWeekBoundsInTimeZone(timeZone, new Date("2026-08-26T12:00:00.000Z"), 0);

  it("marks trained and cardio from logs", () => {
    const result = thisWeekFromLogs(
      [
        { loggedAt: new Date("2026-08-24T12:00:00.000Z"), isCardio: false },
        { loggedAt: new Date("2026-08-25T12:00:00.000Z"), isCardio: true },
      ],
      timeZone,
      week,
    );

    const byDate = Object.fromEntries(result.days.map((day) => [day.date, day]));

    expect(byDate["2026-08-24"]).toMatchObject({ trained: true, cardio: false });
    expect(byDate["2026-08-25"]).toMatchObject({ trained: true, cardio: true });
    expect(result.trainedCount).toBe(2);
  });
});