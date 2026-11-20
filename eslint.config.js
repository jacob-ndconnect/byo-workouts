// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", "example/*"] },

  // Layer rule 1: src/core is platform-agnostic and depends on nothing else in src/.
  {
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "react-native",
                "react-native-*",
                "expo",
                "expo-*",
                "@expo/*",
              ],
              message:
                "src/core must stay platform-agnostic: no React, React Native, or Expo imports.",
            },
            {
              group: [
                "@/features/*",
                "@/data/*",
                "@/components/*",
                "@/platform/*",
                "@/export/*",
                "@/config/*",
                "@/app/*",
              ],
              message: "src/core cannot depend on other layers.",
            },
          ],
        },
      ],
    },
  },

  // Layer rule 2: screens and features go through the repository interface, never an adapter.
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/data/adapters/*",
                "expo-sqlite",
                "drizzle-orm",
                "drizzle-orm/*",
              ],
              message:
                "Use the repository interface from @/data, not a storage adapter or database library.",
            },
          ],
        },
      ],
    },
  },
]);
