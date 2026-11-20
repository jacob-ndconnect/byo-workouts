import type { ExpoConfig } from "expo/config";

// The .ts extension is required: Expo loads this file in Node, which does not
// resolve an extensionless TypeScript import.
import { bundleId, urlScheme } from "./src/config/identity.ts";

const config: ExpoConfig = {
  name: "byo-workouts",
  slug: "byo-workouts",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: urlScheme,
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: bundleId,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "server",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-dev-client",
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
