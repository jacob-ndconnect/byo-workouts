import { type ReactNode } from "react";
import { ScrollView } from "react-native";

import { GroupedListScreen } from "@/components/ui/GroupedList";

/** Scrollable card of rows. iOS replaces this with a native list so swipe actions work. */
export function SettingsActionList({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 96 }}>
      <GroupedListScreen flush bare>
        {children}
      </GroupedListScreen>
    </ScrollView>
  );
}
