import type { Migration } from "./types";

export const migration11: Migration = {
  version: "1.1",
  sql: `
ALTER TABLE exercises ADD COLUMN logged_fields TEXT NOT NULL DEFAULT '[]';
ALTER TABLE sets ADD COLUMN extra_values TEXT;

UPDATE exercises
SET logged_fields = COALESCE(
  json_extract(extensions, '$.pwa.logged_field_defs'),
  '[]'
)
WHERE extensions IS NOT NULL
  AND json_type(json_extract(extensions, '$.pwa.logged_field_defs')) = 'array';

UPDATE meta SET schema_version = '1.1' WHERE id = 1;
`,
};