import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

function baseColumns() {
  return {
    id: text("id").primaryKey().notNull(),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
    deleted_at: text("deleted_at"),
    extensions: text("extensions"),
  };
}

export const meta = sqliteTable("meta", {
  id: integer("id").primaryKey().notNull(),
  schema_version: text("schema_version").notNull(),
});

export const exercises = sqliteTable("exercises", {
  ...baseColumns(),
  name: text("name").notNull(),
  tracking_mode: text("tracking_mode").notNull(),
  archived: integer("archived").notNull(),
  logged_fields: text("logged_fields").notNull(),
  settings_fields: text("settings_fields").notNull(),
});

export const routines = sqliteTable("routines", {
  ...baseColumns(),
  name: text("name").notNull(),
  active: integer("active").notNull(),
  archived: integer("archived").notNull(),
});

export const routineDays = sqliteTable("routine_days", {
  ...baseColumns(),
  routine_id: text("routine_id").notNull(),
  name: text("name").notNull(),
  sort_order: integer("sort_order").notNull(),
});

export const routineDayExercises = sqliteTable("routine_day_exercises", {
  ...baseColumns(),
  routine_day_id: text("routine_day_id").notNull(),
  exercise_id: text("exercise_id").notNull(),
  sort_order: integer("sort_order").notNull(),
});

export const workouts = sqliteTable("workouts", {
  ...baseColumns(),
  started_at: text("started_at").notNull(),
  ended_at: text("ended_at"),
  routine_day_id: text("routine_day_id"),
  note: text("note"),
});

export const sets = sqliteTable("sets", {
  ...baseColumns(),
  workout_id: text("workout_id").notNull(),
  exercise_id: text("exercise_id").notNull(),
  logged_at: text("logged_at").notNull(),
  routine_day_exercise_id: text("routine_day_exercise_id"),
  sort_order: integer("sort_order").notNull(),
  tracking_mode: text("tracking_mode").notNull(),
  weight_kg: real("weight_kg"),
  reps: integer("reps"),
  added_weight_kg: real("added_weight_kg"),
  seconds: real("seconds"),
  meters: real("meters"),
  kind: text("kind"),
  note: text("note"),
  extra_values: text("extra_values"),
});

export const defaults = sqliteTable("defaults", {
  ...baseColumns(),
  default_sets: integer("default_sets").notNull(),
  default_reps: integer("default_reps").notNull(),
});

export const sqliteSchema = {
  meta,
  exercises,
  routines,
  routine_days: routineDays,
  routine_day_exercises: routineDayExercises,
  workouts,
  sets,
  defaults,
};