import { StubScreen } from "@/components/ui/StubScreen";
import { Stack } from "expo-router";

export default function HistoryRoute() {
  return (
    <>
      <Stack.Title large>History</Stack.Title>
      <StubScreen message="Workout history and edits are next in the build plan." />
    </>
  );
}