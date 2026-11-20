# BYO Workouts

A local-first workout tracker for iOS and web, part of **BYO Stuff**: bring your own workouts, recipes, and macros, and keep them.

- Works immediately after install, with no account and no server.
- Your data lives on your device, or on a backend you control. Export it any time in a documented open format.
- Optional self-hosted backend for sync, added later.

> **Status:** early development. The app is being rebuilt in React Native (Expo) from an existing PWA. Nothing here is stable yet.

## Read these first

| File | What it covers |
|---|---|
| [`PRINCIPLES.md`](PRINCIPLES.md) | What these apps are meant to be |
| [`DECISIONS.md`](DECISIONS.md) | Decisions made, and decisions still open |
| [`docs/STRUCTURE.md`](docs/STRUCTURE.md) | Folder layout and the layer rules |
| [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) | Build order, with exit criteria per phase |
| [`docs/SETUP.md`](docs/SETUP.md) | Getting the app running on your phone |
| [`AGENTS.md`](AGENTS.md) | Rules for coding agents working in this repo |

## Tooling

npm, TypeScript strict, ESLint (`npx expo lint`), and Jest (`npm test`).

The record types are described in [`docs/SCHEMA.md`](docs/SCHEMA.md).

## Run it

```bash
npm install
npx expo start
```

Then scan the QR code with your iPhone camera to open it in Expo Go. See [`docs/SETUP.md`](docs/SETUP.md) for details.

## License

Apache 2.0. See [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE). The BYO names are reserved separately: see [`TRADEMARKS.md`](TRADEMARKS.md).
