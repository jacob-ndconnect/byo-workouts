# BYO Stuff Principles

This document describes what the BYO apps are meant to be. Read it before making design or architecture decisions. When a change conflicts with something here, either the change is wrong or this document needs updating deliberately.

**BYO Stuff** is the suite. Its apps are **BYO Workouts** (`byo-workouts`), **BYO Recipes** (`byo-recipes`), and **BYO Macros** (`byo-macros`): bring your own workouts, recipes, and macros. Each is a separate app with its own repo, schema, and server.

## 1. Feel native

- Each app should feel as native to its platform as possible: liquid glass on iOS, native navigation and tabs, native controls wherever they exist.
- Integrate with platform features where it makes sense: App Intents, Siri Shortcuts, widgets, and indexing for Siri and system search (for example, recipes and last workouts).
- Interactions should feel polished and well thought out. Animation, haptics, and edge cases are part of the feature, not extras.
- The web version uses web components and should look like a good web app, not an imitation of iOS.
- iOS comes first. Android is deferred. Local storage sits behind platform-specific handlers that expose the same CRUD shape, so adding Android later doesn't touch the rest of the app.

## 2. Respect the user's attention

- Show the information a user needs when they need it, and nothing that competes with it.
- Flows are straightforward and intuitive. Users open these apps with a goal in mind and should reach it quickly.
- No engagement tricks, no nudging toward unrelated features, no feeds, no ads.
- Each app does its own job well. Users can use one app without being aware of the others.

## 3. Phone and large-screen roles

- Phones are for **doing**: working out, logging a meal, cooking from a recipe.
- Tablets and desktop web are for **analyzing and planning**: editing a routine, studying macro trends, organizing recipes.
- Large screens support every feature the phone does. They add density and side-by-side views because there's room, not separate functionality.
- Layouts adapt to width within one codebase. Platform-specific files (`.web.tsx`, `.ios.tsx`) cover the places where a component genuinely differs.

## 4. Users own their data

- Privacy and data ownership are primary features.
- Data lives on the user's device by default, or on a backend the user controls. No BYO-operated service ever holds user data.
- No accounts with us, no telemetry that identifies users, no third-party analytics SDKs.
- Export is always available, always free, complete, and in a documented open format.
- Importing that same format is always supported. Users can move between compatible apps and away from ours.
- Third-party API keys (for example, food databases) belong to the user, are stored in the Keychain, and are never sent to us.

## 5. Customizable where people differ

- Dashboards and summary views are customizable. The macros app is the clearest case: people track different macros, and some are aiming to get *enough* of something while others stay within a range.
- Targets support different relationships to a number (minimum, maximum, range, or just tracking) rather than assuming one "correct" value.
- Defaults should work without any customization. Customization is available, not required.

## 6. Easy to start, honest about complexity

- **Local mode is the default.** The app works immediately after install with no backend, no account, and no setup.
- A backend is optional, for cross-device sync and for apps that need shared data. Setup should be as close to one click as possible, followed by scanning a QR code in the app.
- Non-technical users are the target for setup and for updates. Anything a user has to do by hand, such as updating a server, needs an in-app path and a plain explanation.
- Users with local data can later upload it to a backend. The upload starts the same pairing flow as a fresh connection.

## 7. Security

- The default path is the secure path. Users don't choose secrets or configure security.
- Pairing uses a short-lived, single-use code carried in the QR code, plus the backend URL. The QR code never holds a long-lived credential.
- Apps authenticate by opening the backend's own login and approval page in a system web view (OAuth 2.0 with PKCE). Apps never see the owner's password.
- Access is granted per app, with scopes (for example, read recipes), and each grant can be revoked from the backend's web client.
- Tokens live in the iOS Keychain. A fresh deployment must require a setup secret before it can be claimed.
- Backends are single-owner.

## 8. Open ecosystem

- The backends, web clients, and apps are open source under a permissive license.
- Each app publishes a versioned schema and a CRUD API. Other developers can build compatible clients, or forks, against the same data.
- A short shared conventions document covers pairing, auth, IDs, errors, and the version and capabilities endpoint.
- The code is free to use however people like, including forks and free or ad-supported versions. The **names BYO Stuff, BYO Workouts, BYO Recipes, and BYO Macros, and the "Works with BYO" mark, are restricted** to apps that support free, complete data export in the documented open format.

## 9. Schema and versioning rules

- Changes are additive by default: new optional fields and record types are fine. Never rename, remove, or change the meaning of an existing field. A breaking change bumps the major version, and the previous major version stays supported for a long window.
- Be tolerant on both sides: ignore unknown fields when reading, and preserve unknown fields when writing.
- Every record has a UUID, `updated_at`, and a soft-delete marker. Sync, export, and cross-app references all depend on these.
- Every backend reports its schema version and capabilities. Clients check on connect and, if there's a mismatch, tell the user plainly what to update.
- Apps stay local-first even when connected. The local store is the source of truth, with a changes-since cursor for sync. Native code such as App Intents reads the local store.
- Self-hosted servers may be behind. Clients must work against a range of older server versions, and database migrations are forward-only and backward compatible.

## 10. How the apps relate

- Apps are independent. Each works fully alone and treats other BYO apps as optional.
- The recipes app owns recipe data. The macros app reads a documented **subset** of the recipe schema (title, servings, ingredients, optional per-serving nutrition, and a source reference) and ignores everything else.
- The macros app never writes to the recipes app. When a recipe is logged, its nutrition is **snapshotted** into the log entry so past days don't change when a recipe is edited.
- Recipes the macros app shows can be opened in the recipes app through a stored source reference.
- Locally, apps exchange data on iOS through a shared App Group index that the owning app publishes, never by reading each other's databases. With a backend, they use scoped read tokens issued through the same pairing flow.
- Third-party apps use a backend or the export format. They aren't expected to share a local database.

## 11. Food data and licensing

- The recipes and macros apps work with no API keys by using a free baseline source (USDA FoodData Central). User-supplied keys unlock more coverage.
- Provider terms differ on caching, storage, attribution, and redistribution. Show attribution for each provider in the UI.
- Review a provider's current terms before adding it, and before exporting its data. Exports should carry a source reference and the values the user logged, and avoid wholesale copies of provider databases.

## 12. Pricing and scope

- The web client is free. Mobile apps (and any later desktop apps) are a one-time flat fee, roughly $5, with no subscription, no paid upgrades, and no microtransactions.
- Tips are web-only. The mobile app's About screen links to the maintainer's site.
- This is a side project built to be used and extended. Decisions favor maintainability and openness over growth.

## Open questions

- Where the dashboard customization model lives in the schema, and how widely it is shared between apps.
- How the in-app server update flow works (package-based server, deploy hooks, or something else).
- The merge policy when local data is uploaded into a backend that already has data.
- Whether Android gets a local cross-app mechanism or requires a backend.
- Name checks for BYO Stuff and the three app names (App Store Connect reservation, GitHub org, npm scope, trademark search, domain), and the final trademark policy text.
- The Expo-on-Vercel one-click deploy flow, which needs a spike before the repo structure is final.
