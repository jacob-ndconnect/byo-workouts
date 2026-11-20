# Setup: from empty repo to the app running on your iPhone

These steps were checked against a fresh scaffold (Expo SDK 58) in a test directory. They start from a repo that contains only a README and a `.gitignore`.

## What you need

- Node.js (LTS) and npm on your computer.
- **Expo Go** from the App Store on your iPhone.
- A free Expo account, signed in on both the iPhone (in Expo Go) and the computer (in the CLI). Expo requires this for physical iOS devices.
- Your phone and computer on the same Wi-Fi network.

You do not need the Apple Developer Program for this. See the notes at the end for what Expo Go can't do.

## 1. Scaffold Expo into the existing repo

`create-expo-app` refuses to run if a `README.md` already exists, so move yours aside first:

```bash
cd byo-workouts
mv README.md ../README.byo.md
npx create-expo-app@latest . --yes
```

That installs the default template (SDK 58) and its dependencies. It also overwrites `.gitignore` with Expo's version, which is a superset of the usual ignores, and adds a `LICENSE` (Expo's MIT license), an `AGENTS.md`, and its own README.

## 2. Drop in the project files

Copy the files from the starter bundle over the scaffold, replacing whatever collides:

```
LICENSE        replaces Expo's MIT license. This repo is Apache 2.0.
NOTICE
TRADEMARKS.md
README.md      replaces the template README
AGENTS.md      replaces the template AGENTS.md; it contains the template's guidance plus the project rules
PRINCIPLES.md
DECISIONS.md
docs/STRUCTURE.md
docs/BUILD_PLAN.md
docs/SETUP.md
```

Check that `LICENSE` now begins with "Apache License" and not "The MIT License". Delete `../README.byo.md` when you're done with it.

## 3. Run it on your phone

```bash
npx expo start
```

A QR code appears in the terminal. Open the iPhone camera, point it at the code, and tap the banner to open the app in Expo Go. Sign in to your Expo account in the CLI if it asks.

If the phone can't connect, stop the server and try tunnel mode, which works across networks:

```bash
npx expo start --tunnel
```

Press `w` in the terminal to see the web version in a browser. If the app gets stuck, shake the phone and tap Reload.

## 4. Check the project

```bash
npx expo-doctor
npx tsc --noEmit
npx expo lint
```

`npx expo lint` will report one error in the template's own `use-color-scheme.web.ts` (a `setState` call inside an effect). That's starter code, and it goes away in the next step.

## 5. Clear out the starter code

Once the starter has run on your phone, reset the project:

```bash
npm run reset-project
```

This moves the starter code into `example/` (git-ignored) and leaves a blank `src/app/`. Delete `example/` when you no longer need to look at it, and delete `scripts/reset-project.js`.

Then add the layer rules from `docs/STRUCTURE.md` to `eslint.config.js`, and create the empty folders that phase 1 of `docs/BUILD_PLAN.md` fills in.

## 6. Commit

```bash
git add -A
git commit -m "Scaffold Expo SDK 58 app and project docs"
git push
```

## Limits of Expo Go

Expo Go only includes the native modules Expo ships with it. You will need a **development build** (a custom build of your own app) once you add:

- Swift modules or any library with its own native code
- Widgets, Live Activities, or App Intents
- Anything that needs custom entitlements, such as an App Group

A development build on your own phone with a free Apple ID generally works for personal testing, but the signing expires after about a week, and some capabilities (App Groups, for one) need the paid Developer Program. Check Apple's current rules before relying on that. This is the point where enrolling becomes worth it, along with TestFlight and App Store submission.

Local builds use Xcode on a Mac (`npx expo run:ios --device`). EAS Build is the cloud alternative. If Expo Go shows an SDK version mismatch on your phone, check which SDK the installed Expo Go supports, and either update Expo Go or align the project with `npx expo install expo@<version> --fix`.

## Troubleshooting

| Symptom | Try |
|---|---|
| QR scan doesn't open anything | Make sure you're using the Camera app, not Expo Go's scanner, on iOS |
| App never loads | Same Wi-Fi? Otherwise use `--tunnel` |
| Version mismatch error in Expo Go | Update Expo Go, or `npx expo install --fix` |
| Odd dependency errors | `npx expo-doctor`, then `npx expo install --fix` |
| Stale bundle | `npx expo start --clear` |
