# BYO Workouts: Decisions

Companion to `PRINCIPLES.md`. Part 1 lists decisions that are made and must be followed by whoever writes code (human or agent). Part 2 lists decisions still open, with the format each answer takes and a recommended default. Fill in Part 2 and move each item to Part 1 as it's decided.

---

## Part 1. Decided

### Scope of this phase
- Build the React Native (Expo) workout tracker first, for iOS, with a web UI from the same codebase.
- Local-first. The server, API routes, and pairing come later and must not require rewrites of the UI or data layer.
- Universal Expo app: one codebase for iOS and web (Android is deferred). Layouts adapt to width. Use `.web.tsx` or `.ios.tsx` files only where a component truly differs.
- Single owner per backend, no multi-user model.
- Scaffolded from the `create-expo-app` default template (Expo SDK 58): routes in `src/app/`, shared code under `src/`, import alias `@/` for `src/`, native tabs via `expo-router/native-tabs`. Use `npx expo install <pkg>` for dependencies, never plain `npm install <pkg>`.

### Licensing
- Apache 2.0 for all code in this repo. `LICENSE` is added at repo creation.
- The BYO names and the "Works with BYO" mark are governed by a separate `TRADEMARKS.md`, not by the license.

### Data layer rules
1. **Repository interface.** UI code never touches SQLite directly. All data access goes through a repository interface: `list`, `get`, `create`, `update`, `delete`, plus a way to read changes since a given point. The local SQLite adapter is the first implementation. A remote adapter will be added later.
2. **Record fields.** Every table has a UUID primary key, `created_at`, `updated_at`, and `deleted_at`. Deletes are soft. Never hard-delete rows that may need to sync.
3. **Change tracking.** The data layer must record enough to answer "what changed since X," including deletions, so sync can be added without a data migration. (The exact mechanism is open. See Part 2, B2.)
4. **Schema version.** The schema version is stored on the device. Migrations are forward-only.
5. **Export from the start.** The app can export all of its data as JSON in the documented format. The export is the first draft of the public spec and a safety net while the schema is still changing. Import of the same format is supported.
6. **Platform-agnostic core.** Types, validation, schema, and business logic live in a folder with no React Native or native-module imports, so the server can reuse them. Anything iOS-specific (Swift modules, App Intents, widgets) lives in its own folder.
7. **Room for the server.** Use Expo Router (routes live in `src/app/`), and leave space for a `src/app/api/` folder, but do not build it yet. Keep any future route handlers thin, with logic in the core folder.
8. **Auth as a seam.** The remote adapter, when added, takes a base URL and a token provider. In local mode neither exists. No other code should know whether a backend is connected.
9. **Connection settings.** Settings has a "Connection" screen from the start. For now it says the app is running locally. Pairing UI will go here later.
10. **Local cross-app sharing** uses an App Group shared container on iOS (a published index, not shared databases). The App Group and Keychain group identifiers are a single config value so forks can change them.

### Schema and versioning rules
- Changes are additive by default. Never rename, remove, or change the meaning of a field. Breaking changes bump the major version.
- Read tolerantly (ignore unknown fields) and write preservingly (keep unknown fields).
- Each backend will report its schema version and capabilities. Clients check on connect.
- Self-hosted servers may lag behind the app, so clients must support a range of older server versions. Migrations are forward-only and backward compatible.

### Security and pairing (for later, but design toward it now)
- Pairing uses a QR code carrying the backend URL plus a short-lived, single-use code. No long-lived secret in the QR.
- The app opens the backend's own login and approval page in a system web view (OAuth 2.0 with PKCE), and receives a scoped, revocable token stored in the iOS Keychain.
- A fresh deployment requires a setup secret before the first owner can claim it.

### Tooling
- npm, TypeScript strict, ESLint (`eslint-config-expo`), and Jest via `jest-expo` for unit tests and the adapter contract. `npm test` runs Jest once.

### Native integrations (in scope for this app over time)
- App Intents and Shortcuts, widgets, Live Activities for rest timers, Spotlight indexing, HealthKit workouts. See the bookmarked list in the project notes. None are required for the first local version, but code should not make them harder (see rule 6).

---

## Part 2. Still to decide

Format notes say exactly what shape each answer takes. "Recommended" is a suggestion, not a decision.

### A. Before the first build (identity, hard to change later)

