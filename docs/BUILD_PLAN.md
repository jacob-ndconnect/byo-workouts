# Build plan

The order of work, with what "done" means for each phase. Each phase should leave the app in a state you can run and use. Decisions that are still open are listed in `DECISIONS.md` Part 2. Anything in the "later" phases stays out of the code until its phase starts.

Current phase: **4** (next slice: **4.4** — routines and exercises).

---

## Phase 0: First run

Get the scaffolded app running on your phone and the project docs in place. Follow `docs/SETUP.md`.

**Done when**
- The starter app opens on your iPhone in Expo Go, and in the browser with `w`.
- LICENSE is Apache 2.0, and the docs are committed.
- `npx expo-doctor` and `npx tsc --noEmit` pass.
- `reset-project` has been run and `src/app/` is blank.

---

## Phase 1: Foundations (no real UI yet)

The seams that make sync, export, and the server possible later. All of it is plain TypeScript that can be tested without a device.

**Build**
- `src/config/identity.ts` with the bundle ID (`com.jacobestep.byo.workouts`) and the URL scheme (`byo-workouts`). `app.config.ts` reads them.
- `src/core/ids.ts` (UUIDv7), `src/core/time.ts` (ISO 8601 UTC), `src/core/schemaVersion.ts` (`"1.0"`).
- Record types in `src/core/types`. Every record gets `id`, `created_at`, `updated_at`, `deleted_at`, and a nullable `extensions`. A workout is a session. Sets under it store a tracking mode (`resistance`, `bodyweight`, `duration`, or `distance`) and the measures for that mode. Weights in kg, distances in meters, durations in seconds. See `docs/SCHEMA.md`.
- `src/data/repository.ts`: `list`, `get`, `create`, `update`, `delete` (soft), and `changesSince`.
- `src/data/adapters/memory` as the first implementation.
- A contract test suite that any adapter must pass, and a test runner (jest-expo is the usual choice for Expo; confirm against current docs).
- The ESLint layer rules from `docs/STRUCTURE.md`.

**Done when**
- The contract tests pass against the memory adapter.
- Linting fails on a `react-native` import inside `src/core` and on an adapter import inside `src/features`.
- A short note in `docs/` lists each record type and why each field exists. This is the seed of the public schema. (`docs/SCHEMA.md`)

---

## Phase 2: SQLite storage

