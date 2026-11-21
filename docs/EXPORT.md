# Export format (schema 1.0)

A BYO Workouts export is one JSON file. It is the public interchange format: backup, restore, and migration from the old PWA.

## Envelope

| Field | Meaning |
|---|---|
| `schema_version` | `"1.2"` today. Minor versions are additive. `1.0` and `1.1` files still import; a set missing `logged_at` gets `created_at`. |
| `app` | Always `"BYO Workouts"`. |
| `exported_at` | When the file was written, ISO 8601 UTC. |
| Collection arrays | `exercises`, `routines`, `routine_days`, `routine_day_exercises`, `workouts`, `sets`, `defaults`. |

Each array includes soft-deleted rows (`deleted_at` set). Readers may ignore unknown top-level fields. Each record may carry `extensions` for data outside this schema.

Import replaces **all** local data. Ids and timestamps from the file are preserved. A bad file is rejected before anything is written.

Machine-readable schemas live in [`schema/`](../schema/). See [`schema/examples/sample.json`](../schema/examples/sample.json).

## PWA migration

The previous app stored one row per exercise log (`workout_logs`), weight in **pounds**, and cardio **distance in miles** and **time in minutes**. It had no workout sessions.

The converter in [`src/export/fromPwa.ts`](../src/export/fromPwa.ts) (CLI: [`scripts/pwa-export/cli.ts`](../scripts/pwa-export/cli.ts)) maps a PWA export JSON file into this format:

- Logs on the same calendar day (in your chosen IANA timezone) become one **workout** with `started_at` / `ended_at` from the earliest and latest log that day.
- Each log becomes one or more **sets** (`sets` in the log expands to identical rows). Weight → kg, miles → m, minutes → s (three decimal places).
- Exercise `type` and `logged_field_defs` are kept under `exercise.extensions.pwa`. Each set keeps the original log under `set.extensions.pwa`.

On the phone you can import the PWA Settings → **Export all data** JSON directly; the app converts it using the device time zone (same rules as the CLI). Or pre-convert with the CLI and `--timezone` when you want an explicit zone.