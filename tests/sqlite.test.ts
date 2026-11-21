import { describe, expect, it } from "@jest/globals";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { createSqliteRepository } from "@/data/adapters/sqlite";
import { sqliteSchema } from "@/data/adapters/sqlite/schema";
import { migration10 } from "@/data/migrations/1.0";
import { migration11 } from "@/data/migrations/1.1";
import { appMigrations } from "@/data/migrations";
import {
  migrationClientFromBetterSqlite3,
  runMigrations,
} from "@/data/migrations/run";

import { migration13 } from "./migrations/1.3";
import { registerRepositoryContract } from "./repository.contract";

function openMemoryDatabase(migrations = appMigrations) {
  const native = new Database(":memory:");
  runMigrations(migrationClientFromBetterSqlite3(native), migrations);
  const db = drizzle(native, { schema: sqliteSchema });
  return { native, db };
}

registerRepositoryContract((clock) => createSqliteRepository(openMemoryDatabase().db, clock));

describe("sqlite migrations", () => {
  it("backfills logged_at from created_at and applies a later migration", async () => {
    const { native } = openMemoryDatabase([migration10, migration11]);
    const repo = createSqliteRepository(drizzle(native, { schema: sqliteSchema }));
    const before = await repo.create("defaults", { default_sets: 2, default_reps: 5 });
    const loggedAt = "2026-03-01T14:30:00.000Z";
    native
      .prepare(
        `INSERT INTO sets (
          id, created_at, updated_at, workout_id, exercise_id, sort_order, tracking_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run("set-1", loggedAt, loggedAt, "workout-1", "exercise-1", 0, "resistance");

    runMigrations(migrationClientFromBetterSqlite3(native), [...appMigrations, migration13]);

    const version = native
      .prepare("SELECT schema_version FROM meta WHERE id = 1")
      .get() as { schema_version: string };
    expect(version.schema_version).toBe("1.3");

    const row = native
      .prepare("SELECT id, migration_probe FROM defaults WHERE id = ?")
      .get(before.id) as { id: string; migration_probe: string | null };
    expect(row.id).toBe(before.id);
    expect(row.migration_probe).toBeNull();

    const set = native.prepare("SELECT logged_at FROM sets WHERE id = ?").get("set-1") as {
      logged_at: string;
    };
    expect(set.logged_at).toBe(loggedAt);
  });
});
