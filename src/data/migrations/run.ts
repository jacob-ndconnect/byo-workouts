import type BetterSqlite3 from "better-sqlite3";
import type { SQLiteDatabase } from "expo-sqlite";

import type { Migration } from "./types";

export type MigrationClient = {
  exec: (sql: string) => void;
  transaction: (fn: () => void) => void;
  readSchemaVersion: () => string | null;
};

function parseVersion(version: string): [number, number] {
  const [major, minor = "0"] = version.split(".");
  return [Number(major), Number(minor)];
}

function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor] = parseVersion(a);
  const [bMajor, bMinor] = parseVersion(b);
  if (aMajor !== bMajor) return aMajor - bMajor;
  return aMinor - bMinor;
}

export function runMigrations(client: MigrationClient, migrations: Migration[]): void {
  const sorted = [...migrations].sort((a, b) => compareVersions(a.version, b.version));
  const current = client.readSchemaVersion() ?? "0.0";

  for (const migration of sorted) {
    if (compareVersions(migration.version, current) <= 0) continue;
    client.transaction(() => {
      client.exec(migration.sql);
    });
  }
}

export function migrationClientFromBetterSqlite3(
  native: BetterSqlite3.Database,
): MigrationClient {
  return {
    exec(sql) {
      native.exec(sql);
    },
    transaction(fn) {
      native.transaction(fn)();
    },
    readSchemaVersion() {
      try {
        const row = native
          .prepare("SELECT schema_version AS schema_version FROM meta WHERE id = 1")
          .get() as { schema_version: string } | undefined;
        return row?.schema_version ?? null;
      } catch {
        return null;
      }
    },
  };
}

export function migrationClientFromExpo(native: SQLiteDatabase): MigrationClient {
  return {
    exec(sql) {
      native.execSync(sql);
    },
    transaction(fn) {
      native.withTransactionSync(fn);
    },
    readSchemaVersion() {
      try {
        return (
          native.getFirstSync<{ schema_version: string }>(
            "SELECT schema_version FROM meta WHERE id = 1",
          )?.schema_version ?? null
        );
      } catch {
        return null;
      }
    },
  };
}