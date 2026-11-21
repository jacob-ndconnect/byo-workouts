import { Stack } from "expo-router";

// Content-sized sheet. A full-height detent is the older page sheet.
const formSheet = {
  presentation: "formSheet" as const,
  sheetGrabberVisible: true,
  sheetAllowedDetents: "fitToContents" as const,
  headerShadowVisible: false,
  headerLargeTitleEnabled: false,
  scrollEdgeEffects: {
    top: "soft" as const,
    bottom: "hidden" as const,
  },
};

const softHeader = {
  headerBackButtonDisplayMode: "minimal" as const,
  headerShadowVisible: false,
  headerTransparent: true,
  headerLargeTitleEnabled: false,
  scrollEdgeEffects: {
    top: "soft" as const,
    bottom: "hidden" as const,
  },
};

export default function WorkoutDayLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
      <Stack.Screen name="index" options={softHeader} />
      <Stack.Screen name="exercise/[exerciseId]" options={softHeader} />
      <Stack.Screen name="log" options={{ ...formSheet, title: "Log" }} />
      <Stack.Screen name="add-exercise" options={{ ...formSheet, title: "Add exercise" }} />
      <Stack.Screen name="settings" options={{ ...formSheet, title: "Settings" }} />
    </Stack>
  );
}
