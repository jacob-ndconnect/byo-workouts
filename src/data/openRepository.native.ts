import { nowIso } from "@/core/time";
import { createSqliteRepository } from "@/data/adapters/sqlite";
import { sqliteSchema } from "@/data/adapters/sqlite/schema";
import { appMigrations } from "@/data/migrations";
import { migrationClientFromExpo, runMigrations } from "@/data/migrations/run";
import type { Repository } from "@/data/repository";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

const DATABASE_NAME = "byo-workouts.db";

let repository: Repository | null = null;

export function openRepository(): Repository {
  if (!repository) {
    const native = openDatabaseSync(DATABASE_NAME);
    runMigrations(migrationClientFromExpo(native), appMigrations);
    const db = drizzle(native, { schema: sqliteSchema });
    repository = createSqliteRepository(db, { now: nowIso });
  }
  return repository;
}