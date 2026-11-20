# Build plan

The order of work, with what "done" means for each phase. Each phase should leave the app in a state you can run and use. Decisions that are still open are listed in `DECISIONS.md` Part 2. Anything in the "later" phases stays out of the code until its phase starts.

Current phase: **2**.

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

**Build**
- Native tabs: Workouts, History, Routines, Settings.
- Logging a workout (the part you do mid-session, so it has to be fast), exercises, routines, history, and whatever trend views you use today.
- Settings, including a **Connection** screen that says the app is running locally.
- Responsive layouts: tabs on a phone, a sidebar or split view on wide screens.
- Web: until the server exists, run the web UI against the memory adapter for layout work. A browser-storage adapter is an option if you want the web version usable on its own (DECISIONS C).

**Done when**
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
