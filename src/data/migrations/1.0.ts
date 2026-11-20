import type { Migration } from "./types";

export const migration10: Migration = {
  version: "1.0",
  sql: `
CREATE TABLE IF NOT EXISTS meta (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  schema_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  extensions TEXT,
  name TEXT NOT NULL,
  tracking_mode TEXT NOT NULL,
  archived INTEGER NOT NULL,
  settings_fields TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  extensions TEXT,
  name TEXT NOT NULL,
  active INTEGER NOT NULL,
  archived INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS routine_days (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  extensions TEXT,
  routine_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS routine_day_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  extensions TEXT,
  routine_day_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  extensions TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  routine_day_id TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS sets (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  extensions TEXT,
  workout_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  routine_day_exercise_id TEXT,
  sort_order INTEGER NOT NULL,
  tracking_mode TEXT NOT NULL,
  weight_kg REAL,
  reps INTEGER,
  added_weight_kg REAL,
  seconds REAL,
  meters REAL,
  kind TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS defaults (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  extensions TEXT,
  default_sets INTEGER NOT NULL,
  default_reps INTEGER NOT NULL
);

INSERT OR REPLACE INTO meta (id, schema_version) VALUES (1, '1.0');
`,
};