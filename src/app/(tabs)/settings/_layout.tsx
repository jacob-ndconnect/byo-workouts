import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerLargeTitle: true, title: "Settings" }} />
      <Stack.Screen name="exercises" options={{ title: "Exercises" }} />
      <Stack.Screen name="routines" options={{ title: "Routines" }} />
      <Stack.Screen name="defaults" options={{ title: "Defaults" }} />
      <Stack.Screen name="import" options={{ title: "Import data" }} />
      <Stack.Screen name="connection" options={{ title: "Connection" }} />
    </Stack>
  );
}