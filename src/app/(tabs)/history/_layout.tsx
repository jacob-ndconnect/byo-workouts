import { Stack } from "expo-router";

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

export default function HistoryLayout() {
  return (
    <Stack screenOptions={{ scrollEdgeEffects: { top: "soft" } }}>
      <Stack.Screen name="index" options={{ headerLargeTitle: true, title: "History" }} />
      <Stack.Screen name="edit" options={{ ...formSheet, title: "Edit" }} />
    </Stack>
  );
}
