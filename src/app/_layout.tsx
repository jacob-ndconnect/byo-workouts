import "react-native-get-random-values";

import { brandPrimaryDark, brandPrimaryLight } from "@/constants/brandColors";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

export const unstable_settings = {
  anchor: "(tabs)",
};

const AppLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: brandPrimaryLight,
  },
};

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: brandPrimaryDark,
    text: "#FFFFFF",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? AppDarkTheme : AppLightTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout/[dayId]"
          options={{ headerShown: false, presentation: "card" }}
        />
      </Stack>
    </ThemeProvider>
  );
}