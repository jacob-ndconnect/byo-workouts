import type { Migration } from "./types";

export const migration12: Migration = {
  version: "1.2",
  sql: `
ALTER TABLE sets ADD COLUMN logged_at TEXT NOT NULL DEFAULT '';
UPDATE sets SET logged_at = created_at;
UPDATE meta SET schema_version = '1.2' WHERE id = 1;
`,
};
