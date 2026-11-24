import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ scrollEdgeEffects: { top: "soft" } }}>
      <Stack.Screen name="index" options={{ headerLargeTitle: true, title: "Home" }} />
    </Stack>
  );
}