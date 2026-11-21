import type { Migration } from "@/data/migrations/types";

/** Test-only migration. Never ship in appMigrations. */
export const migration12: Migration = {
  version: "1.2",
  sql: `
ALTER TABLE defaults ADD COLUMN migration_probe TEXT;
UPDATE meta SET schema_version = '1.2' WHERE id = 1;
`,
};