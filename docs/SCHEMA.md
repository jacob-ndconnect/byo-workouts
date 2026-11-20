# Schema 1.0

The record types in `src/core/types` are the seed of the public schema. Field names are snake_case so the database, the export file, and the API can use one shape. Every record also has `id` (UUIDv7), `created_at`, `updated_at`, `deleted_at`, and `extensions`.

`deleted_at` is a sync tombstone. A row with it set is gone from `list` and `get`, and still returned by `changesSince`. `archived` is different: the person hid the exercise or routine, and it is still there.

`extensions` holds JSON keys this schema does not define. Names are prefixed by whoever added them. Null means there are none. Readers ignore unknown top-level fields. Writers keep `extensions` when they did not intend to change it.

Weights are kilograms, distances are meters, and durations are seconds. The old PWA stored bare numbers and labeled weight as pounds. Converting those rows is part of the phase 3 import, not this schema.

The repository does not check that ids point at a live row. A set can be saved before its workout exists in the same batch. Callers that care about that check it themselves.

## exercises

A movement the person can log.

| Field | Why |
|---|---|
| `name` | What they see in the list. |
| `tracking_mode` | Which measures a set of this exercise uses: `resistance` (barbell, dumbbell, cable, machine), `bodyweight`, `duration`, or `distance`. |
| `archived` | Hidden from use, still in history. |
| `settings_fields` | Setup that stays put between sets, such as seat position or a pin. A map of strings. |

The PWA's `type` (`machine`, `other`, `cardio`) and `logged_field_defs` are not fields here. The mode decides the measures. Phase 3 maps `machine` to `resistance`, a cardio entry that has a distance to `distance`, and a time-only cardio entry to `duration`.

## routines

A named program.

| Field | Why |
|---|---|
| `name` | The program's name. |
| `active` | The program they are currently following. More than one may be active. |
| `archived` | Hidden, not deleted. |

## routine_days

One day inside a routine.

| Field | Why |
|---|---|
| `routine_id` | The routine this day belongs to. |
| `name` | The day label, such as "Push" or "Monday". |
| `sort_order` | Position within the routine. |

## routine_day_exercises

One planned exercise on a routine day.

| Field | Why |
|---|---|
| `routine_day_id` | The day. |
| `exercise_id` | The exercise. |
| `sort_order` | Position within the day. |

## workouts

One training session. Sets point at a workout, so two sessions on the same day stay separate, and a session can cross midnight.

| Field | Why |
|---|---|
| `started_at` | When the session started. |
| `ended_at` | When it finished. Null while it is in progress. |
| `routine_day_id` | The routine day they started from, if any. |
| `note` | Optional note on the whole session. |

## sets

One performed effort. A screen can still offer "4 × 8" and write four identical rows. Callers leave measures that do not apply to the mode as null; the repository stores the numbers it is given. The mode is copied onto the set so a later edit to the exercise does not change old logs.

| Field | Why |
|---|---|
| `workout_id` | The session. |
| `exercise_id` | The movement. |
| `routine_day_exercise_id` | The planned slot this set fulfilled, when it came from a routine. Null for an exercise added during the session. Needed when the same exercise is planned twice in one day. |
| `sort_order` | Order within the workout. |
| `tracking_mode` | The mode at log time. |
| `weight_kg` | Load for `resistance`. Null otherwise. |
| `reps` | Repetitions for `resistance` and `bodyweight`. Null otherwise. |
| `added_weight_kg` | Extra load on a `bodyweight` exercise, such as a vest. Null when there is none. |
| `seconds` | Duration for `duration` and `distance`. |
| `meters` | Distance for `distance`. |
| `kind` | `warmup`, `work`, `drop`, or `failure`. Null when unmarked. |
| `note` | Optional note on this set. |

## defaults

The numbers used to prefill a new resistance set. Stored as a record so it syncs like everything else. One row is the normal case.

| Field | Why |
|---|---|
| `default_sets` | How many sets to offer. |
| `default_reps` | How many reps to offer. |

## Not in 1.0

Effort scores (RPE and reps in reserve), muscle tags, equipment tags, target prescriptions on a routine slot, and rest timers. Each of those can be added later without changing the meaning of a field above.
