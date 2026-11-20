import { describe, expect, it } from "@jest/globals";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { createSqliteRepository } from "@/data/adapters/sqlite";
import { sqliteSchema } from "@/data/adapters/sqlite/schema";
import { migration10 } from "@/data/migrations/1.0";
import {
  migrationClientFromBetterSqlite3,
  runMigrations,
} from "@/data/migrations/run";

import { migration11 } from "./migrations/1.1";
import { registerRepositoryContract } from "./repository.contract";

function openMemoryDatabase(migrations = [migration10]) {
  const native = new Database(":memory:");
  runMigrations(migrationClientFromBetterSqlite3(native), migrations);
  const db = drizzle(native, { schema: sqliteSchema });
  return { native, db };
}

registerRepositoryContract((clock) => createSqliteRepository(openMemoryDatabase().db, clock));

describe("sqlite migrations", () => {
  it("migrates from 1.0 to 1.1 with existing data", async () => {
    const { native } = openMemoryDatabase();
    const repo = createSqliteRepository(drizzle(native, { schema: sqliteSchema }));
    const before = await repo.create("defaults", { default_sets: 2, default_reps: 5 });

    runMigrations(migrationClientFromBetterSqlite3(native), [migration10, migration11]);

    const version = native
      .prepare("SELECT schema_version FROM meta WHERE id = 1")
      .get() as { schema_version: string };
    expect(version.schema_version).toBe("1.1");

    const row = native
      .prepare("SELECT id, migration_probe FROM defaults WHERE id = ?")
      .get(before.id) as { id: string; migration_probe: string | null };
    expect(row.id).toBe(before.id);
    expect(row.migration_probe).toBeNull();
  });
});