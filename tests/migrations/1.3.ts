import type { Migration } from "@/data/migrations/types";

/** Test-only migration. Never ship in appMigrations. */
export const migration13: Migration = {
  version: "1.3",
  sql: `
ALTER TABLE defaults ADD COLUMN migration_probe TEXT;
UPDATE meta SET schema_version = '1.3' WHERE id = 1;
`,
};
