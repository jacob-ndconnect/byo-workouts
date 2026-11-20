# AGENTS.md

This repo is **BYO Workouts**, an Expo / React Native app (iOS and web) that is local-first now and gets an optional self-hosted backend later.

## Read before changing anything

1. `PRINCIPLES.md`: what the app is meant to be. When a change conflicts with it, stop and ask.
2. `DECISIONS.md`: Part 1 is decided and must be followed. Part 2 is open: do not guess at open decisions, and flag them instead.
3. `docs/STRUCTURE.md`: folder layout and the layer rules (they are enforced by ESLint).
4. `docs/BUILD_PLAN.md`: the current phase and what is out of scope until later.

## Project rules

- **Local-first.** The app must work fully with no backend. Do not add anything that requires a server, an account, or analytics.
- **Data access goes through the repository interface** in `src/data/repository.ts`. UI and feature code never import SQLite, Drizzle, or an adapter directly.
- **Every record** has a UUIDv7 `id`, `created_at`, `updated_at`, and `deleted_at`. Timestamps are ISO 8601 UTC strings. Deletes are soft. All writes go through the repository so `updated_at` is always set.
- **`src/core/` is platform-agnostic.** No React, React Native, or Expo imports, and no imports from other layers.
- **Schema changes are additive.** Never rename or remove a field, or change what a field means. Migrations are forward-only and live in `src/data/migrations/`.
- **iOS minimum is 18.** Anything that needs newer iOS goes behind a version check with a sensible fallback, ideally through one small helper.
- **Do not touch** the App Group, Keychain group, bundle ID, or URL scheme outside `src/config/identity.ts`.
- **Do not build** server routes, pairing, or Android support yet. Leave `src/app/api/` empty.
- Keep screens thin. Show only what is needed for the user's current goal.
- Before declaring a task done, run `npx expo lint` and `npx tsc --noEmit`.

---

## Expo and React Native guidance (from the create-expo-app template)

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.config.ts` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