**A1. Apple developer account** (DECIDED: personal account. Enrollment in the paid Developer Program is deferred until it blocks progress, such as for TestFlight or App Store submission. Early development happens on the owner's own phone. App Group and Keychain group registration waits for the second app.)
- Decide: personal account or an organization account.
- Format: one of `personal` or `organization`. An organization account needs a D-U-N-S number and shows the organization name as the seller.
- Why now: the Team ID anchors the App Group, Keychain group, and bundle IDs.

**A2. Bundle ID prefix** (DECIDED: `com.jacobestep.byo`, so this app is `com.jacobestep.byo.workouts`; recipes and macros will follow as `.recipes` and `.macros`. No new domain is being bought.)
- Decide: the reverse-DNS prefix shared by all BYO apps.
- Format: lowercase reverse-DNS string, like `com.example.byo`. Each app then appends its name: `<prefix>.workouts`, `<prefix>.recipes`, `<prefix>.macros`.
- Constraint: cannot change after an app is released. Convention is a domain you control.
- Recommended: base it on byostuff.com if you buy it (`com.byostuff`), otherwise your personal domain.

**A3. App Group ID**
- Decide: one group for the whole suite, or one per pair of apps.
- Format: `group.<prefix>`, for example `group.com.byostuff`.
- Recommended: one group for the suite, since all three apps may need to read each other's published indexes.

**A4. Keychain access group**
- Decide: the shared group name, if it will be shared across apps.
- Format: `$(AppIdentifierPrefix)<prefix>.shared` in the entitlements.
- Recommended: one shared group, mirroring A3.

**A5. URL scheme for deep links**
- Decide: one scheme per app.
- Format: lowercase string, for example `byo-workouts`, `byo-recipes`, `byo-macros`.
- Note: apps that need to open each other must list the other app's scheme in their config.

**A6. Domain and universal links** (DECIDED for now: do not buy a domain; if one is needed later, use a subdomain of the existing portfolio site)
- Decide: whether to buy byostuff.com now, and whether to use universal links.
- Format: yes or no for each, plus the subdomain for the association file if yes (for example `links.byostuff.com`).
- Note: custom URL schemes (A5) work without a domain, so universal links can wait.

**A7. Minimum iOS version** (DECIDED: iOS 18. Features that need newer iOS, such as liquid glass-specific APIs, must be guarded with availability checks and have a sensible fallback on 18.)
- Decide: the lowest iOS version supported.
- Format: a major version number, like `26`.
- Why: liquid glass and some native UI need recent iOS, and the on-device model features have device requirements. A higher floor means simpler code and fewer users.

**A8. GitHub org and repo visibility** (DECIDED for now: public repos under the personal GitHub account; create an org before publishing the shared repo or any npm packages)
- Decide: the org name, and whether repos are public from the start or private until ready.
- Format: org slug (like `byo-stuff`) and `public` or `private`.
- Note: the name checks (GitHub, npm scope, App Store Connect, trademark search) are still open.

### B. Before the first schema migration (data format, hard to change after real data exists)

**Status: the recommended defaults below (B1 through B7) are accepted.** Confirm Drizzle's Expo SQLite driver support against current docs before starting.

**B1. ID and timestamp formats** (DECIDED: UUIDv7 and ISO 8601 UTC strings everywhere)
- Decide: UUID version, and how timestamps are stored and exchanged.
- Format: for IDs, `uuidv4` or `uuidv7`. For timestamps, `ISO 8601 UTC string` or `integer epoch milliseconds`.
- Recommended: UUIDv7 (sortable by creation time) and ISO 8601 UTC strings everywhere, so exports, the API, and the database all agree.

**B2. Change-tracking mechanism**
- Decide: how the data layer knows what changed.
- Format: one of (a) `updated_at` only, with a per-record dirty marker for unsynced changes, or (b) an append-only changes table with a sequence number.
- Recommended: (a) for the local database, plus a server-assigned sequence number when the backend arrives. Revisit if conflicts get complicated.

**B3. Schema version format**
- Decide: how the schema version is written.
- Format: for example an integer major (`1`), or `major.minor` (`1.2`).
- Recommended: `major.minor`, where minor means additive changes.

**B4. Canonical units**
- Decide: the units stored in the database, regardless of display preference.
- Format: for weight, `kg` or `lb`. For distance, `m` or `mi`. Display conversion is separate.
- Recommended: SI units in storage, user preference at display time. Check what the existing PWA stores before choosing.

**B5. Extensions slot**
- Decide: whether records get a nullable `extensions` JSON field now.
- Format: `yes` or `no`.
- Recommended: `yes`, because adding it later is a migration and costs nothing now. Keys are namespaced by developer.

**B6. Query layer**
- Decide: how the code talks to the database.
- Format: one of `Drizzle`, `Kysely`, or raw SQL with typed helpers.
- Recommended: Drizzle, since the same schema definition can drive local SQLite and a server Postgres or SQLite. Verify current Expo SQLite driver support before committing.

**B7. Migrating existing data**
- Decide: how data from the current PWA (and its Supabase database) gets into the new app.
- Format: a one-time importer reading an export of the existing data, mapped into the new schema, or "start fresh."
- Note: this is the first real test of the export and import format.

### C. Can wait until the work reaches it

- **Web data in phase one:** web has no local mode, so decide what the web UI runs against before the server exists. Options: an in-memory adapter for layout work, or a browser-storage adapter. Format: pick one.
- **Face ID lock:** whether to offer an app lock. Format: yes or no, and when.
- **Server update flow:** how a self-hoster updates (package-based server, deploy hook, or other). Format: a short design note after the Vercel spike.
- **Merge policy** when uploading local data into a backend that already has data. Format: one sentence rule, like "newest `updated_at` wins."
- **Expo on Vercel spike** and **name availability checks.** Format: results recorded here when done.
