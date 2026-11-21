import { describe, expect, it } from "@jest/globals";

import { createMemoryRepository } from "@/data/adapters/memory";
import { ExportFormatError } from "@/export";
import {
  exportDocument,
  exportDocumentsEqual,
  importDocument,
  parseExportJson,
  serializeExportDocument,
} from "@/export/document";

const EXPORTED_AT = "2026-06-01T12:00:00.000Z";
const STARTED_AT = "2026-01-01T00:00:00.000Z";

describe("export round-trip", () => {
  it("export, wipe via import into empty repo, and re-export match", async () => {
    let ms = Date.parse(STARTED_AT);
    const repoA = createMemoryRepository({
      now: () => new Date(ms).toISOString(),
    });
  const repoB = createMemoryRepository({
      now: () => new Date(ms).toISOString(),
    });

    const exercise = await repoA.create("exercises", {
      name: "Bench",
      tracking_mode: "resistance",
      archived: false,
      logged_fields: [],
      settings_fields: {},
      extensions: { "example.app": { note: "keep me" } },
    });
    await repoA.delete("exercises", exercise.id);
    await repoA.create("defaults", { default_sets: 4, default_reps: 8 });

    const first = await exportDocument(repoA, EXPORTED_AT);
    await importDocument(repoB, first);
    const second = await exportDocument(repoB, EXPORTED_AT);

    expect(second).toEqual(first);
    expect(await repoB.list("exercises")).toEqual([]);
    const tombstones = await repoB.changesSince("exercises", "");
    expect(tombstones).toHaveLength(1);
    expect(tombstones[0]?.extensions).toEqual({ "example.app": { note: "keep me" } });
  });

  it("parse and serialize preserve data", () => {
    const text = serializeExportDocument({
      schema_version: "1.0",
      app: "BYO Workouts",
      exported_at: EXPORTED_AT,
      exercises: [],
      routines: [],
      routine_days: [],
      routine_day_exercises: [],
      workouts: [],
      sets: [],
      defaults: [],
    });
    const parsed = parseExportJson(text);
    expect(parsed.app).toBe("BYO Workouts");
  });

  it("rejects a bad schema_version before writing", async () => {
    const repo = createMemoryRepository();
    await repo.create("defaults", { default_sets: 3, default_reps: 10 });
    await expect(
      importDocument(repo, {
        schema_version: "9.9",
        app: "BYO Workouts",
        exported_at: EXPORTED_AT,
        exercises: [],
        routines: [],
        routine_days: [],
        routine_day_exercises: [],
        workouts: [],
        sets: [],
        defaults: [],
      }),
    ).rejects.toBeInstanceOf(ExportFormatError);
    expect(await repo.list("defaults")).toHaveLength(1);
  });
});