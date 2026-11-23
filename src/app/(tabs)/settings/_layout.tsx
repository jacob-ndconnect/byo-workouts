import { Stack } from "expo-router";

const formSheet = {
  presentation: "formSheet" as const,
  sheetGrabberVisible: true,
  sheetAllowedDetents: "fitToContents" as const,
  headerShadowVisible: false,
  headerLargeTitleEnabled: false,
};

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
      <Stack.Screen name="index" options={{ headerLargeTitle: true, title: "Settings" }} />
      <Stack.Screen name="exercises" options={{ title: "Exercises" }} />
      <Stack.Screen
        name="exercises/edit"
        options={{ ...formSheet, sheetAllowedDetents: [1], title: "" }}
      />
      <Stack.Screen name="routines" options={{ title: "Routines" }} />
      <Stack.Screen
        name="routines/new"
        options={{ ...formSheet, sheetAllowedDetents: [1], title: "" }}
      />
      <Stack.Screen name="routines/[id]" options={{ title: "Edit routine" }} />
      <Stack.Screen name="defaults" options={{ title: "Defaults" }} />
      <Stack.Screen name="import" options={{ title: "Import data" }} />
      <Stack.Screen name="export" options={{ title: "Export data" }} />
      <Stack.Screen name="connection" options={{ title: "Connection" }} />
    </Stack>
  );
}