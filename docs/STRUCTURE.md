# Structure

How the repo is laid out and why. This matches the `create-expo-app` default template (Expo SDK 58), which keeps routes in `src/app/` and uses the `@/` alias for `src/`.

## Layout

```
byo-workouts/
├── README.md
├── LICENSE                      Apache 2.0
├── NOTICE
├── TRADEMARKS.md                pointer; full policy will live in byo-shared
├── PRINCIPLES.md
├── DECISIONS.md
├── AGENTS.md
├── app.config.ts                Expo config; reads src/config/identity.ts
├── eslint.config.js             includes the layer rules below
├── tsconfig.json                alias: @/* -> src/*
│
├── src/
│   ├── app/                     Expo Router: routes only, thin screens
│   │   ├── _layout.tsx
│   │   ├── index.tsx            (and one file or folder per tab)
│   │   └── api/                 RESERVED for future server routes. Empty for now.
│   │
│   ├── config/
│   │   └── identity.ts          bundle ID, URL scheme, App Group and Keychain group ids
│   │
│   ├── core/                    NO react, react-native, or expo imports
│   │   ├── types/               record types (Workout, Exercise, SetEntry, ...)
│   │   ├── validation/
│   │   ├── logic/               volume, PRs, progression, unit conversion
│   │   ├── ids.ts               UUIDv7
│   │   ├── time.ts              ISO 8601 UTC helpers
│   │   └── schemaVersion.ts     "1.0"
│   │
│   ├── data/
│   │   ├── repository.ts        the interface: list / get / create / update / delete / changesSince
│   │   ├── adapters/
│   │   │   ├── sqlite/          first real implementation (expo-sqlite + Drizzle)
│   │   │   ├── memory/          tests and web layout work
│   │   │   └── remote/          later: takes baseUrl + token provider
│   │   └── migrations/          forward-only
│   │
│   ├── export/                  export and import of the documented JSON format
│   ├── features/                workouts, exercises, routines, history, settings
│   ├── components/              shared UI (template keeps this folder), with .ios / .web variants
│   ├── hooks/                   shared hooks (from the template)
│   ├── constants/               theme tokens (from the template)
│   └── platform/                iOS-only glue on the JS side (HealthKit, Shortcuts hooks, version helper)
│
├── modules/                     local Expo modules written in Swift (added when needed)
├── targets/                     widgets, Live Activities, App Intents (added when needed)
├── schema/                      published JSON Schema, versioned, with examples/
├── docs/                        this file, BUILD_PLAN.md, SETUP.md, spec drafts
├── scripts/
│   ├── reset-project.js         from the template; run once, then delete
│   └── pwa-export/              converts the existing Supabase data into the export format
├── tests/                       fixtures and adapter contract tests
└── example/                     created by reset-project, git-ignored, safe to delete
```

Folders marked "when needed" are created when their phase starts, not before.

## Layer rules

Imports go one way:

```
src/app, src/features, src/components
        │
        ▼
   src/data  (the repository interface)
        │
        ▼
    src/core
```

- `src/core` imports nothing from the rest of `src/`, and nothing from React, React Native, or Expo. This keeps it reusable by the server later.
- Screens, features, and components talk to data only through the repository interface. They never import an adapter, `expo-sqlite`, or Drizzle.
- Adapters implement the interface and may depend on `core`.
- `src/config/identity.ts` is the only place that holds the bundle ID, URL scheme, App Group, and Keychain group.
- iOS-only code goes in `src/platform/`, `modules/`, or `targets/`. Version checks for newer-iOS features go through one helper in `src/platform/`.

Both of the first two rules are enforced by ESLint. Put this in `eslint.config.js`, after the Expo config:

```js
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'example/*'] },

  // Layer rule 1: src/core is platform-agnostic and depends on nothing else in src/.
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['react', 'react-dom', 'react-native', 'react-native-*', 'expo', 'expo-*', '@expo/*'],
            message: 'src/core must stay platform-agnostic: no React, React Native, or Expo imports.',
          },
          {
            group: ['@/features/*', '@/data/*', '@/components/*', '@/platform/*', '@/export/*', '@/config/*', '@/app/*'],
            message: 'src/core cannot depend on other layers.',
          },
        ],
      }],
    },
  },

  // Layer rule 2: screens and features go through the repository interface, never an adapter.
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/data/adapters/*', 'expo-sqlite', 'drizzle-orm', 'drizzle-orm/*'],
            message: 'Use the repository interface from @/data, not a storage adapter or database library.',
          },
        ],
      }],
    },
  },
]);
```

These rules were tested against a fresh SDK 58 project: an import of `react-native` from `src/core` and an import of `expo-sqlite` from `src/features` both fail lint.

## Where things go

| If you're writing... | It goes in... |
|---|---|
| A record type or validation rule | `src/core/types` or `src/core/validation` |
| Volume, PR, or unit math | `src/core/logic` |
| A new table or column | `src/data/migrations`, then the adapter's schema, then `schema/` |
| A screen | `src/app` (thin) with its logic in `src/features/<name>` |
| A reusable button or row | `src/components` |
| HealthKit, Shortcuts, widget code | `src/platform`, `modules`, or `targets` |
| Export or import behavior | `src/export` |
| A bundle ID, scheme, or group ID | `src/config/identity.ts` only |

## Notes on the template

- The template already uses native tabs (`expo-router/native-tabs`), `expo-glass-effect`, and `@expo/ui`, which line up with the native-feel principle. Check them against iOS 18 as you go, since DECISIONS.md sets 18 as the minimum.
- The template turns on `web.output: "server"`. That matters when API routes arrive. Keep it until the Vercel spike says otherwise.
- The template enables the React Compiler. If a library misbehaves, that's the first thing to turn off while debugging.
- Use `npx expo install <package>`, not `npm install <package>`, so versions match the SDK.