**Build**
- `expo-sqlite` and Drizzle (confirm the current Expo SQLite driver in Drizzle's docs before starting).
- `src/data/adapters/sqlite`, with the schema and forward-only migrations in `src/data/migrations`.
- A `meta` table holding the schema version.
- Soft deletes and `updated_at` handled in the adapter, never in the UI.

**Done when**
- The same contract test suite passes against the SQLite adapter.
- Data survives an app restart on your phone.
- A migration from version 1.0 to a trivially changed 1.1 runs cleanly on a database with data in it.

---

## Phase 3: Export, import, and your existing data

**Build**
- `src/export`: export every record to the documented JSON format, and import the same format. Include `schema_version` and the app name in the file.
- `schema/`: a JSON Schema for each record type, plus a sample export.
- `scripts/pwa-export`: reads your Supabase data and writes it in the export format.
- A round-trip test: export, wipe, import, compare.

**Done when**
- Your real workout history is imported into the new app with nothing lost.
- Export, wipe, import gives identical data.
- The schema files validate the sample export.

---

## Phase 4: Feature parity

Rebuild what the PWA does, using the settled UX. Keep to parity. New features wait.

Work in **slices**. Each slice should leave the app runnable on device.

### Slice 4.1 — Native shell and home (done)

**Shipped**
- `expo-router/native-tabs`: **Home**, **History**, **Settings** (same three-tab pattern as the PWA; routines live under Settings).
- Root stack pushes `workout/[dayId]` with the tab bar hidden mid-session.
- Home reads local data: week strip, active routine, next-day highlight, day cards → workout stub.
- Settings grouped list: Exercises, Routines, Defaults, Import, **Connection** (local-only copy). JSON import moved here from the Phase 3 screen.
- PWA-aligned brand colors, card radius, and dark-mode text on grouped surfaces.

**Not in this slice**
- Real workout logging, history, or settings editors. Overlays use native stack / `formSheet` when those flows land (no JS drawer library).

### Slice 4.2 — Mid-workout logging (done)

**Shipped**
- Workout stack under `workout/[dayId]`: session list, exercise screen, `formSheet` flows for log, add exercise, and machine settings (`SheetScaffold`, `fitToContents` sheets).
- **Finish workout** is a native confirmation alert (Cancel / destructive **Finish**), not a sheet.
- Real `workouts` sessions (resume open, finish starts new). Progress and Next use sets on the current workout only.
- Schema **1.1**: `exercises.logged_fields`, `sets.extra_values` (PWA custom fields such as incline).
- iOS session chrome: chevron back, routine subheader, native `...` menu (no selection checkmarks), nested-stack swipe back to the exercise list, floating primary actions without broken blur modules.

**PWA reference:** mid-workout flows in `workout-tracker` (day list, per-exercise log, add exercise).

### Slice 4.3 — History (done)

**Shipped**
- History lists one row per set (exercise, measures, date), sorted from a header menu (newest, oldest, exercise A–Z, Z–A).
- Long-press menu: **Edit** and **Delete**. No trailing buttons. Delete confirms, then soft-deletes.
- Edit is a `formSheet`: date and the exercise’s log fields (the sets count is omitted). Schema **1.2** adds `sets.logged_at` so the date can change without rewriting `created_at`. Home’s week strip reads `logged_at`.
- Mid-workout **Sets** still means “write N identical set rows”; History shows each row. Same as PWA import behavior.

**Not in this slice**
- Export-from-history. Device export stays in settings polish.
- Routine and exercise editors.

### Slice 4.4 — Routines and exercises (next)

**Goal:** Replace the Settings stubs for **Exercises**, **Routines**, and **Defaults** so you can maintain the library and active routine without the PWA. Home should reflect edits (active routine, day cards) on focus like History and Home do today.

**Parity target (PWA)** — use as the planning checklist:

| Area | `workout-tracker` |
|------|-------------------|
| Settings entry points | `app/(app)/settings/exercises/page.tsx`, `.../routines/page.tsx`, `.../defaults/page.tsx` |
| Exercises UI | `components/exercises/exercises-manager.tsx`, `exercise-form.tsx` |
| Routines UI | `components/routines/routines-manager.tsx`, `routine-editor.tsx`, `routine-create-form.tsx` |
| Defaults UI | `components/defaults/defaults-manager.tsx` |
| Data + mutations | `lib/actions/exercises.ts`, `lib/actions/routines.ts`, `lib/actions/defaults.ts` |

**Likely app work (confirm in planning)**

- **Data:** All reads and writes through `openRepository()`. Exercises: create, edit name / tracking / `logged_fields` / `settings_fields`, archive. Routines: create, rename, activate (one active), archive; days and day slots (`routine_days`, `routine_day_exercises`) with sort order. Defaults: update the single `defaults` row (`default_sets`, `default_reps`) used to prefill the log sheet.
- **UI:** `src/app/(tabs)/settings/exercises`, `routines`, `defaults` — grouped lists and native stack / `formSheet` editors, same patterns as workout logging and history edit. Routines may need a dedicated editor stack (days, reorder, pick exercises).
- **Home:** Already loads on focus; no extra channel if editors only touch repository records Home already reads.
- **Import:** Settings import screen is done; editors must not break imported PWA shape (`extensions.pwa`, machine vs tracking mode).

**Explicitly later (slice 4.5 / settings polish)**

- Device JSON export from Settings (PWA has export buttons on settings shell).
- Per-exercise JSON import/export in the managers if PWA has them — port only if you still use that workflow.
- Responsive iPad settings sidebar (native tabs already support `sidebarAdaptable`).

### Remaining phase 4 slices

Suggested order by gym value (adjust as you like):

1. ~~**Mid-workout logging**~~ (4.2, done).
2. ~~**History**~~ (4.3, done).
3. **Routines and exercises** (4.4, current).
4. **Settings polish** (4.5) — export UI, sidebar, anything left from PWA settings.

Defer until core flows work: web memory smoke tests, JSON export from device, trends/analytics if the PWA has them.

**Build** (full phase, unchanged goal)
- Logging a workout (fast, one-handed), exercises, routines, history, and whatever trend views you use today.
- Settings, including a **Connection** screen that says the app is running locally.
- Responsive layouts: tabs on a phone, sidebar on wide screens where the platform provides it.
- Web: until the server exists, run the web UI against the memory adapter for layout work. A browser-storage adapter is an option if you want the web version usable on its own (DECISIONS C).

**Done when** (phase 4 complete)
- You can log a full workout, edit a routine, and review history without opening the old PWA.
- The app is usable one-handed, in a gym, with bad signal.

---

## Phase 5: Dogfood

Use it for real workouts for a few weeks. Nothing new gets built except fixes.

**Done when**
- You've stopped using the PWA.
- The schema has settled: no migrations needed for a couple of weeks.
- You've decided whether to enroll in the Apple Developer Program, since TestFlight and the App Store need it. The friend on iOS 18 can test through TestFlight at that point.

---

## Phase 6: Native integrations (needs a development build)

Order by value to you, one at a time.

- Rest timer: a local notification, then a Live Activity.
- App Intents: "last workout" and "start workout", exposed to Shortcuts and Siri.
- A widget.
- HealthKit: write finished workouts.
- Spotlight indexing.
- The full bookmarked list is in the project notes.

Each newer-iOS feature goes behind the one version-check helper, with an iOS 18 fallback.

**Done when**
- Each feature works on an iOS 18 simulator (with its fallback) and on your own phone.

---

## Phase 7: Server and pairing

Only after the local app is stable.

**Build**
- Spike first: deploy a minimal Expo server-output app with an API route to Vercel, and confirm the one-click deploy works end to end.
- `src/app/api/`: CRUD routes matching the repository interface, plus `changesSince`, a version and capabilities endpoint, and tombstones for deletes.
- A Postgres schema that matches the core types, with a test that checks the two schemas agree.
- Auth: setup secret for first claim, owner login, OAuth-style approval page, scoped revocable tokens, QR pairing with a short-lived single-use code.
- `src/data/adapters/remote`, the sync loop, and the "upload my local data" flow.
- A Dockerfile and compose file for non-Vercel hosting.
- The server update flow (open decision).

**Done when**
- A fresh deploy to Vercel can be claimed, paired with the app by QR code, and synced both ways.
- Local data uploads to a new backend without duplicates.
- An older app version works against a newer server version.

---

## Not now

- Android (local storage handlers keep the door open).
- Multi-user backends.
- The recipes and macros apps. Start them after this app has settled, using what it taught you about the storage layer and the schema.
- A shared repo. Create it when the second app starts and shared code exists.
- Apple Watch, CloudKit, and Face ID lock.

## Watch list

- **Expo Go limits.** The first time you add a native module, you need a development build.
- **Starter template defaults.** React Compiler and `web.output: "server"` are on. Remember them when debugging or when API routes arrive.
- **Name checks.** App Store Connect reservation, GitHub org, npm scope, and the trademark search are still open.
- **Drizzle on two databases.** Table definitions differ between SQLite and Postgres, so shared types in `src/core` plus a test that the two schemas agree is the plan.
